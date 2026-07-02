import path from "node:path";
import dotenv from "dotenv";

// Load environment before any other imports
dotenv.config({ path: path.resolve(import.meta.dirname, "../../../../.env") });

import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import type { PrismaTx } from "@saptm/database";
import { getPrismaClient, type SaptmPrismaClient } from "@saptm/database";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 5_000);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE ?? 50);
const MAX_RETRIES = Number(process.env.OUTBOX_MAX_RETRIES ?? 5);
const MAX_BACKOFF_MS = 60_000;

// ---------------------------------------------------------------------------
// Known titles mapping (PT-PT operational language)
// ---------------------------------------------------------------------------

const knownTitles: Record<string, string> = {
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

// ---------------------------------------------------------------------------
// Helper functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Maps an event type to a human-readable notification title in PT-PT.
 */
export function createNotificationTitle(eventType: string): string {
  return knownTitles[eventType] ?? toTitleCase(eventType.replaceAll(/[._-]/g, " "));
}

/**
 * Infers notification severity from the event type.
 */
export function inferNotificationSeverity(event: { eventType: string }): string {
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

/**
 * Determines if a notification should be skipped for the given event.
 */
export function shouldSkipNotification(event: { eventType: string }): boolean {
  return event.eventType.startsWith("notification.");
}

/**
 * Creates an exponential backoff delay in milliseconds, capped at 60 seconds.
 */
export function createBackoffMs(attempts: number): number {
  return Math.min(MAX_BACKOFF_MS, 1_000 * 2 ** Math.max(attempts - 1, 0));
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

// ---------------------------------------------------------------------------
// Types (internal)
// ---------------------------------------------------------------------------

type OutboxEventRecord = {
  id: string;
  organizationId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  eventVersion: number;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  availableAt: Date;
  createdAt: Date;
  publishedAt: Date | null;
};

// ---------------------------------------------------------------------------
// OutboxWorker — processes pending outbox events into notifications
// ---------------------------------------------------------------------------

@Injectable()
export class OutboxWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxWorker.name);
  private readonly database: SaptmPrismaClient;
  private active = false;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPollPromise: Promise<void> = Promise.resolve();

  constructor() {
    this.database = getPrismaClient();
  }

  // -----------------------------------------------------------------------
  // Lifecycle hooks
  // -----------------------------------------------------------------------

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log(
      `Starting outbox worker: pollInterval=${POLL_INTERVAL_MS}ms batchSize=${BATCH_SIZE} maxRetries=${MAX_RETRIES}`,
    );
    this.active = true;
    this.scheduleNextPoll();
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log("Shutting down outbox worker...");
    this.active = false;

    if (this.pollingTimer !== null) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Wait for the current poll cycle to finish
    await this.currentPollPromise;
  }

  // -----------------------------------------------------------------------
  // Polling
  // -----------------------------------------------------------------------

  private scheduleNextPoll(): void {
    if (!this.active) return;

    this.pollingTimer = setTimeout(() => {
      this.currentPollPromise = this.poll().catch((error: unknown) => {
        this.logger.error("Unhandled error in poll cycle", error);
      });
      this.currentPollPromise.finally(() => {
        this.scheduleNextPoll();
      });
    }, POLL_INTERVAL_MS);
  }

  private async poll(): Promise<void> {
    try {
      const pendingEvents = await this.fetchPendingEvents();
      if (pendingEvents.length === 0) return;

      this.logger.debug(`Found ${pendingEvents.length} pending outbox events`);

      const results = await Promise.allSettled(
        pendingEvents.map((event) => this.processEvent(event)),
      );

      const succeeded = results.filter(
        (r): r is PromiseFulfilledResult<boolean> => r.status === "fulfilled" && r.value,
      ).length;
      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      ).length;
      const skipped = results.filter(
        (r): r is PromiseFulfilledResult<boolean> => r.status === "fulfilled" && !r.value,
      ).length;

      if (failed > 0) {
        this.logger.warn(
          `Outbox poll: ${succeeded} published, ${skipped} skipped, ${failed} failed (of ${pendingEvents.length})`,
        );
      } else if (succeeded > 0) {
        this.logger.log(
          `Outbox poll: ${succeeded} published, ${skipped} skipped (of ${pendingEvents.length})`,
        );
      }

      for (const result of results) {
        if (result.status === "rejected") {
          this.logger.error("Outbox event processing failed", result.reason);
        }
      }
    } catch (error: unknown) {
      this.logger.error("Outbox poll cycle failed", error);
    }
  }

  private async fetchPendingEvents(): Promise<OutboxEventRecord[]> {
    const records = await this.database.outboxEvent.findMany({
      where: {
        status: "pending",
        availableAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    return records as unknown as OutboxEventRecord[];
  }

  // -----------------------------------------------------------------------
  // Event processing
  // -----------------------------------------------------------------------

  private async processEvent(event: OutboxEventRecord): Promise<boolean> {
    // 1. Atomically claim the event (optimistic lock)
    const claimed = await this.claimEvent(event.id);
    if (!claimed) {
      this.logger.debug(`Event ${event.id} already claimed by another worker`);
      return false; // skipped — another worker got it
    }

    // 2. Skip notification.* events
    if (shouldSkipNotification(event)) {
      await this.markPublished(event.id);
      return false; // skipped by design
    }

    // 3. If no organization, cannot create notification
    if (event.organizationId === null) {
      this.logger.warn(
        `Event ${event.id} has no organizationId, marking as published without notification`,
      );
      await this.markPublished(event.id);
      return false;
    }

    // organizationId is now narrowed to string
    const organizationId: string = event.organizationId;

    // 4. Create notification and mark published
    try {
      await this.database.$transaction(async (tx: PrismaTx) => {
        const notificationTitle = createNotificationTitle(event.eventType);
        const severity = inferNotificationSeverity(event);
        const message = createNotificationMessage(event);

        await tx.notification.create({
          data: {
            organizationId,
            sourceOutboxEventId: event.id,
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            title: notificationTitle,
            message,
            severity: severity as never,
            status: "unread",
          },
        });

        await tx.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });
      });

      this.logger.debug(`Published event ${event.id} (${event.eventType})`);
      return true; // published
    } catch (error: unknown) {
      // Handle duplicate notification (unique constraint on sourceOutboxEventId)
      if (isUniqueConstraintError(error)) {
        this.logger.debug(
          `Notification already exists for event ${event.id}, marking as published`,
        );
        await this.markPublished(event.id);
        return false;
      }

      // All other errors -> retry or fail
      await this.handleProcessingError(event.id, event.attempts, error);
      return false;
    }
  }

  /**
   * Atomically claims an event by setting status to "processing".
   * Returns true if the event was successfully claimed, false otherwise.
   */
  private async claimEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.database.outboxEvent.update({
        where: { id: eventId, status: "pending" },
        data: { status: "processing" },
      });
      return result !== null;
    } catch (error: unknown) {
      // P2025 = Record not found (event already claimed or doesn't exist)
      if (isRecordNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Marks an event as published without creating a notification.
   */
  private async markPublished(eventId: string): Promise<void> {
    try {
      await this.database.outboxEvent.update({
        where: { id: eventId, status: "processing" },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      // If it's already been updated, that's fine
      if (!isRecordNotFoundError(error)) {
        throw error;
      }
    }
  }

  /**
   * Handles a processing error by incrementing the attempts count and
   * either scheduling a retry (with exponential backoff) or marking as failed.
   */
  private async handleProcessingError(
    eventId: string,
    currentAttempts: number,
    error: unknown,
  ): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const willFail = newAttempts >= MAX_RETRIES;

    this.logger.warn(
      `Event ${eventId} processing failed (attempt ${newAttempts}/${MAX_RETRIES}): ${error instanceof Error ? error.message : String(error)}`,
    );

    try {
      if (willFail) {
        await this.database.outboxEvent.update({
          where: { id: eventId, status: "processing" },
          data: {
            status: "failed",
            attempts: newAttempts,
          },
        });
        this.logger.warn(`Event ${eventId} permanently failed after ${newAttempts} attempts`);
      } else {
        const backoffMs = createBackoffMs(newAttempts);
        await this.database.outboxEvent.update({
          where: { id: eventId, status: "processing" },
          data: {
            status: "pending",
            attempts: newAttempts,
            availableAt: new Date(Date.now() + backoffMs),
          },
        });
        this.logger.debug(
          `Event ${eventId} scheduled for retry in ${backoffMs}ms (attempt ${newAttempts})`,
        );
      }
    } catch (updateError: unknown) {
      // If the record is no longer in "processing" status, it was handled by another instance
      if (!isRecordNotFoundError(updateError)) {
        this.logger.error(`Failed to update error status for event ${eventId}`, updateError);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Prisma error helpers (duck-typing — consistent with exception.filter.ts)
// ---------------------------------------------------------------------------

function isPrismaError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    (error as { code: string }).code.startsWith("P")
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaError(error) && error.code === "P2002";
}

function isRecordNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === "P2025";
}

// ---------------------------------------------------------------------------
// Notification message builder
// ---------------------------------------------------------------------------

function createNotificationMessage(event: OutboxEventRecord): string {
  const title = createNotificationTitle(event.eventType);
  const aggregateInfo =
    event.aggregateType === "notification"
      ? ""
      : `Referencia: ${event.aggregateType} ${event.aggregateId}`;

  if (!aggregateInfo) {
    return `${title} — registado automaticamente.`;
  }

  return `${title} — ${aggregateInfo}.`;
}
