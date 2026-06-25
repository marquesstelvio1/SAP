# Audit: Backend — Module Structure, Service Layer, Repositories, Events, Audit Logging, Tenant Isolation

## Purpose
Verify `@saptm/api` backend code adheres to the SAPTM architecture: module structure compliance, service layer patterns, repository/data access patterns, event publishing, audit logging, and tenant isolation.

## Inputs
- `apps/api/src/` (all modules)
- `apps/api/package.json`

## Execution Steps

1. **Module structure compliance**:
   - Walk every subdirectory in `apps/api/src/` and verify the canonical four-file structure:
     - `<name>.module.ts` — NestJS module definition
     - `<name>.controller.ts` — route handler (thin, delegates to service)
     - `<name>.service.ts` — business logic
     - `<name>.types.ts` — TypeScript types and interfaces
   - Flag any directory missing one or more of the four files.
   - Verify `module.ts` imports only the controllers and providers it owns.
   - Check that cross-module imports use `@Module` exports and forward references — never direct file imports across modules.

2. **Service layer audit**:
   - Verify every service method is a single responsibility operation (no god methods).
   - Check that service methods return typed results (not `any`).
   - Ensure services depend on repositories/interfaces, not on database clients directly.
   - Validate that services call `evaluateAuthorization` for permission checks (Article II §2.2.2).
   - Check that services emit events for state changes via `EventEmitter2` or outbox pattern.

3. **Repository/data access pattern audit**:
   - Verify that data access is abstracted behind repository classes/interfaces.
   - Ensure repositories use `@saptm/database` Prisma client exclusively (no raw SQL or query builders).
   - Check that all repository queries filter by `organizationId` (tenant isolation).
   - Validate that transactions are used for multi-table operations (`prisma.$transaction`).
   - Verify that soft-delete patterns are consistent (deletedAt timestamp, filtered queries).

4. **Event publishing audit**:
   - Verify event emission uses the outbox pattern via `@saptm/database` outbox table (Article I §1.3.2).
   - Check that events are typed and include: `eventName`, `payload`, `aggregateId`, `occurredAt`.
   - Ensure event handlers are idempotent (duplicate event detection via `deduplicationId`).
   - Validate that synchronous event handlers do not block the request lifecycle (unless explicitly required).
   - Check that failed event processing has dead-letter queue handling.

5. **Audit logging audit**:
   - Verify every state-changing operation logs an audit trail.
   - Check that audit log entries include: `actorId`, `action`, `resource`, `resourceId`, `organizationId`, `timestamp`, `metadata` (diff/changes).
   - Ensure audit logs are written to a separate audit table (not mixed with business data).
   - Validate that audit logs are immutable (append-only, no update/delete operations).
   - Check that sensitive fields (passwords, tokens, PII) are redacted in audit log entries.

6. **Tenant isolation audit**:
   - Verify every service method receives the organization context (from JWT or session).
   - Check that every Prisma query includes `organizationId` in the `where` clause.
   - Ensure cross-tenant data access is guarded by `evaluateAuthorization` with tenant-scoped policies.
   - Validate that shared reference data (if any) is explicitly marked as `organizationId: null` or global.
   - Check that seed or migration scripts do not bypass tenant isolation.

7. **Error handling and validation**:
   - Verify services throw typed NestJS exceptions (not generic `Error`).
   - Ensure that exception filters catch and log all unhandled errors with correlation IDs.
   - Check that validation errors (Zod) are caught at the controller level and transformed to structured responses.
   - Validate that 500 errors include a `requestId` for debugging but no stack trace in the response.

## Validation Steps
- `turbo run build --filter=@saptm/api` passes.
- `turbo run test --filter=@saptm/api` passes.
- `turbo run lint --filter=@saptm/api` passes.
- `turbo run typecheck --filter=@saptm/api` passes.
- All service methods have unit tests in `apps/api/tests/`.
- Multi-tenant data isolation verified by integration tests (tenant A cannot see tenant B's data).
- Audit log entries appear for all state-changing operations.

## Definition Of Done
- Every module has the four canonical files; no direct file imports across modules.
- Service methods are single-responsibility, typed, and call `evaluateAuthorization`.
- Data access is abstracted behind repositories using `@saptm/database` Prisma client.
- Events use the outbox pattern with typed payloads and idempotent handlers.
- Audit logs are append-only, contain all required fields, and redact sensitive data.
- Every query filters by `organizationId`; cross-tenant access is impossible.
- Errors are typed NestJS exceptions; 500 responses include `requestId` without stack traces.

## Failure Conditions
- A module directory lacks one of the four canonical files.
- A service method returns `any` or uses `PrismaClient` directly without a repository.
- A query does not filter by `organizationId`.
- An event is emitted without going through the outbox pattern.
- An audit log entry is missing a required field (`actorId`, `action`, `resource`, `resourceId`, `organizationId`, `timestamp`).
- A sensitive field is not redacted in an audit log entry.
- A 500 error response leaks a stack trace.
- `turbo run build` fails for `@saptm/api`.

## Required Reports
- `reports/audit-backend/module-structure.json` — per-module file compliance and cross-module import violations.
- `reports/audit-backend/service-layer.json` — service method inventory with responsibility analysis, authorization checks, and typed return verification.
- `reports/audit-backend/repository-patterns.json` — repository abstraction status, tenant isolation compliance, transaction usage.
- `reports/audit-backend/event-publishing.json` — outbox pattern compliance, event type definitions, idempotency verification.
- `reports/audit-backend/audit-logging.json` — audit log entry completeness, immutable storage verification, sensitive field redaction.
- `reports/audit-backend/tenant-isolation.json` — query-level tenant filtering verification, cross-tenant access tests.
- `reports/audit-backend/summary.json` — pass/fail per step, total violations, remediation priority.
