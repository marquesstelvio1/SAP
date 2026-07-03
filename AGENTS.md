# SAPTM — Agent Instructions

Enterprise logistics platform (rail/port cargo operations). TypeScript monorepo.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11 (Express platform) `apps/api` |
| Frontend | Next.js 16 (App Router) `apps/web` |
| RPC | `@orpc/server` v1 — no REST endpoints |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Auth | Better Auth v1 |
| UI | shadcn/ui (new-york style), Tailwind v4, Radix |
| Validation | Zod v4 everywhere |
| Lint/Format | Biome v2 (not ESLint/Prettier) |
| Tests | Node `--test` runner (not Jest/Vitest) |
| E2E | Playwright (chromium, serial, 180s timeout) |
| Env | `dotenvx` (all commands use `dotenvx run`) |
| Monorepo | pnpm workspaces + Turborepo |

## Quick commands

```sh
pnpm dev                    # dotenvx run -- turbo run dev --parallel
pnpm build                  # turbo run build
pnpm typecheck              # turbo run typecheck (dependsOn ^build)
pnpm test                   # turbo run test --filter @saptm/api --filter @saptm/rpc
pnpm test:e2e               # node scripts/run-e2e.mjs
pnpm lint                   # biome check (not ESLint)
pnpm format                 # biome format --write

# Order always: lint → typecheck → test (typecheck needs build first)
pnpm lint && pnpm typecheck && pnpm test

# Infrastructure
pnpm infra:up               # docker compose up -d postgres redis
pnpm infra:stack            # docker compose up -d --build (full stack)
pnpm db:generate            # prisma generate
pnpm db:migrate:dev         # prisma migrate dev
pnpm db:seed                # prisma seed
pnpm db:seed:users          # seed 4 users (admin, gestora, operador, integradora)
pnpm auth:seed-local-admin  # seed admin user
pnpm worker:outbox          # start outbox worker
```

## Architecture

```
@saptm/web ──► @saptm/auth, @saptm/config, @saptm/form, @saptm/rpc, @saptm/ui
@saptm/api ──► @saptm/auth, @saptm/config, @saptm/database, @saptm/observability, @saptm/rpc
Packages ──► other packages only (never apps)
```

2 apps (`apps/api`, `apps/web`), 11 packages (`packages/`).

Backend flow: Controller → Service → Repository → Prisma. No Prisma access from Controllers.

Frontend: Server Components by default. TanStack Query for remote state. No `useEffect` for data fetching.

## RPC Contracts (key pattern)

All API communication goes through `@saptm/rpc` — no direct HTTP endpoints.

- Contracts: `packages/rpc/src/{domain}.ts` — Zod schemas + metadata per domain
- RPC operations MUST have metadata: name, version, kind, auth, permissions, audit, idempotency, criticality
- Mutations must declare auth mode; public operations must NOT have permissions
- Error catalog at `packages/rpc/src/errors.ts`

## ESM + TypeScript quirks

- `"type": "module"` everywhere
- `verbatimModuleSyntax: true` — import paths must include `.js` extension (e.g., `import { X } from "./foo.js"`)
- No `as` assertions — use type narrowing
- No `any` — use `unknown` with guards
- No `@ts-ignore` — use `@ts-expect-error` with justification
- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`

## Database

- Schema: `packages/database/prisma/schema.prisma`
- Prisma v7 requires `@prisma/adapter-pg` (no direct `prisma.$connect()`)
- ESM patching: `build` script runs `patch-esm-dist-extensions.mjs` then `patch-prisma-esm-imports.mjs`
- Tenant scoping: Prisma Client Extension at `packages/database/src/tenant-scoping.ts` (auto-injects `organizationId`)
- Tenant context: `runWithTenantContext()` from `packages/database/src/tenant-context.ts` (AsyncLocalStorage)
- All mutations: must be idempotent (idempotency keys with unique constraints) + create audit records (before/after) + use transactional outbox via `EventBus.publish()`
- No hard deletes on domain data — use status lifecycle
- Migrations applied via init container; rollback at `pnpm db:migrate:rollback`

## Testing

- Unit/integration: `.test.mjs` extension, `node --test` runner
  - API tests: `apps/api/tests/*.test.mjs` (import from `../dist/`)
  - RPC tests: `packages/rpc/tests/*.test.mjs`
- E2E: Playwright (chromium only, serial, 1 worker) at `tests/e2e/`
  - Needs full stack running (`pnpm infra:stack`)
  - Timeout: 180s per test
- Load tests: `tests/load/` (bash script)
- No Jest, no Vitest, no React Testing Library

## Security

- CSRF: double-submit cookie (csrf-csrf). Excluded paths: `/health`, `/api/auth`, `/billing/webhook`
- CSP: nonce-based via `apps/web/proxy.ts` (Next.js 16 proxy convention); nonce is consumed in the root layout and passed to `ThemeProvider` and inline scripts/styles
- CORS: restricted to trusted origins (configured via env)
- Rate limiting: `@nestjs/throttler` with Redis storage — 3 tiers (api 200/min, org 1000/min, user 100/min)
- OAuth tokens: encrypted via `encryptOAuthTokens: true` in Better Auth config
- Security headers on all responses: HSTS, CSP, XFO, COOP, CORP, Referrer-Policy, Permissions-Policy

## UX/UI & Design System Conventions

### Linguagem operacional (PT-PT)
- Toda a UI deve usar linguagem operacional/logística portuguesa (PT-PT), nunca developer-facing.
- **Proibido expor** na UI: permission names (`cargo.register`, `tracking.shipment.read`), RPC endpoints (`POST /rpc/...`), sessionId, organizationId, terms like "RBAC", "governado", "CRUD".
- Preferir termos operacionais: "Cargas" em vez de "Registo governado de cargas", "Dashboard" em vez de "Foundation Control Center".

### Opção B — Context Panel
- Governance cards (com permission names, RBAC info) substituídos por painéis de contexto operacional com KPIs, indicadores e totais.
- Cada overview header tem um card de contexto operacional (ex.: taxa de actividade, bloqueadas, em inspecção).
- Sempre que possível, apresentar dados agregados em `MetricTile` ou `ContextRow`.

### AccessState API (unificada)
- Usar `badgeLabel`, `title`, `description`, `variant` como props — **não usar `status` prop**.
- Padrão loading: `<AccessState badgeLabel="..." title="A carregar ..." description="..." />`
- Padrão erro: `<AccessState badgeLabel="..." title="... indisponivel" description="..." variant="error" />`
- Padrão bloqueio: `<AccessState badgeLabel="..." title="... bloqueado" description="..." variant="blocked" />`

### Form badges (autorização)
- Em vez de `"governado"` / `"Sem permissao"`, usar `"autorizado"` / `"indisponivel"`.
- Exemplo: `{canRegisterCargo ? "Registo autorizado" : "Registo indisponivel"}`

### Tokens críticos (globals.css)
- Sombras: `--shadow-panel`, `--shadow-overlay`, `--shadow-command`, `--shadow-sticky` mapeados no `@theme inline` (não apenas em `:root`).
- Density: `--density-row-height: 3rem` definido em `:root` (tabelas usam `height: var(--density-row-height)` no `<th>`).
- Tracking/duration: `--tracking-heading`, `--tracking-label`, `--duration-{fast,normal,slow}` mapeados no `@theme`.
- Ver `packages/ui/src/styles/globals.css` para a fonte de verdade.

### Error handling (server components)
- **Sempre** usar try/catch em server components que fazem RPC calls. Nunca deixar o Next.js error boundary capturar.
- Usar o componente `ErrorCard` de `@saptm/ui` para exibir erros gracefully.

### Turbopack on Windows (known issue)
- `next/font/google` fetch falha em ambientes com rede restrita (Windows).
- Workaround: `--webpack` flag no dev script (ver `apps/web/package.json`).
- Se o dev falhar, tentar com `pnpm dev:webpack`.

### Design QA gate (obrigatório)
- **Sempre** executar `@enterprise-design-qa` antes de entregar alterações de UI.
- O Design QA é read-only (`edit: deny`) — auditoria final de consistência visual, tokens, acessibilidade.
- Resultados vão para `audit/UX-UI-AUDIT.md` (quando aplicável).

### Audit reports disponíveis
- `audit/UX-UI-AUDIT.md` — auditoria completa de UX/UI (48 major findings)
- `audit/CODE-AUDIT.md` — auditoria de código (padrões, duplicações, tokens)
- `audit/DESIGN-SYSTEM.md` — auditoria do design system
- `audit/ENTERPRISE-SCORECARD.md` — scorecard enterprise
- `audit/GAP-ANALYSIS.md` — análise de gaps

## Multi-tenancy

- All domain data scoped to `organizationId`
- Tenant scoping middleware auto-injects organizationId filter via Prisma Client Extension
- Orgs: active, suspended, archived. Memberships: invited, active, suspended, removed
- Cross-tenant data access is prohibited and audited

## Dependency management

- All versions in `pnpm-workspace.yaml` catalog — single source of truth
- No dependency added outside catalog without ADR
- No direct `src/` imports across packages — use `@saptm/*` workspace names
- No circular dependencies

## Build artifacts

- `apps/api` builds to `apps/api/dist/` (tsc)
- `apps/web` builds to `apps/web/.next/` (next build, standalone output)
- Database package has ESM patch step after `build` (see `packages/database/package.json`)
- Typecheck (`turbo run typecheck`) requires `^build` — run `pnpm build` first or `pnpm typecheck` will build deps

## Enterprise Organization

16 departamentos de desenvolvimento de produto definidos como subagentes em `.opencode/agents/enterprise-*.md`. Invoca qualquer departamento com `@enterprise-<nome>`. Usa `Tab` para alternar para o primary agent **Enterprise Executive** (orquestrador global em `~/.config/opencode/agents/enterprise-executive.md`).

Departamentos: `product`, `ux-research`, `visual-design`, `learning-design`, `frontend`, `backend`, `database`, `architecture`, `security`, `devops`, `qa`, `performance`, `documentation`, `ai-engineering`, `design-qa`.

Cada departamento carrega conhecimento profundo do skill correspondente em `~/.agents/skills/enterprise-*/SKILL.md`.

**Design QA** é um quality gate read-only (`edit: deny`) — auditoria final obrigatória antes de entregar.

## Sprint Execution Status

### Sprint 1 — Design System + Loading Boundaries ✅ Concluído

**Task 1 — Design token consumption** ✅
- `input.tsx`: `file:h-7` → `file:h-[var(--density-compact-control-height)]`
- `skeleton.tsx`: `h-8` → `h-[var(--density-operational-control-height)]`
- `navigation-menu.tsx`: `h-9` → `h-[var(--density-compact-control-height)]`
- `sidebar.tsx`: todas hardcoded heights → density tokens
- `toggle.tsx`: `h-9/h-8/h-10` → density tokens
- `loading.tsx` (platform): `z-50` → `z-sticky`

**Task 2 — loading.tsx em 11 domain routes** ✅ Já existente

**Task 3 — error.tsx em 11 domain routes** ✅ Já existente

### Sprint 2 — Frontend Architecture + Shared Components ✅ Concluído

**Task 1 — Extract inline components from page files** ✅
- `cargo/page.tsx`: 859→77 linhas (delegado para `CargoOverviewClient`)
- `tracking/page.tsx`: 596→41 linhas (delegado para `TrackingOverviewClient`)
- Componentes extraídos: `cargo-overview-header`, `cargo-lifecycle-sections`, `cargo-status-tables`, `cargo-register-form`, `cargo-release-form`, `cargo-transport-plan-form`, `cargo-transport-depart-form`, `cargo-transport-arrive-form`, `cargo-delivery-complete-form`, `cargo-delivery-exception-record-form`, `cargo-delivery-exception-resolve-form`, `cargo-operational-handoff-record-form`, `cargo-claim-settlement-record-form`, `cargo-compliance-evidence-record-form`, `cargo-compliance-evidence-verify-form`, `cargo-lifecycle-group`, `tracking-analytics-section`, `tracking-events-section`, `tracking-event-record-form`, `tracking-exception-manage-form`, `tracking-exception-resolve-form`, `tracking-next-action-card`, `tracking-overview-header`, `tracking-status-tables`

**Task 2 — Install missing shadcn components** ✅ Já existente
- `Checkbox` usado em `SignInForm`
- Zero nativos `<input type="checkbox">` em app code
- Zero CSS `group-hover` tooltips
- Zero nativos `<select>` em app code

### Sprint 3 — Backend Architecture ✅ Concluído

**Task 1 — Implement repository pattern (cargo module)** ✅
- `cargo.repository.ts` — Interface com `CargoRepository` + `CARGO_REPOSITORY` symbol
- `prisma-cargo.repository.ts` — `PrismaCargoRepository` implementa a interface
- `cargo.entity.ts` — Aggregate root com domínio rico
- `cargo.service.ts` — Usa `@Inject(CARGO_REPOSITORY) cargoRepo: CargoRepository` (sem `prisma.cargo`)
- **Validação:** `grep -r "prisma.cargo" apps/api/src/cargo/` → 0 resultados

**Task 2 — Implement EventBus abstraction** ✅
- `packages/database/src/domain-events.ts` — `DomainEvent`, `EventBus` interfaces
- `packages/database/src/outbox-event-bus.ts` — `OutboxEventBus` implementação
- `apps/api/src/event-bus/` — `EventBusModule`, `EventBusService`, `OutboxEventBusAdapter`
- Todos os services usam `eventBus.publish()` em vez de `prisma.outboxEvent.create()`
- **Validação:** `grep -r "prisma.outboxEvent" apps/api/src/` → 0 resultados

**Task 3 — Organizations module** ✅ Já existente

### Sprint 4 — API Versioning + Pagination ✅ Concluído

**Task 1 — Add API versioning** ✅
- `rpc-http.middleware.ts`: suporta `["/v1/rpc", "/rpc"]` prefixes
- `metadata.ts`: campo `version` já definido e validado
- `docs/adr/0007-api-versioning-strategy.md`: ADR criado

**Task 2 — Add pagination to data tables** ✅
- `DataTable` component: suporta `manualPagination`, `pageIndex`, `pageCount`, `onPageChange`
- `DataTablePagination` component: navegação de páginas built-in
- `teams-table.tsx`: usa `manualPagination` com server-side
- Todas as RPC list contracts: têm schema `pagination: z.object({offset, limit})`

### Sprint 5 — Form Validation + Testing Infrastructure ✅ Concluído

**Task 1 — Write unit tests for business rules** ✅
- `cargo-service-business-rules.test.mjs`
- `capacity-service-business-rules.test.mjs`
- `tracking-service-business-rules.test.mjs`
- `evidence-services-business-rules.test.mjs`
- Mais 20+ testes RPC e integração em `apps/api/tests/` e `packages/rpc/tests/`

**Task 2 — Add client-side Zod validation** ✅
- `sign-in-form.tsx`: usa `useForm` + `zodResolver` de `@saptm/form`
- `Field`, `FieldError`, `FieldLabel` já existem em `@saptm/ui`

### Sprint 6 — DevOps + Accessibility ✅ Concluído

**Task 1 — Rewrite PowerShell scripts to Node.js** ✅
- Zero `.ps1` files — todos os scripts são `.mjs` cross-platform
- CI workflows usam `shell: bash` com `actions/setup-node@v4`

**Task 2 — Implement skip-to-content + keyboard navigation** ✅
- Skip link em `layout.tsx`: `href="#main-content"`
- `id="main-content"` presente em todas as pages principais
- `aria-live="assertive"` regions em tracking pages
- `aria-label`, focus-visible, focus-trap verificados nos componentes de diálogo

## Phase 1 — Production Hardening (execution-plan.md) ✅ Concluído

| # | Task | Status |
|---|---|---|
| 1.1 | Database backup/restore scripts | ✅ Scripts + cron workflow CI |
| 1.2 | Coverage tooling (c8) + 80% gate | ✅ `.c8rc.json` com threshold 80% |
| 1.3 | Core Web Vitals monitoring | ✅ `web-vitals-reporter.tsx` com CLS/LCP/INP |
| 1.4 | react-hook-form + zod resolver | ✅ `@saptm/form` com `useForm` + `zodResolver` |
| 1.5 | npm audit / Snyk to CI | ✅ `pnpm audit --audit-level high` no CI |
| 1.6 | Frontend DOM interaction tests | ✅ 5 E2E specs, 63 test cases (Playwright) |
| 1.7 | Expand component tests to 20/50 | ✅ 26 component test files |
| 1.8 | Migrate rate limiting to Redis | ✅ `RedisThrottlerStorage` + `TenantThrottlerGuard` |
| 1.9 | Enforce 2FA for admin roles | ✅ `two-factor.guard.ts`

## Phase 2 — Quality & Scale (execution-plan.md) ✅ Concluído

| # | Task | Status |
|---|---|---|
| 2.1 | k6 load testing (auth, cargo, tracking) | ✅ `tests/load/` com 3 cenários k6 |
| 2.2 | Bundle analysis + size budgets | ✅ `@next/bundle-analyzer` via `ANALYZE=true` |
| 2.3 | i18n framework (next-intl) | ✅ `createNextIntlPlugin` + `i18n/request.ts` |
| 2.4 | OpenAPI spec generation from oRPC | ✅ `@orpc/openapi` + Swagger UI `/api/docs` |
| 2.5 | SLIs/SLOs for 3 critical paths | ✅ `docs/observability/slos.md` (5 SLIs) |
| 2.6 | Storybook with component library | ✅ 18 stories (8 novas + 10 existentes) |
| 2.7 | aXe accessibility scanning to CI | ✅ `@axe-core/playwright` em E2E tests |
| 2.8 | Analytics event taxonomy (PostHog) | ✅ `docs/product/analytics-events.md` (38 eventos)
