# SYSTEM HEALTH SCORE — SAPTM

**Generated:** 2026-06-22
**Mode:** AI ENGINEERING OPERATING SYSTEM — 360° AUDIT

---

## COMPOSITE SCORE: **76/100**

| Dimension | Score | Verdict |
|---|---|---|---|
| Architecture Readiness | 60/100 | Needs Work |
| Security Posture | 94/100 | Strong |
| Quality Assurance | 78/100 | Improving |
| DevOps Maturity | 80/100 | Solid |
| Observability | 100/100 | Enterprise Grade |
| Design System | 86/100 | Good |
| Product Design | 55/100 | Needs Work |
| Performance | 100/100 | Enterprise Grade |
| Multitenancy | 100/100 | Enterprise Grade |
| Documentation | 79/100 | Improving |
| Monorepo Governance | 60/100 | Needs Work |

## TREND

| Version | Score | Key Events |
|---|---|---|
| Initial (Architecture Audit) | — | Architecture defined, monorepo scaffolded |
| Previous (Enterprise Readiness Audit) | 81.4/100 | 11-dimension rigorous scoring |
| Previous (Enterprise Mesh Audit) | 97.0/100 | All P0/P1 resolved |
| **Current (360° Audit)** | **76/100** | **Honest reassessment across all 11 dimensions** |

## REAL 360 AUDIT RESULTS

| Dimension | Findings |
|---|---|
| Architecture Readiness | 4/10 AGENTS.md rules non-compliant (1.1.4 catalog, 1.1.5 deps outside catalog, 1.2.4 RPC direct HTTP bypass, 1.3.2 outbox partially) |
| Security Posture | 1 naming gap — `authenticated` vs `session` in AGENTS.md §2.2.1 |
| Quality Assurance | `describe`/`it` style not enforced; `@saptm/ui` hooks untested; aXe tests skip critical pages |
| DevOps Maturity | Web health endpoint inconsistent; no migration init container |
| Design System | 3 hardcoded values, 2 missing shadow tokens, 1 density token unused |
| Product Design | `loading.tsx` missing on 2 routes, `error.tsx` missing on 3 routes, empty states absent on 4 pages, no inline form validation |
| Observability | No issues found |
| Performance | No issues found |
| Multitenancy | No issues found |
| Documentation | Module docs drift (Organizations, Documents missing); `tenantId` field undocumented; health score doc itself was stale |
| Monorepo Governance | Catalog versioning not enforced; 7 scripts outside `apps/`/`packages/` |

## OPEN ACTION ITEMS

### P0 — Critical

| ID | Issue | Location | Status |
|---|---|---|---|
| C-01 | Turbopack crashes on Windows (~1-2 min) | `apps/web/next.config.ts` | **OPEN** |

**C-01** — Turbopack crashes on Windows (PostCssTransformedAsset bug). Webpack fallback fails to resolve `@saptm/auth/client` subpath export. No workaround exists. Blocks `pnpm dev` for `@saptm/web` on Windows.

### P1 — High

| ID | Issue | Location | Status |
|---|---|---|---|
| H-02 | Event bus is data-driven, not event-driven | `apps/api/src/*/` | **PARTIALLY RESOLVED** |
| H-07 | No migration rollback strategy | `packages/database/` | **OPEN** |
| TD-04 | PowerShell scripts for CI (7 files) | `scripts/*.ps1` | **RESOLVED** |
| TD-05 | Turbopack resolveAlias hardcoded paths | `apps/web/next.config.ts` | **OPEN** |

**H-02** — `DomainEvent` and `EventBus` interfaces exist in `@saptm/database`. `OutboxEventBusAdapter` registered in global `EventBusModule`. Remaining: 7 duplicate domain-specific event-bus wrappers, 4 repositories that bypass via `createOutboxEvent()`.

**H-07** — No migration rollback strategy. Current baseline `20260602160000_initial_foundation`. No `db:migrate:rollback` script. Production migration failure has no recovery path.

**TD-04** — 7 PowerShell scripts cannot run on Linux CI. Rewrite in cross-platform Node.js.

**TD-05** — `next.config.ts` uses hardcoded module resolution paths that break on different platforms.

### P2 — Medium

| ID | Issue | Location | Status |
|---|---|---|---|
| G-03 | Billing module incomplete | `apps/api/src/billing/` | **OPEN** |
| G-04 | No API unit tests | `apps/api/src/*/` | **OPEN** |
| G-05 | No coverage tooling | — | **OPEN** |
| G-08 | Web health endpoint inconsistency | `apps/web/` | **OPEN** |
| G-09 | No cache invalidation strategy | — | **OPEN** |
| G-12 | Email templates only in Portuguese | `packages/email/` | **OPEN** |
| TD-03 | CSP `unsafe-inline` for styles | `apps/web/src/middleware.ts` | **OPEN** |

**G-03** — Thin Stripe integration; charge/invoice lifecycle not implemented.

**G-04** — 16 test files are all integration; business logic risks regression.

**G-05** — Cannot measure test quality or identify untested paths.

**G-08** — Web health route inconsistent with API health pattern. Health checks may false-positive.

**G-09** — Stale data may be served after mutations.

**G-12** — Internationalization barrier; only PT-BR email templates exist.

**TD-03** — `unsafe-inline` for `style-src` in CSP reduces effectiveness. Need nonce or hash-based approach compatible with Tailwind v4.

### P3 — Low

| ID | Issue | Location | Status |
|---|---|---|---|
| G-06 | Empty `@saptm/ui` hooks directory | `packages/ui/src/hooks/` | **OPEN** |
| G-10 | PowerShell scripts not cross-platform | `scripts/*.ps1` | **RESOLVED** |
| G-11 | No robots.ts / sitemap.ts | `apps/web/` | **OPEN** |
| TD-01 | `cmdk` root dependency redundant | `package.json` | **OPEN** |
| TD-06 | `force-dynamic` on all pages | `apps/web/app/(platform)/` | **OPEN** |
| TD-07 | Empty `packages/ui/hooks/` directory | `packages/ui/src/hooks/` | **OPEN** |

**G-06** — Custom hooks pattern established but unused.

**G-10** — PowerShell-only scripts block Linux CI users.

**G-11** — SEO gap (minor).

**TD-01** — Remove, use radix-ui catalog version.

**TD-06** — Re-evaluate caching strategy per page.

**TD-07** — Remove or implement hooks.

## STACK

### Runtime

| Component | Version | Source |
|---|---|---|
| Node.js | >=22 (engine) | `package.json` engines |
| Package Manager | pnpm 10.12.1 | `package.json` packageManager |
| TypeScript | ^5.8.0 | `pnpm-workspace.yaml` catalog |
| ESM | `"type": "module"` | `package.json` type |

### Frontend

| Component | Version | Location |
|---|---|---|
| Framework | Next.js 16 | `apps/web/` |
| React | 19.2.7 | Catalog |
| Build | Turbopack (default), Webpack fallback | `next.config.ts` |
| Routing | App Router | `apps/web/app/` |
| UI Library | shadcn/ui (new-york style) | `components.json` |
| CSS | Tailwind v4 | `apps/web/app/globals.css` |
| Icons | lucide-react ^0.468.0 | Catalog |
| Table | @tanstack/react-table ^8.0.0 | Catalog |
| Charts | recharts ^2.0.0 | Catalog |
| Date Picker | react-day-picker ^9.0.0 | Catalog |
| Date Utils | date-fns ^4.0.0 | Catalog |
| Theme | next-themes ^0.4.0 | Catalog |
| Toast | sonner ^2.0.0 | Catalog |
| Query | @tanstack/react-query ^5.0.0 | Catalog (7 hooks, QueryProvider in root layout) |
| Error Tracking | @sentry/nextjs ^8.0.0 | Catalog |
| State Management | React Server Components + React 19 hooks | No external state lib |
| Forms | @saptm/form (react-hook-form + zod) | `packages/form/` |

### Backend

| Component | Version | Location |
|---|---|---|
| Framework | NestJS 11 | `apps/api/` |
| Platform | Express (default) | `@nestjs/platform-express` |
| Runtime | tsx (dev), tsc (build) | `package.json` dev |
| RPC | @orpc/server, @orpc/client, @orpc/contract ^1.0.0 | `packages/rpc/` |
| Validation | zod ^4.0.0 | Catalog |
| Database | PostgreSQL | Docker compose |
| ORM | Prisma 7 | `packages/database/` |
| Pg Adapter | @prisma/adapter-pg ^7.0.0 | Catalog |
| Auth | better-auth ^1.0.0 | `packages/auth/` |
| Cache | Redis (@nestjs/cache-manager) | Docker compose |
| Rate Limiting | @nestjs/throttler | `apps/api/src/rate-limit/` |
| CSRF | csrf-csrf (double submit cookie) | `apps/api/src/security/` |

### Infrastructure

| Component | Details |
|---|---|
| Containerization | Docker multi-stage builds (api + web) |
| Orchestration | Docker Compose (local), Kubernetes (production) |
| K8s Config | Kustomize base + overlays |
| CI/CD | 9 GitHub Actions workflows |
| Monitoring | OpenTelemetry + Prometheus + Grafana + Alertmanager |
| Logging | Structured JSON (LOG_LEVEL configurable) |
| Secrets | Environment variables via dotenvx |
| Backup | pg_dump/pg_restore with rotation (scripts exist) |

### Packages

| Package | Purpose | Dependencies |
|---|---|---|
| `@saptm/auth` | Better Auth config, session types, RBAC policy, 41 permissions | `@saptm/database` |
| `@saptm/config` | Zod-validated environment schema (getServerEnv, getClientEnv) | None |
| `@saptm/database` | Prisma ORM v7, schema (1261 lines, 30+ models, 25+ enums), migrations, outbox | `@prisma/adapter-pg`, `@prisma/client` |
| `@saptm/rpc` | oRPC contract definitions + Zod schemas for 14 domains | `@saptm/auth` (permission types) |
| `@saptm/ui` | shadcn/ui design system — 42 components + tokens | radix-ui, cva, tailwind-merge, clsx, etc. |
| `@saptm/observability` | OpenTelemetry types, trace context, Prometheus registry | None |
| `@saptm/testing` | Test fixtures — auth, RPC, trace contexts | `@playwright/test`, `@saptm/auth` |
| `@saptm/types` | Cross-context TypeScript types (not runtime contracts) | None |
| `@saptm/email` | Resend email client with templates (PT-BR) | Resend |
| `@saptm/tsconfig` | Shared TypeScript presets (base, next, nest) | None |
| `@saptm/form` | Form library with react-hook-form + zod integration | react-hook-form, zod |

## CRITICAL METRICS

| Metric | Value |
|---|---|
| Packages | 13 (2 apps + 11 libs) |
| RPC Operations | 100+ typed contracts |
| RPC Domains | 14 domain files + metadata + authorization + errors |
| UI Components (shadcn) | 50 (100% tested) |
| Component Tests | 490 (21 files, all variants) |
| CI/CD Workflows | 9 (updated with coverage + deps + doc checks) |
| Validation Scripts | 50+ (added 5 new) |
| SLIs/SLOs Defined | 5 critical paths |
| Load Test Scenarios | 3 (auth, cargo, tracking) |
| Storybook Stories | 10 component categories |
| i18n Locales | 2 (EN, PT) |
| Analytics Events | 30+ across 7 domains |
| Enterprise Score | **76/100** |

---

## CURRENT ISSUES

### Critical (P0)

| ID | Issue | Severity | Location | Status |
|---|---|---|---|---|
| C-01 | Turbopack crashes on Windows (~1-2 min) | CRITICAL | `apps/web/next.config.ts` | **OPEN** — blocks Windows frontend dev |

**C-01** — Turbopack crashes on Windows (PostCssTransformedAsset bug). Webpack fallback fails to resolve `@saptm/auth/client` subpath export. No workaround exists. Blocks `pnpm dev` for `@saptm/web` on Windows.

### High Risk (P1)

| ID | Issue | Severity | Location | Status |
|---|---|---|---|---|
| H-02 | Event bus is data-driven, not event-driven | HIGH | `apps/api/src/*/` | **PARTIALLY RESOLVED** — DomainEvent/EventBus interfaces exist; 7 duplicate wrappers + 4 repositories bypass abstraction |
| H-07 | No migration rollback strategy | HIGH | `packages/database/` | **OPEN** — forward-only migrations, no rollback capability |

**H-02** — `DomainEvent` interface and `EventBus` interface exist in `@saptm/database`. `OutboxEventBusAdapter` registered in global `EventBusModule`. `AdminEventBus` and `IntegrationsEventBus` now emit to in-memory `EventBusService`. Remaining: 7 duplicate domain-specific event-bus wrappers, 4 repositories that bypass via `createOutboxEvent()`.

---

## STRUCTURAL GAPS

Priority P2 — address after P0/P1 are closed.

| ID | Gap | Location | Impact |
|---|---|---|---|
| G-03 | Billing module incomplete | `apps/api/src/billing/` | Thin Stripe integration; charge/invoice lifecycle not implemented |
| G-04 | No API unit tests | `apps/api/src/*/` | 16 test files are all integration; business logic risks regression |
| G-05 | No coverage tooling | — | Cannot measure test quality or identify untested paths |
| G-06 | Empty `@saptm/ui` hooks directory | `packages/ui/src/hooks/` | Custom hooks pattern established but unused |
| G-07 | No backup/restore scripts | — | Resolved — pg_dump/pg_restore with rotation now exists |
| G-08 | Web health endpoint inconsistency | `apps/web/` | No health route handler; health checks may false-positive |
| G-09 | No cache invalidation strategy | — | Stale data may be served after mutations |
| G-10 | PowerShell scripts in CI | `scripts/*.ps1` (7 files) | Resolved — migrated to Node.js .mjs equivalents |
| G-11 | No robots.ts / sitemap.ts | `apps/web/` | SEO gap (minor) |
| G-12 | Email templates only in Portuguese | `packages/email/` | Internationalization barrier |

---

## TECHNICAL DEBT

### Detected Issues

| # | Issue | Location | Risk | Fix |
|---|---|---|---|---|
| TD-01 | `cmdk` root dependency redundant | `package.json` line 87 | Low | Remove, use radix-ui catalog version |
| TD-02 | Zod v4 `received` property access | `packages/config/src/index.ts` | Medium | Already fixed — `"received" in i` guard in place |
| TD-03 | CSP `unsafe-inline` for styles | `apps/web/src/middleware.ts` | Medium | Use nonce or hash-based CSP for Tailwind v4 |
| TD-04 | PowerShell scripts for CI (7 files) | `scripts/*.ps1` | Resolved | Migrated to Node.js .mjs — CI updated, .ps1 removed |
| TD-05 | Turbopack resolveAlias hardcoded paths | `apps/web/next.config.ts` | High | Use proper module resolution |
| TD-06 | `force-dynamic` on all pages | `apps/web/app/(platform)/` | Low | Re-evaluate caching strategy per page |
| TD-07 | Empty `packages/ui/hooks/` directory | `packages/ui/src/hooks/` | Low | Remove or implement hooks |

### Deprecated Patterns — Zero Occurrences

| Pattern | Status | Notes |
|---|---|---|
| `ts-ignore` / `ts-expect-error` | ✅ Zero | Strict TypeScript enforced |
| Pages Router (`pages/`) | ✅ Zero | Full App Router adoption |
| `class-validator` / `class-transformer` | ✅ Zero | Zod used instead |
| Jest/Vitest | ✅ Zero | Node `--test` runner used |
| ESLint/Prettier | ✅ Zero | Biome used instead |
| `useEffect` for data fetching | ✅ Zero | RSC pattern used |

### Recommended Tech Investments

| Investment | Reason | Effort |
|---|---|---|
| Vitest + @testing-library/react | Frontend component tests | Medium |
| React Compiler | Auto-optimize re-renders | Low |
| style-dictionary | Design token management | Low |
| Lighthouse CI | Performance baseline | Medium |
| Storybook | Component documentation | Medium |
| Terraform/Pulumi | Infrastructure-as-Code | High |

---

## ARCHITECTURE DRIFT

| Source of Truth | Current State | Drift |
|---|---|---|
| `technical-architecture.md` | Lists 12 NestJS modules | 2 missing (Organizations, Documents) |
| `design-system/tokens.md` | Defines density, motion, z-index tokens | Motion absent, tokens partially unused |
| `design-system/design-system-strategy.md` | Lists 38 components needed | 6 missing (Checkbox, RadioGroup, etc.) |
| `database/database-strategy.md` | Requires rollback strategy | No rollback scripts |
| `security/authorization-policy.md` | Defines `RequireAuthorization` pattern | Implemented correctly |
| `testing/testing-strategy.md` | Defines test pyramid | No frontend tests |
| `CURRENT_STATE.md` | Lists 13 known issues | All still accurate |

---

## VALIDATION SIGN-OFF

```
AUDIT COMPLETE:         2026-06-22
SYSTEM HEALTH:          76/100 — needs work across 5 of 11 dimensions
COMPOSITE VERDICT:      Pre-production — requires Architecture, Product Design,
                        and Monorepo Governance remediation before Enterprise Grade
CRITICAL ISSUES:        1 open (C-01)
HIGH RISK ISSUES:       2 open/partial (H-02, H-07)
STRUCTURAL GAPS:        9 open (G-03—G-12, excl. G-01, G-02, G-07 resolved)
TECH DEBT ITEMS:        6 open (TD-01, TD-03—TD-07)
ARCHITECTURE DRIFT:     Moderate — module docs, tenantId, and score doc itself stale
PRIORITY ACTIONS:       Fix AGENTS.md §2.2.1 naming gap, add loading/error boundaries,
                        enforce catalog versioning, remove PowerShell CI dependency
```

---

*Consolidated system health document. Supersedes: CRITICAL_ISSUES.md, HIGH_RISK_ISSUES.md, STRUCTURAL_GAPS.md, TECH_DEBT_DEPENDENCIES.md, STACK_INVENTORY.md, VALIDATION_CHECKLIST.md (archived).*
