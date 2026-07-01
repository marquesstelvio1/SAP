# AGENT RESPONSIBILITY MAP — SAPTM

> Defines the scope, knowledge, and constraints for each agent type.

---

## ARCHITECT AGENT

**Responsible for:**
- Architecture decisions and ADRs
- Module boundaries and separation of concerns
- Scalability and deployment topology
- Cross-cutting concerns (observability, security)

**Must know:**
- `docs/enterprise/technical-architecture.md`
- `docs/enterprise/TARGET_ARCHITECTURE.md`
- `docs/adr/` (all ADRs)
- `pnpm-workspace.yaml` catalog structure
- `turbo.json` task pipeline

**Must follow:**
- Modular monolith before microservices (ADR-0002)
- oRPC contract-first API (ADR-0004)
- Prisma PostgreSQL as system of record (ADR-0005)

**References:** `docs/architecture/`, `docs/enterprise/`, `docs/rules/global.md`

---

## BACKEND AGENT

**Responsible for:**
- NestJS module implementation
- API contract compliance
- Database schema and migration management
- Business rule enforcement
- Authorization and audit integration

**Must know:**
- `packages/rpc/src/*.ts` (all RPC contracts)
- `packages/database/prisma/schema.prisma`
- `packages/auth/src/permissions.ts` (permission catalog)
- `packages/auth/src/policy.ts` (authorization evaluator)
- `docs/security/auth-context.md`
- `docs/security/authorization-policy.md`
- `docs/database/database-strategy.md`

**Must follow:**
- NestJS patterns: Module → Service → Repository → Router
- All mutations require: authorization + validation + idempotency + audit
- Repository interfaces for Prisma access
- Domain events instead of direct outbox writes
- API versioning via `/v1/rpc/` prefix

**Patterns to reuse:**
- `apps/api/src/cargo/` structure (domain/infrastructure separation)
- `apps/api/src/rpc/rpc-context.service.ts` (auth context resolution)
- `packages/rpc/src/cargo.ts` metadata patterns (permissions, audit, idempotency)

**Validation:** `pnpm typecheck` + `pnpm test` + `pnpm lint`

---

## FRONTEND AGENT

**Responsible for:**
- Next.js page implementation
- Component composition
- Data fetching patterns
- Loading/error/empty states
- Client-side form validation

**Must know:**
- `apps/web/app/` routing structure
- `apps/web/components/` domain components
- `packages/ui/src/components/` (42 shadcn components)
- `docs/design-system/shadcn-foundation.md`
- `docs/frontend/app-shell-foundation.md`
- `docs/standards/coding-standards.md`

**Must follow:**
- Server Components by default, Client Components only when needed
- All pages need: `page.tsx` + `loading.tsx` + `error.tsx`
- All data tables need pagination for >25 rows
- No inline component definitions in page files
- Use `@saptm/ui` components — never inline equivalents
- Use `cn()` for conditional classes
- Use `gap-*` not `space-*`
- Forms use `FieldGroup`/`Field` composition
- Client-side Zod validation mirroring RPC contracts

**Validation:** `pnpm typecheck` + `pnpm lint` + manual route check

---

## DESIGN SYSTEM AGENT

**Responsible for:**
- Design tokens (color, spacing, typography, motion, density, elevation, radius)
- shadcn/ui component integrity
- Accessibility (WCAG 2.2 AA)
- Visual consistency enforcement
- Theme (light/dark) implementation

**Must know:**
- `packages/ui/src/styles/globals.css` (all CSS variables)
- `packages/ui/src/tokens/index.ts` (TypeScript token exports)
- `packages/ui/src/components/` (all 42 components)
- `docs/design-system/` (tokens, strategy, shadcn foundation, base primitives)
- `components.json` (shadcn configuration)

**Must follow:**
- No raw color utility classes in product UI
- All spacing uses `--space-*` tokens
- All control heights use `--density-*` tokens
- All motion uses `--motion-*` tokens
- All z-index uses `--z-*` tokens
- All components use `cn()` for class merging
- shadcn components are source code in `packages/ui/`, not node_modules
- Dialog/Sheet/Drawer must include accessible titles
- Buttons use semantic variants, not custom styling

**Enforcement:**
- `grep` for hardcoded Tailwind values in component files
- Verify density tokens used in form components
- Verify motion tokens in transition classes

**Validation:** `pnpm lint` + visual regression check

---

## QA AGENT

**Responsible for:**
- Test coverage validation
- Regression prevention
- Contract testing
- E2E user journey validation
- Performance/load testing

**Must know:**
- `docs/testing/testing-strategy.md`
- `docs/standards/testing-standards.md`
- `apps/api/tests/` (16 integration test files)
- `packages/rpc/tests/` (11 contract test files)
- `tests/e2e/` (Playwright E2E)

**Must follow:**
- Node `--test` runner for API + RPC tests
- Playwright for E2E (chromium only, 1 worker, serial)
- Every mutation must have a forbidden-case test
- Every tenant-scoped read must have cross-tenant denial test
- Every export must have data-classification test
- Every critical action must assert audit record creation

**Validation:** `pnpm test` + `pnpm test:e2e`

---

## DEVOPS AGENT

**Responsible for:**
- CI/CD pipeline integrity
- Docker/container configuration
- Kubernetes deployment manifests
- Infrastructure-as-Code
- Environment parity
- Backup and disaster recovery

**Must know:**
- `compose.yaml` (9 services)
- `deploy/` (Kubernetes configs)
- `.github/workflows/` (9 CI/CD workflows)
- `scripts/validate-*.mjs` (47 validation scripts)
- `scripts/smoke-*.mjs` (smoke tests)

**Must follow:**
- All secrets via environment variables (Zod-validated)
- Multi-stage Docker builds for api + web
- K8s healthchecks on all services
- Rollback capability via `deploy/`
- Backup retention via `DATABASE_BACKUP_RETENTION_DAYS`

**Validation:** `pnpm validate:foundation` + `pnpm build` + smoke tests
