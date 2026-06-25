---
name: implementation-api
description: API implementation skill focused on backend module creation for @saptm/api (NestJS). Covers RPC contracts, module scaffolding, audit logging, idempotency, and integration tests.
metadata:
  origin: SAPTM CONSTITUTION — Article I, II, III
---

# Implementation: API

Backend module creation workflow for the SAPTM monorepo's NestJS API layer.

## Purpose

Create a production-ready NestJS module in `@saptm/api` following the monorepo's domain module pattern. Ensures every endpoint is secured, logged, idempotency-protected, and tested.

## Inputs

- RPC contract definition (or requirement to create one)
- Existing module to reference: `apps/api/src/modules/<existing-module>/`
- Database schema from `packages/database/schema.prisma`
- AGENTS.md constitutional rules (Articles I, II, III)

## Execution Steps

### Step 1 — Define or Review RPC Contract
1. If no contract exists, create Zod input/output schemas in `packages/rpc/src/operations/<feature>/`.
2. Add operation metadata per 1.2.5: `name`, `version`, `kind`, `auth`, `audit`, `criticality`, `signals`.
3. Set auth mode (`public`, `authenticated`, `service`) per 2.2.1.
4. Export from `packages/rpc/src/index.ts`.
5. Run `turbo run typecheck --filter=@saptm/rpc`.

### Step 2 — Create NestJS Module
1. Create directory `apps/api/src/modules/<feature>/`.
2. Create files following the domain module pattern (1.2.3):

**`<feature>.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { <Feature>Controller } from './<feature>.controller';
import { <Feature>Service } from './<feature>.service';

@Module({
  controllers: [<Feature>Controller],
  providers: [<Feature>Service],
  exports: [<Feature>Service],
})
export class <Feature>Module {}
```

**`<feature>.controller.ts`**
- Use NestJS decorators (`@Controller`, `@Post`, `@Get`, etc.).
- Wire each handler to the RPC operation contract.
- Inject `@saptm/auth` guards for authorization.
- Use `evaluateAuthorization` from `@saptm/auth/policy` (2.2.2).

**`<feature>.service.ts`**
- All business logic here — controllers must not contain business logic.
- Use `@saptm/database` Prisma service for data access.
- Scope all queries by `organizationId` (2.5.1, 2.5.2).

**`<feature>.types.ts`**
- Export TypeScript types for request/response shapes.
- Re-export Zod inferred types from RPC contracts where applicable.

### Step 3 — Register Module
1. Import `<Feature>Module` in `apps/api/src/app.module.ts`.
2. Add it to the `imports` array.

### Step 4 — Wire Into RPC Router
1. Follow the existing RPC router pattern (see `apps/api/src/rpc/`).
2. Register controller methods as RPC handlers.
3. Verify the operation metadata is accessible at runtime.

### Step 5 — Add Audit Logging
1. For every mutation (POST, PUT, PATCH, DELETE), log:
   - Actor (userId), action, resource type, resource ID, organizationId, timestamp, previous state (for updates), new state.
2. Use the centralized audit service from `@saptm/auth/audit`.
3. Cross-tenant data access must be audited per 2.5.3.

### Step 6 — Add Idempotency
1. For all POST and PUT endpoints, implement idempotency key handling:
   - Accept `Idempotency-Key` header.
   - Check idempotency store (database table or cache) before processing.
   - Return cached response for duplicate keys within the expiry window.
   - Use `@saptm/database` outbox pattern if needed (1.3.2).

### Step 7 — Write Integration Tests
1. Create `apps/api/tests/<feature>.test.mjs`.
2. Use `node --test` runner (3.2.1).
3. Structure with `test.before`/`test.after` for setup/teardown (6.3).
4. Mock external services — never hit production APIs (3.2.4).
5. Test each endpoint:
   - Success path
   - Auth failure (unauthenticated)
   - Authorization failure (insufficient permissions)
   - Input validation failure
   - Idempotency replay
   - Tenant isolation (cross-tenant access denied)
6. Run `node --test apps/api/tests/<feature>.test.mjs` to verify in isolation.

### Step 8 — Run Validation Gates
1. `turbo run typecheck --filter=@saptm/api`
2. `turbo run test --filter=@saptm/api`
3. `turbo run lint`

## Validation Steps

- [ ] RPC contract defined with full metadata (Step 1)
- [ ] Module files created: module.ts, controller.ts, service.ts, types.ts (Step 2)
- [ ] Module registered in app.module.ts (Step 3)
- [ ] Controller wired into RPC router (Step 4)
- [ ] Audit logging added for all mutations (Step 5)
- [ ] Idempotency implemented for POST/PUT (Step 6)
- [ ] Integration tests cover all endpoint scenarios (Step 7)
- [ ] `typecheck`, `test`, `lint` pass (Step 8)

## Definition of Done

- All validation steps checked.
- Integration tests pass in isolation and as part of full suite.
- Security agent reviews auth and permission checks (Article X, 10.3).
- QA agent signs off on implementation (Article X, 10.4).
- PR validation gates pass (`turbo run lint && turbo run typecheck && turbo run test && turbo run build`).

## Failure Conditions

- RPC contract missing required metadata → do not proceed.
- Module fails typecheck → fix before proceeding to tests.
- Any test fails → diagnose and fix; re-run full test suite.
- Security violation (missing auth guard, missing tenant scope) → block until resolved.
- Direct import from another package's `src/` → must use `@saptm/*` workspace reference (1.1.2).
- Circular dependency detected → restructure module boundaries (1.3.6).

## Required Reports

- Test results summary (number of tests, pass/fail, coverage areas).
- Audit logging verification (list of all logged actions with their metadata).
- Idempotency implementation details (key format, expiry window, storage backend).
- Security review sign-off.
