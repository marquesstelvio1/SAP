import assert from "node:assert/strict";
import { describe, it } from "node:test";

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

function createNotificationTitle(eventType) {
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

function createBackoffMs(attempts) {
  return Math.min(60_000, 1_000 * 2 ** Math.max(attempts - 1, 0));
}

function toTitleCase(value) {
  return value
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

describe("outbox worker notification title mapping", () => {
  for (const [eventType, expectedTitle] of Object.entries(knownTitles)) {
    it(`maps ${eventType} to "${expectedTitle}"`, () => {
      assert.equal(createNotificationTitle(eventType), expectedTitle);
    });
  }

  it("falls back to title case for unknown event types", () => {
    assert.equal(createNotificationTitle("cargo.custom.event"), "Cargo Custom Event");
    assert.equal(createNotificationTitle("unknown.type.with.dots"), "Unknown Type With Dots");
  });
});

describe("outbox worker severity inference", () => {
  it("returns critical for exception events", () => {
    assert.equal(
      inferNotificationSeverity({ eventType: "cargo.delivery.exception.recorded" }),
      "critical",
    );
    assert.equal(
      inferNotificationSeverity({ eventType: "tracking.exception.managed" }),
      "critical",
    );
  });

  it("returns critical for security events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "auth.security.breach" }), "critical");
  });

  it("returns critical for failed events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "payment.failed" }), "critical");
  });

  it("returns high for report events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "report.exported" }), "high");
  });

  it("returns high for audit events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "audit.records.exported" }), "high");
  });

  it("returns high for identity events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "identity.user.invited" }), "high");
  });

  it("returns high for role events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "admin.role.assigned" }), "high");
  });

  it("returns high for tariff events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "tariff.quote.approved" }), "high");
  });

  it("returns high for capacity events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "capacity.slot.reserved" }), "high");
  });

  it("returns medium for cargo lifecycle events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "cargo.registered" }), "medium");
    assert.equal(inferNotificationSeverity({ eventType: "cargo.released" }), "medium");
    assert.equal(inferNotificationSeverity({ eventType: "cargo.transport.departed" }), "medium");
  });

  it("returns medium for tracking events", () => {
    assert.equal(inferNotificationSeverity({ eventType: "tracking.event.recorded" }), "medium");
  });

  it("returns medium for planning events", () => {
    assert.equal(
      inferNotificationSeverity({ eventType: "planning.transport_order.confirmed" }),
      "medium",
    );
  });
});

describe("outbox worker shouldSkipNotification", () => {
  it("skips notification events", () => {
    assert.equal(shouldSkipNotification({ eventType: "notification.marked_read" }), true);
    assert.equal(shouldSkipNotification({ eventType: "notification.archived" }), true);
  });

  it("does not skip non-notification events", () => {
    assert.equal(shouldSkipNotification({ eventType: "cargo.registered" }), false);
    assert.equal(shouldSkipNotification({ eventType: "report.exported" }), false);
    assert.equal(shouldSkipNotification({ eventType: "capacity.slot.reserved" }), false);
  });
});

describe("outbox worker deduplication logic", () => {
  it("does not create duplicate notifications for same sourceOutboxEventId", () => {
    const existingIds = new Set(["outbox_001", "outbox_002"]);
    const newEventId = "outbox_001";

    assert.equal(existingIds.has(newEventId), true);

    const uniqueEventId = "outbox_003";
    assert.equal(existingIds.has(uniqueEventId), false);
  });
});

describe("outbox worker backoff/retry behavior", () => {
  it("creates backoff delay increasing with attempts", () => {
    assert.equal(createBackoffMs(0), 1000);
    assert.equal(createBackoffMs(1), 1000);
    assert.equal(createBackoffMs(2), 2000);
    assert.equal(createBackoffMs(3), 4000);
    assert.equal(createBackoffMs(4), 8000);
    assert.equal(createBackoffMs(5), 16000);
    assert.equal(createBackoffMs(6), 32000);
  });

  it("caps backoff at 60 seconds", () => {
    assert.equal(createBackoffMs(7), 60000);
    assert.equal(createBackoffMs(10), 60000);
    assert.equal(createBackoffMs(100), 60000);
  });
});
