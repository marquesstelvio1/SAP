export const databaseProvider = "postgresql" as const;

export const auditActions = [
  "auth.session.created",
  "auth.session.revoked",
  "identity.role.assigned",
  "identity.permission.changed",
  "tenant.organization.created",
  "tenant.membership.changed",
  "integration.api_key.created",
  "integration.api_key.rotated",
  "integration.event.received",
  "tracking.shipment.created",
  "tracking.event.recorded",
  "tracking.exception.managed",
  "tracking.exception.resolved",
  "tracking.exception.updated",
  "audit.record.created",
] as const;

export type AuditAction = (typeof auditActions)[number];

export const outboxEventStatuses = ["pending", "processing", "published", "failed"] as const;

export type OutboxEventStatus = (typeof outboxEventStatuses)[number];
