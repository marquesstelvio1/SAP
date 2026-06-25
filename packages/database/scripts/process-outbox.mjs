import { PrismaPg } from "@prisma/adapter-pg";
import { sendInvitationEmail } from "@saptm/email";
import { PrismaClient } from "../dist/generated/prisma/client.js";

const defaultLimit = 25;
const defaultMaxAttempts = 5;
const defaultPollIntervalMs = 5_000;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const aggregate = createEmptySummary();
  let shouldContinue = true;

  while (shouldContinue) {
    const summary = await processOutboxBatch(options);
    mergeSummary(aggregate, summary);

    if (options.once || summary.claimed === 0) {
      shouldContinue = false;
      break;
    }

    await delay(options.pollIntervalMs);
  }

  console.log(JSON.stringify(aggregate, null, 2));
}

async function processOutboxBatch(options) {
  const summary = createEmptySummary();
  const now = new Date();
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: {
        in: ["pending", "failed"],
      },
      attempts: {
        lt: options.maxAttempts,
      },
      availableAt: {
        lte: now,
      },
    },
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: options.limit,
  });

  for (const event of events) {
    const claimResult = await prisma.outboxEvent.updateMany({
      where: {
        id: event.id,
        status: {
          in: ["pending", "failed"],
        },
      },
      data: {
        attempts: {
          increment: 1,
        },
        status: "processing",
      },
    });

    if (claimResult.count === 0) {
      continue;
    }

    summary.claimed += 1;

    const claimedEvent = await prisma.outboxEvent.findUniqueOrThrow({
      where: {
        id: event.id,
      },
    });

    try {
      const result = await publishOutboxEvent(claimedEvent);

      summary.published += 1;

      if (result.notificationCreated) {
        summary.notificationsCreated += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (error) {
      summary.failed += 1;
      await releaseFailedEvent(claimedEvent, error, options);
    }
  }

  return summary;
}

async function publishOutboxEvent(event) {
  const publishedAt = new Date();

  if (event.organizationId === null || shouldSkipNotification(event)) {
    await prisma.outboxEvent.update({
      where: {
        id: event.id,
      },
      data: {
        publishedAt,
        status: "published",
      },
    });

    return {
      notificationCreated: false,
    };
  }

  const notificationDraft = createNotificationDraft(event);
  let notificationCreated = false;

  await prisma.$transaction(async (transaction) => {
    const existingNotification = await transaction.notification.findUnique({
      where: {
        sourceOutboxEventId: event.id,
      },
      select: {
        id: true,
      },
    });

    if (existingNotification === null) {
      await transaction.notification.create({
        data: {
          organizationId: event.organizationId,
          sourceOutboxEventId: event.id,
          eventType: event.eventType,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          title: notificationDraft.title,
          message: notificationDraft.message,
          severity: notificationDraft.severity,
        },
      });
      notificationCreated = true;
    }

    await dispatchEmailForEvent(event);

    await transaction.outboxEvent.update({
      where: {
        id: event.id,
      },
      data: {
        publishedAt,
        status: "published",
      },
    });
  });

  return {
    notificationCreated,
  };
}

async function releaseFailedEvent(event, error, options) {
  const terminalFailure = event.attempts >= options.maxAttempts;
  const availableAt = terminalFailure
    ? event.availableAt
    : new Date(Date.now() + createBackoffMs(event.attempts));

  await prisma.outboxEvent.update({
    where: {
      id: event.id,
    },
    data: {
      availableAt,
      status: terminalFailure ? "failed" : "pending",
      payload: {
        ...normalizePayload(event.payload),
        processingError: {
          message: error instanceof Error ? error.message : String(error),
          occurredAt: new Date().toISOString(),
        },
      },
    },
  });
}

function createNotificationDraft(event) {
  const payload = normalizePayload(event.payload);
  const title = createNotificationTitle(event.eventType);
  const reference =
    readPayloadString(payload, "cargoReference") ??
    readPayloadString(payload, "referenceCode") ??
    readPayloadString(payload, "quoteReference") ??
    readPayloadString(payload, "reportId") ??
    event.aggregateId;

  return {
    title,
    message: createNotificationMessage({
      acceptUrl: readInvitationAcceptUrl(payload),
      event,
      reference,
      title,
    }),
    severity: inferNotificationSeverity(event),
  };
}

function createNotificationMessage({ acceptUrl, event, reference, title }) {
  const baseMessage = `${title} para ${event.aggregateType} ${reference}. Evento ${event.eventType} processado pelo outbox local.`;

  if (acceptUrl === undefined) {
    return baseMessage;
  }

  return `${baseMessage} Link de aceite: ${acceptUrl}`;
}

async function dispatchEmailForEvent(event) {
  if (event.eventType !== "identity.user.invited") {
    return;
  }

  const payload = normalizePayload(event.payload);
  const email = readPayloadString(payload, "email");
  const userName =
    readPayloadString(payload, "userName") ?? readPayloadString(payload, "name") ?? "Utilizador";
  const invitation = payload.invitation;
  const acceptUrl =
    invitation !== null && typeof invitation === "object" && !Array.isArray(invitation)
      ? readPayloadString(invitation, "acceptUrl")
      : undefined;

  if (email === undefined || acceptUrl === undefined) {
    return;
  }

  await sendInvitationEmail({
    to: email,
    userName,
    acceptUrl,
  });
}

function createNotificationTitle(eventType) {
  const knownTitles = {
    "admin.role.assigned": "Role atribuida",
    "admin.user.invited": "Utilizador convidado",
    "audit.records.exported": "Audit exportado",
    "capacity.advisory.decided": "Decisao de capacidade registada",
    "capacity.resource.registered": "Recurso de capacidade registado",
    "capacity.slot.cancelled": "Slot de capacidade cancelado",
    "capacity.slot.opened": "Slot de capacidade aberto",
    "capacity.slot.reserved": "Slot de capacidade reservado",
    "planning.transport_order.cancelled": "Transport order cancelada",
    "planning.transport_order.confirmed": "Transport order confirmada",
    "planning.transport_order.dispatched": "Transport order despachada",
    "planning.transport_order.rescheduled": "Transport order replaneada",
    "cargo.claim.settled": "Claim de carga liquidada",
    "cargo.compliance.evidence.recorded": "Evidencia de compliance registada",
    "cargo.compliance.evidence.verified": "Evidencia de compliance verificada",
    "cargo.delivery.completed": "Entrega de carga concluida",
    "cargo.delivery.exception.recorded": "Excecao de entrega registada",
    "cargo.delivery.exception.resolved": "Excecao de entrega resolvida",
    "cargo.operational.handoff.recorded": "Handoff operacional registado",
    "cargo.registered": "Carga registada",
    "cargo.released": "Carga liberada",
    "cargo.transport.arrived": "Transporte chegou",
    "cargo.transport.departed": "Transporte partiu",
    "cargo.transport.planned": "Transporte planeado",
    "report.exported": "Report exportado",
    "tariff.quote.approved": "Cotacao aprovada",
    "tariff.quote.calculated": "Cotacao calculada",
    "tariff.rate_card.registered": "Rate card registado",
    "tariff.rate_rule.added": "Regra tarifaria adicionada",
    "tracking.event.recorded": "Evento de tracking registado",
    "tracking.exception.managed": "Excecao de tracking gerida",
    "tracking.exception.resolved": "Excecao de tracking resolvida",
    "auth.sessions.revoked": "Sessoes revogadas",
    "identity.invitation.accepted": "Convite aceite",
    "identity.invitation.cancelled": "Convite cancelado",
    "identity.invitation.resent": "Convite reenviado",
    "identity.user.invited": "Utilizador convidado",
  };

  return knownTitles[eventType] ?? toTitleCase(eventType.replaceAll(/[._-]/g, " "));
}

function inferNotificationSeverity(event) {
  const normalizedEventType = event.eventType.toLowerCase();

  if (
    normalizedEventType.includes("exception") ||
    normalizedEventType.includes("security") ||
    normalizedEventType.includes("failed")
  ) {
    return "critical";
  }

  if (
    normalizedEventType.includes("report") ||
    normalizedEventType.includes("audit") ||
    normalizedEventType.includes("identity") ||
    normalizedEventType.includes("role") ||
    normalizedEventType.includes("tariff") ||
    normalizedEventType.includes("capacity")
  ) {
    return "high";
  }

  return "medium";
}

function shouldSkipNotification(event) {
  return event.eventType.startsWith("notification.");
}

function normalizePayload(payload) {
  if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return {};
}

function readPayloadString(payload, key) {
  const value = payload[key];

  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readInvitationAcceptUrl(payload) {
  const invitation = payload.invitation;

  if (invitation !== null && typeof invitation === "object" && !Array.isArray(invitation)) {
    return readPayloadString(invitation, "acceptUrl");
  }

  return undefined;
}

function createBackoffMs(attempts) {
  return Math.min(60_000, 1_000 * 2 ** Math.max(attempts - 1, 0));
}

function parseOptions(args) {
  const options = {
    limit: defaultLimit,
    maxAttempts: defaultMaxAttempts,
    once: false,
    pollIntervalMs: defaultPollIntervalMs,
  };

  for (const arg of args) {
    if (arg === "--once") {
      options.once = true;
      continue;
    }

    const [key, rawValue] = arg.split("=");

    if (key === "--limit") {
      options.limit = parsePositiveInteger(rawValue, defaultLimit);
      continue;
    }

    if (key === "--max-attempts") {
      options.maxAttempts = parsePositiveInteger(rawValue, defaultMaxAttempts);
      continue;
    }

    if (key === "--poll-interval-ms") {
      options.pollIntervalMs = parsePositiveInteger(rawValue, defaultPollIntervalMs);
    }
  }

  return options;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createEmptySummary() {
  return {
    claimed: 0,
    published: 0,
    notificationsCreated: 0,
    skipped: 0,
    failed: 0,
  };
}

function mergeSummary(target, source) {
  target.claimed += source.claimed;
  target.published += source.published;
  target.notificationsCreated += source.notificationsCreated;
  target.skipped += source.skipped;
  target.failed += source.failed;
}

function toTitleCase(value) {
  return value
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
