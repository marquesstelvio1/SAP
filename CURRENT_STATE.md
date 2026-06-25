# CURRENT STATE — SAPTM Monorepo

## Overview

| Aspect | Value |
|--------|-------|
| **Monorepo** | pnpm workspace (catalog versioning) |
| **Node** | >=22, ESM (`"type": "module"`) |
| **Package Mgr** | pnpm 10.12.1 (Corepack) |
| **Turbo** | turbo 2.9.16 |
| **Linter/Formatter** | Biome (spaces, 2 indent, 100 width, double quotes) |
| **Apps** | 2 (`@saptm/api`, `@saptm/web`) |
| **Packages** | 10 (auth, config, database, rpc, ui, types, testing, observability, email, tsconfig) |
| **Validation scripts** | 30+ validate:* scripts + smoke tests |

---

## Architecture

### Apps

#### `@saptm/api` — NestJS 11 (Express platform)
- **Port**: 4000
- **Dev**: `tsx watch src/main.ts` via dotenvx
- **Build**: `tsc -p tsconfig.json`
- **Modules**: 16 feature modules + AppModule
- **Controllers**: 2 (HealthController, MetricsController)
- **Global Guards**: AuthorizationGuard (authz), ThrottlerGuard (rate limit)
- **Global Interceptors**: ObservabilityInterceptor (tracing/metrics/logging)
- **Global Filters**: RpcExceptionFilter (error → RPC envelope)
- **Middlewares**: AuthContextMiddleware, ObservabilityMiddleware, RpcHttpMiddleware, applySecurityHeaders, cookieParser, createCsrfMiddleware
- **Pipes**: None (validation delegated to @saptm/rpc Zod schemas)
- **RPC**: @orpc/server via RPCHandler at `/rpc` and `/v1/rpc`
- **Structure per domain**: `module.ts` + `service.ts` + `*-rpc.router.ts` + `domain/` (repository, dto, events, business-rules, audit-trail) + `infrastructure/` (prisma-*, event-bus)
- **Domains**: admin, audit, auth, cache, capacity, cargo, health, integrations, notifications, observability, planning, rate-limit, reports, rpc, security, tariff, tracking

#### `@saptm/web` — Next.js 16 (App Router, standalone output)
- **Port**: 3000
- **Dev**: `next dev` via dotenvx (Turbopack default)
- **Build**: `next build` (standalone)
- **Runtime**: Turbopack (crashes on Windows after ~1-2min — known PostCssTransformedAsset bug)
- **Workaround**: `next dev --webpack` (but fails on `@saptm/auth/client` resolve aliases)
- **Pages (23 routes)**: `/`, `/robots.txt`, `/sitemap.xml`, `/sign-in`, `/two-factor`, `/accept-invitation`, `/app`, `/app/admin`, `/app/audit`, `/app/audit/export`, `/app/capacity`, `/app/cargo`, `/app/integrations`, `/app/notifications`, `/app/planning`, `/app/reports`, `/app/security`, `/app/tariffs`, `/app/tracking`, `/app/tracking/[shipmentId]`, `/api/auth/[...all]`, `/api/health`, `/_not-found`
- **Loading/Error states**: Every route has `loading.tsx` + `error.tsx`
- **Server Components**: All page.tsx are RSC
- **Client Components**: Domain components (tracking, cargo forms etc.)
- **Auth**: `requirePlatformSession()` in every platform page
- **Components dir**: 72+ files across domain subdirs

### Packages

| Package | Purpose | Key Deps |
|---------|---------|----------|
| `@saptm/auth` | Better Auth config, 41 permissions, RBAC policy, API key auth, invitations | better-auth, @saptm/database |
| `@saptm/config` | Zod env validation (server + client) | zod |
| `@saptm/database` | Prisma v7 client driver adapter, audit trail, outbox, RBAC bootstrap | @prisma/adapter-pg, @prisma/client |
| `@saptm/rpc` | @orpc contract definitions + Zod schemas for all domains | @orpc/server, zod |
| `@saptm/ui` | 42 shadcn/ui components + design tokens (8 categories) + charts | radix-ui, cva, tailwind-merge, sonner, @tanstack/react-table, recharts, react-day-picker, next-themes |
| `@saptm/observability` | Telemetry types, logging, metrics, Prometheus registry | (none) |
| `@saptm/email` | Resend email client, PT templates | resend |
| `@saptm/types` | Shared runtime types (health, env) | (none) |
| `@saptm/testing` | Test fixtures (auth, RPC, trace) | @playwright/test, @saptm/auth |
| `@saptm/tsconfig` | Shared TS configs (base, next, nest) | (none) |

---

## Database (Prisma v7, PostgreSQL)

- **1134 lines schema**
- **Models**: User, TwoFactor, Session, Account, Verification, Organization, Membership, Role, Permission, RolePermission, MembershipRole, AuditRecord, OutboxEvent, Notification, ServiceAccount, ApiKey, IntegrationEvent, Cargo, CargoDeliveryException, CargoClaimSettlement, CargoOperationalHandoff, CargoComplianceEvidence, CapacityResource, CapacitySlot, CapacitySlotReservation, CapacityAdvisoryDecision, TrackingShipment, TrackingEvent, TransportOrder, TransportOrderDispatch, TransportOrderScheduleRevision, TariffRateCard, TariffRateRule, TariffQuote
- **Outbox Pattern**: OutboxEvent table, async worker `scripts/process-outbox.mjs`
- **Audit Trail**: AuditRecord table with severity, actor, action tracking
- **RBAC**: Permission (36 seed) + Role (12 templates) + MembershipRole
- **Idempotency**: Multiple idempotency keys across cargo lifecycle
- **Connection Pooling**: pg-pool, configurable size, 10s timeout, 30s idle

---

## Auth & Security

- **Better Auth**: email/password, 2FA (TOTP), 7-day session, 24h update age
- **RBAC**: 36 permissions, 12 role templates, custom evaluation engine
- **API Keys**: SHA-256 hashed, `saptm_sk` prefix, scoped to service accounts
- **CSRF**: `csrf-csrf` double submit cookie pattern, `__Host-saptm-csrf` cookie
- **Rate Limiting**: 200 req/60s (NestJS ThrottlerModule)
- **Security Headers**: CSP, HSTS, X-Frame-Options, Permissions-Policy, etc.
- **CORS**: Env-configured origins, explicit allowed headers
- **Cookie Signing**: cookie-parser with BETTER_AUTH_SECRET

---

## Observability

- **OpenTelemetry**: Collector + traces + metrics + logs
- **Prometheus**: In-memory registry, `/metrics` endpoint
- **Grafana**: Provisioned dashboards + datasources
- **Alertmanager**: Configured routing
- **Structured Logging**: Correlation ID, request ID, trace context
- **Docker Stack**: postgres, redis, api, web, otel-collector, prometheus, alertmanager, grafana

---

## DevOps

- **Docker**: Multi-stage builds for api + web
- **Compose**: 9 services with healthchecks, volumes, dependencies
- **CI/CD**: 9 GitHub Actions workflows
- **K8s**: Base + cluster + overlays + networking + observability configs
- **Validation**: 30+ validate scripts covering foundation, deployments, security, DR, TLS, observability, cluster, resilience

---

## Testing

- **API**: 14 test files (node:test runner), `*.test.mjs`
- **RPC**: 11 test files (node:test runner)
- **E2E**: Playwright (chromium, 1 worker, serial)
- **Coverage**: Not measured (no coverage tool configured)

---

## Design System

- **Framework**: shadcn/ui new-york style, Tailwind v4
- **Components**: 42 (incl. Toast, DataTable, Calendar, DatePicker, Charts, SearchPalette, EmptyState, Skeleton variants, ThemeToggle, ThemeProvider)
- **Tokens**: 8 categories (color, status, typography, density, radius, elevation, spacing, motion)
- **Hooks**: Empty (no custom hooks)
- **Dark Mode**: next-themes via ThemeProvider + ThemeToggle (button/switch modes)
- **Density**: Input, Button, SelectNative, Textarea, Badge, TableHead — all support comfortable/compact/operational

---

## Known Issues / Gaps

1. **Turbopack crashes on Windows** after ~1-2min (PostCssTransformedAsset child process bug)
2. **Webpack fails** to resolve `@saptm/auth/client` subpath export when `--webpack` flag used
3. **No frontend unit tests** (no Jest/Vitest configured)
4. **No coverage tooling** configured
5. **No Sentry or error tracking** integration
6. **No backup/restore scripts** for database
7. **ui/hooks** directory is empty
8. **Email templates** only in Portuguese
9. **Web health endpoint** points to `/api/health` but web has no explicit health route
10. **No cache invalidation** strategy documented for RPC queries
11. **PowerShell scripts** for AI workflows won't run on Linux CI
12. **No migration rollback** strategy documented
13. **CSRF middleware session cookie parsing** had swapped params (fixed)
