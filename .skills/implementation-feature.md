---
name: implementation-feature
description: Full feature implementation workflow from requirement analysis through deployment. Covers RPC contracts, backend modules, frontend pages, tests, and validation gates.
metadata:
  origin: SAPTM CONSTITUTION — Article I, III, X
---

# Implementation: Feature

End-to-end feature implementation for the SAPTM monorepo. References Architect, Backend, Frontend, and QA agents as defined in Article X of the constitution.

## Purpose

Deliver a complete, production-ready feature — spanning RPC contract definition, backend module, frontend page, error/loading boundaries, and tests — that passes all monorepo validation gates.

## Inputs

- Product requirement or issue description (linked GitHub issue or ADR)
- Existing module patterns in `apps/api/src/modules/` or `packages/`
- Existing page patterns in `apps/web/src/app/`
- `@saptm/rpc` contract conventions from `packages/rpc/src/operations/`
- AGENTS.md constitutional rules (Articles I–X)

## Execution Steps

### Step 1 — Understand Requirements
1. Read the linked issue, ADR, or specification.
2. Identify affected domains, entities, and existing modules.
3. Determine auth mode (`public`, `authenticated`, `service`) per 2.2.1.
4. Identify required permissions and RBAC roles per 2.2.4.
5. Run `turbo run typecheck` to confirm working baseline.

### Step 2 — Analyze Existing Patterns
1. Review an existing feature module in `apps/api/src/modules/` that mirrors the new feature's complexity.
2. Review an existing page in `apps/web/src/app/` for frontend patterns.
3. Identify existing RPC operations in `packages/rpc/src/operations/` that are analogous.
4. Check `packages/database/schema.prisma` for required model changes.
5. Review `packages/ui/src/components/` for reusable components.

### Step 3 — Create RPC Contracts
1. Define input/output Zod schemas in `packages/rpc/src/operations/<feature>/`.
2. Add operation metadata: name, version, kind, auth, audit, criticality, signals (per 1.2.5).
3. Export from `packages/rpc/src/index.ts`.
4. Run `turbo run typecheck --filter=@saptm/rpc`.

### Step 4 — Implement Backend Module
1. Create `apps/api/src/modules/<feature>/` with:
   - `<feature>.module.ts` — NestJS module registration
   - `<feature>.controller.ts` — route handlers
   - `<feature>.service.ts` — business logic
   - `<feature>.types.ts` — TypeScript types
2. Register module in `apps/api/src/app.module.ts`.
3. Wire the controller into the RPC router following existing patterns.
4. Add audit logging for all mutations.
5. Implement idempotency key handling for POST/PUT endpoints.
6. Run `turbo run typecheck --filter=@saptm/api`.

### Step 5 — Implement Frontend Page
1. Create page at `apps/web/src/app/<feature>/`:
   - `page.tsx` — server component for data fetching
   - `page.tsx` uses `force-dynamic` for real-time data (per 4.3.1)
2. Implement data fetching via `apps/web/lib/<feature>.ts` using TanStack Query for client-side interactions (per 4.3.3).
3. Use server components for initial data load; minimize client component surface (per 4.3.2).
4. Wire UI components from `@saptm/ui` following shadcn patterns.
5. Connect to RPC operations via the client-side RPC bridge.
6. Add inline form validation and server error feedback (per 4.1.4).

### Step 6 — Add Loading and Error Boundaries
1. Create `apps/web/src/app/<feature>/loading.tsx` (per 4.1.1).
2. Create `apps/web/src/app/<feature>/error.tsx` (per 4.1.2).
3. Ensure empty states are informative with actionable next steps (per 4.1.3).
4. Add sonner toasts for success/failure feedback (per 4.1.5).

### Step 7 — Write Tests
1. **RPC contracts** — unit tests in `packages/rpc/tests/<feature>.test.mjs`.
2. **API module** — integration tests in `apps/api/tests/<feature>.test.mjs`.
3. **UI components** — structural rendering tests in `packages/ui/src/components/__tests__/`.
4. **E2E** — critical user journey tests in `tests/e2e/<feature>.spec.mjs`.
5. All tests use ESM (`.test.mjs`) and `node --test` runner (per 3.2.1, 6.1).
6. E2E tests use Playwright with chromium only, serial execution (per 3.2.2).

### Step 8 — Run Validation Gates
1. `turbo run lint` (Biome — per 8.5).
2. `turbo run typecheck`.
3. `turbo run test`.
4. `turbo run build`.
5. Verify gates pass per 3.3.1.

## Validation Steps

- [ ] Requirements mapped to existing patterns (Step 2)
- [ ] RPC contracts defined with full metadata (Step 3)
- [ ] Backend module created with module.ts, controller.ts, service.ts, types.ts (Step 4)
- [ ] Module registered in app.module.ts and RPC router wired (Step 4)
- [ ] Audit logging and idempotency implemented (Step 4)
- [ ] Frontend page created with server component pattern (Step 5)
- [ ] `loading.tsx` and `error.tsx` boundaries present (Step 6)
- [ ] Tests exist for contracts, API, UI, and E2E (Step 7)
- [ ] `turbo run lint`, `typecheck`, `test`, `build` all pass (Step 8)

## Definition of Done

- All validation steps checked.
- PR created with description linking to requirements.
- PR validation gates pass (lint → typecheck → test → build).
- Architect agent approves structural changes (Article X, 10.2).
- Security agent reviews auth/permission changes (Article X, 10.3).
- QA agent signs off on feature implementation (Article X, 10.4).
- Design System agent reviews UI changes if applicable (Article X, 10.5).

## Failure Conditions

- Any validation step fails → do not proceed; fix and re-run.
- TypeScript errors in any package → resolve before proceeding.
- Test failures → fix tests or implementation; re-run full suite.
- Security review identifies violation of Articles II → block until resolved.
- Cross-package boundary violation (importing from `src/` directly) → must use `@saptm/*` workspace references.

## Required Reports

- PR description summarizing changes and linking to requirements.
- Test coverage summary (contracts, integration, E2E).
- Security review checklist (auth mode, permissions, tenant isolation per 2.5).
- Architecture change summary if any structural modifications were made.
