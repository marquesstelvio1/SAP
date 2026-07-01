# Diagnostic: Database

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Database Schema & Data Access
**Date:** 2026-06-23

---

## Current State

PostgreSQL 17 via Prisma ORM v7 with `@prisma/adapter-pg`. 20 models, 28 enums. Multi-tenant by design. Transactional outbox pattern. Immutable audit trail.

## Problems

1. **Missing indexes** — `Session.userId` and `ApiKey.serviceAccountId` lack indexes; query degradation at scale.
2. **Unbounded audit index** — `[organizationId, subjectType, subjectId, createdAt]` is a large composite index on a high-write table.
3. **Outbox worker not running** — `worker:outbox` script exists but no process management ensures it runs continuously.
4. **No connection pooling** — `DATABASE_POOL_SIZE` env var is declared but not confirmed used.
5. **Migration rollback** — Custom rollback script exists but no standardized rollback process.
6. **No read replicas** — No read/write splitting for query-heavy operations.

## Technical Debt

- Some fields have `@default(cuid())` while others use `@id` from Better Auth — inconsistent ID generation.
- `Json` type fields (before/after on AuditRecord, payload on IntegrationEvent) are unvalidated.

## Risks

- **High:** Missing indexes on Session table will degrade auth performance at scale.
- **High:** Outbox worker not running means event-driven architecture is broken.
- **Medium:** Audit table will slow writes as it grows without partition strategy.

## Impact

Production database performance will degrade linearly with data growth. Event-driven features are non-functional.

## Priority

High

## Recommended Actions

1. Add indexes on `Session.userId` and `ApiKey.serviceAccountId`.
2. Implement partition strategy for `AuditRecord` (by month/quarter).
3. Deploy outbox worker as a long-running process with supervisor.
4. Validate and enable connection pooling via `pgBouncer` or `@prisma/adapter-pg` pool config.
5. Add JSON schema validation for payload fields.
6. Document migration rollback process with tested scripts.

## Estimated Effort

5-7 days

## Owner Agent

database
