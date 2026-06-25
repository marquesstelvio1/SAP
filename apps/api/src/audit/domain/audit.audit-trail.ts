import type { PrismaTx } from "@saptm/database";

import type { AuditRepository } from "./audit.repository.js";

type ExportAuditInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  correlationId: string;
  subjectId: string;
  after: Record<string, unknown>;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

type ExportOutboxInput = {
  organizationId: string;
  aggregateId: string;
  payload: Record<string, unknown>;
};

export async function writeExportAuditAndOutbox(
  repository: AuditRepository,
  tx: PrismaTx,
  audit: ExportAuditInput,
  outbox: ExportOutboxInput,
): Promise<void> {
  await repository.createAuditRecord(tx, {
    organizationId: audit.organizationId,
    actorType: audit.actorType,
    actorId: audit.actorId,
    action: "audit.records.exported",
    subjectType: "audit.export",
    subjectId: audit.subjectId,
    severity: "high",
    after: audit.after,
    reason: "Governed audit export.",
    correlationId: audit.correlationId,
    ipAddress: audit.ipAddress,
    userAgent: audit.userAgent,
  });

  await repository.createOutboxEvent(tx, {
    organizationId: outbox.organizationId,
    eventType: "audit.records.exported",
    aggregateType: "audit.export",
    aggregateId: outbox.aggregateId,
    payload: outbox.payload,
  });
}
