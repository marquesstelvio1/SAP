# Audit: Multi-Tenancy

## Purpose
Audit tenant isolation across the SAPTM monorepo. Verify all domain data is scoped to `organizationId`, every query and mutation filters by the authenticated user's organization context, cross-tenant access is prohibited, and the permission system correctly resolves organization-scoped roles.

## Inputs
- `apps/api/src/modules/*/service.ts` — all domain service files
- `apps/api/src/modules/*/controller.ts` — controller files
- `packages/rpc/src/operations/` — RPC contracts
- `packages/database/src/schema/` — database schema (if using Prisma/raw SQL)
- `packages/database/src/queries/` — database query files
- `packages/auth/src/policy/` — authorization policy engine
- `packages/auth/src/guards/` — auth guards

## Execution Steps
1. **OrganizationId Scoping** (Rule 2.5.1)
   - Scan all database query files and service methods for `organizationId` filtering.
   - Verify every `findMany`, `findUnique`, `create`, `update`, `delete`, `upsert`, or raw SQL query includes `organizationId` in the `where` clause.
   - For `create` operations, verify `organizationId` is set from the authenticated user's context (not from request body).
   - For `update` and `delete`, verify `organizationId` is included in the `where` clause (not just the record ID).
   - Flag any query missing `organizationId` filter as P0.

2. **Tenant Context Resolution**
   - Verify the authenticated user's organization ID is extracted from the session/JWT in a consistent way:
     - Check `request.user.organizationId` or equivalent is available in all request contexts.
     - Verify the auth guard or middleware attaches organization context to the request.
     - Confirm there is a helper/service method to get the current organization ID.
   - Flag inconsistent tenant context access as P1.

3. **Cross-Tenant Access Prohibition** (Rule 2.5.3)
   - Verify there are no endpoints or services that bypass organizationId filtering.
   - Check admin/service endpoints carefully — if they exist, verify they have explicit authorization checks (not just relying on organizationId).
   - Scan for `where` clauses that only use `id` without `organizationId` in update/delete operations.
   - Verify that bulk operations respect tenant boundaries.
   - Flag any cross-tenant access vector as P0.

4. **Audit Record Tenant Isolation**
   - Open audit-related code (likely in `packages/observability` or `apps/api/src/modules/audit/`).
   - Verify `AuditRecord` schema includes `organizationId`.
   - Check that all audit log writes include the originating organization ID.
   - Confirm audit queries filter by organizationId.
   - Flag missing organizationId on audit records as P1.

5. **Permission Resolution** (Rule 2.2.2–2.2.4)
   - Open `packages/auth/src/policy/`.
   - Verify `evaluateAuthorization` checks permissions against organization-scoped roles.
   - Confirm roles are resolved within the user's organization context (not globally).
   - Check that permission evaluation includes the target `organizationId`.
   - Verify `ALL` and `ANY` modes are supported.
   - Flag organization-agnostic permission checks as P0.

6. **RPC Contract Tenant Metadata**
   - Open RPC contracts in `packages/rpc/src/operations/`.
   - Verify each operation that accesses domain data has `kind: 'mutation'` or `kind: 'query'` with appropriate tenant context.
   - Check that contract input schemas do NOT include `organizationId` as a client-provided field (it should come from the server context).
   - Flag client-provided organizationId on inputs as P1.

7. **Testing Tenant Isolation**
   - Check integration tests in `apps/api/tests/` for multi-tenant scenarios:
     - User from Org A should not access Org B's data.
     - Test both query and mutation endpoints.
     - Test that passing another org's ID in params/body is rejected.
   - Flag missing multi-tenant test coverage as P2.

## Validation Steps
- [ ] All `findMany`/`findUnique` queries include `organizationId` filter
- [ ] All `create` operations set `organizationId` from session context
- [ ] All `update`/`delete` operations include `organizationId` in where clause
- [ ] No endpoint allows client-provided `organizationId`
- [ ] Auth guard attaches organization context to request
- [ ] Audit records include `organizationId`
- [ ] Permission evaluation is organization-scoped
- [ ] RPC contracts do not accept `organizationId` from client
- [ ] Integration tests verify cross-tenant isolation
- [ ] Bulk operations respect tenant boundaries

## Definition of Done
- Every database query that touches domain data is scoped by `organizationId`.
- Tenant context is consistently resolved from authenticated session.
- Permission system evaluates roles within the organization context.
- Audit trail includes organization ID for all tenant-scoped events.
- Integration tests prove tenant isolation works correctly.
- No cross-tenant access vectors exist.

## Failure Conditions
- Any query missing `organizationId` filter — **P0**
- Client can provide `organizationId` on create — **P0**
- Update/delete by ID without organizationId check — **P0**
- Permission resolution not scoped to organization — **P0**
- Audit record missing organizationId — **P1**
- Missing tenant isolation tests — **P2**

## Required Reports
- `audit-multitenancy-queries.md` — query-by-query organizationId analysis
- `audit-multitenancy-permissions.md` — permission engine tenant scoping
- `audit-multitenancy-audit.md` — audit record tenant isolation
- `audit-multitenancy-tests.md` — test coverage analysis
- `audit-multitenancy-summary.md` — pass/fail with severity
