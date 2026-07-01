import type { PrismaTx } from "@saptm/database";

import type { AdminRepository } from "./admin.repository.js";

type AuditAndOutboxInput = {
  organizationId: string;
  actorType: string;
  actorId: string;
  correlationId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  action: string;
  subjectType: string;
  subjectId: string;
  aggregateType: string;
  aggregateId: string;
  before?: Record<string, unknown> | undefined;
  after: Record<string, unknown>;
  payload?: Record<string, unknown> | undefined;
  reason: string;
  sourceSystem: string;
  idempotencyKey: string;
};

export async function writeAdminAuditAndOutbox(
  repository: AdminRepository,
  tx: PrismaTx,
  input: AuditAndOutboxInput,
): Promise<void> {
  await repository.createAuditRecord(tx, {
    organizationId: input.organizationId,
    actorType: input.actorType,
    actorId: input.actorId,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    severity: "critical",
    ...(input.before === undefined ? {} : { before: input.before }),
    after: input.after,
    reason: input.reason,
    correlationId: input.correlationId,
    ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
    ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
  });

  await repository.createOutboxEvent(tx, {
    organizationId: input.organizationId,
    eventType: input.action,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    payload: {
      ...(input.payload ?? input.after),
      idempotencyKey: input.idempotencyKey,
      sourceSystem: input.sourceSystem,
    },
  });
}
