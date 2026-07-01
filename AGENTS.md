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
- CSP: nonce-based via `apps/web/src/proxy.ts` (Next.js 16 proxy convention); nonce is consumed in the root layout and passed to `ThemeProvider` and inline scripts/styles
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

### Próximo Sprint: Sprint 2 — Frontend Architecture + Shared Components
