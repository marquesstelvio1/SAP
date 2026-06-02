# Audit Trail Foundation

## Purpose

Audit trail is append-only evidence for sensitive platform and logistics operations.

`@saptm/database` owns the persistable audit shape and safe writer contract. `@saptm/observability` owns the runtime telemetry record shape.

## Database Contract

`AuditRecord` persists:

- Tenant scope via `organizationId`.
- Actor type and optional actor identifier.
- Action name.
- Subject type and optional subject identifier.
- Before/after snapshots when safe.
- Reason, IP address, user agent, and correlation ID.
- Severity and creation timestamp.

## Shared Helpers

`@saptm/database` exposes:

- `createPersistableAuditRecord`
- `createAuditRecordFromTelemetry`
- `createPrismaMutationAuditRecord`
- `createAuditTrailWriter`
- `isPrismaMutationOperation`

## Prisma Hook Boundary

The foundation defines a safe mutation hook adapter instead of installing implicit global Prisma middleware.

This is intentional:

- Audit classification must be explicit per mutation.
- Secrets and sensitive payloads must be redacted before snapshots.
- Tenant and actor context must come from validated request context.
- Bulk mutations need explicit subject and reason handling.

## Required Adoption

Every future mutation task must specify:

- Audit action name.
- Subject type and subject ID source.
- Severity.
- Snapshot policy.
- Redaction policy.
- Failure behavior if audit write fails.
