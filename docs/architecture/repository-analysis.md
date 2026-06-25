# REPOSITORY ANALYSIS — SAPTM

**Generated:** 2026-06-22
**Analysis Mode:** AI ENGINEERING OPERATING SYSTEM GENERATOR

---

## 1. REPOSITORY OVERVIEW

| Property | Value |
|---|---|
| Name | `saptm` |
| Package Manager | pnpm@10.12.1 (Corepack) |
| Workspace | pnpm-workspace.yaml (catalog versioning) |
| Build System | Turborepo (turbo@^2.5.0) |
| Language | TypeScript (^5.8.0) ES2022 |
| Module | ESM (`"type": "module"`) |
| Node Requirement | >=22.0.0 |
| Linter/Formatter | Biome (^2.0.0) |
| Changesets | @changesets/cli (^2.29.0) |

---

## 2. WORKSPACE STRUCTURE

### Applications (2)

| Name | Path | Stack | Port |
|---|---|---|---|
| `@saptm/api` | `apps/api/` | NestJS 11, oRPC, tsx watch | 4000 |
| `@saptm/web` | `apps/web/` | Next.js 16 (App Router), Turbopack | 3000 |

### Packages (10)

| Name | Path | Purpose | Dependencies |
|---|---|---|---|
| `@saptm/auth` | `packages/auth/` | Better Auth instance, permissions, RBAC | config, database, email, observability |
| `@saptm/config` | `packages/config/` | Environment validation (Zod v4) | zod |
| `@saptm/database` | `packages/database/` | Prisma 7 schema, migrations, outbox | prisma, config, email, observability |
| `@saptm/email` | `packages/email/` | Resend email client (PT templates) | config, observability, resend |
| `@saptm/observability` | `packages/observability/` | OpenTelemetry, Prometheus | — |
| `@saptm/rpc` | `packages/rpc/` | oRPC contracts (Zod schemas) | orpc/server, auth, observability, types, zod |
| `@saptm/testing` | `packages/testing/` | Auth/RPC fixtures for tests | playwright, auth, observability, rpc |
| `@saptm/tsconfig` | `packages/tsconfig/` | Shared tsconfig (base, next, nest) | — |
| `@saptm/types` | `packages/types/` | Shared TS types | — |
| `@saptm/ui` | `packages/ui/` | shadcn/ui components, Tailwind 4 | cva, radix-ui, recharts, tanstack-table, lucide |

---

## 3. API MODULES (Domain-Based)

`apps/api/src/` — 23 NestJS modules:

| Module | Purpose |
|---|---|
| `admin/` | Platform-level administration (user management, system config) |
| `audit/` | Audit log search/export |
| `auth/` | Authentication and session guard adapters |
| `billing/` | Stripe checkout, portal sessions, subscriptions |
| `cache/` | Redis cache management |
| `capacity/` | Capacity resources, slots, reservations |
| `cargo/` | Cargo lifecycle (register→deliver) |
| `documents/` | Document metadata, validation state, retention rules |
| `event-bus/` | Domain event bus (outbox pattern) |
| `health/` | Health check endpoints (liveness/readiness) |
| `integrations/` | External system integrations (TMS, WMS, GPS, Port, Customs) |
| `notifications/` | In-app notifications |
| `observability/` | Telemetry, metrics, structured logging |
| `organizations/` | Organizations, memberships, facilities, partner relationships |
| `planning/` | Transport orders, dispatching |
| `rate-limit/` | Rate limiting via @nestjs/throttler |
| `reports/` | Report generation/export |
| `rpc/` | oRPC router, context, middleware |
| `settings/` | Organization-level settings and branding |
| `tariff/` | Rate cards, rules, quotes |
| `teams/` | Team CRUD, membership management |
| `tracking/` | Shipment tracking, events, exceptions |
| `webhooks/` | Webhook endpoint management, delivery |

---

## 4. RPC CONTRACTS (oRPC)

`packages/rpc/src/` — 18 contract files:

| File | Operations |
|---|---|
| `foundation.ts` | Health check |
| `admin.ts` | Org/role/user management |
| `audit.ts` | Audit search/export |
| `billing.ts` | Checkout, portal, plans |
| `capacity.ts` | Resources, slots, reservations, advisories |
| `cargo.ts` | Full cargo lifecycle + claims + compliance |
| `integrations.ts` | 8 external system integration types |
| `metadata.ts` | Operation metadata system |
| `notifications.ts` | Inbox, mark read |
| `planning.ts` | Transport orders CRUD |
| `reports.ts` | Report export |
| `settings.ts` | Org settings, branding |
| `tariff.ts` | Rate cards, rules, quotes |
| `teams.ts` | Team CRUD, membership |
| `tracking.ts` | Shipments, events, exceptions |
| `webhooks.ts` | CRUD + delivery logs |
| `errors.ts` | Error catalog |
| `authorization.ts` | Auth middleware for RPC |

---

## 5. FRONTEND PAGES

`apps/web/app/` — Route groups:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/sign-in/` | Authentication |
| `/sign-up/` | Registration |
| `/forgot-password/` | Password recovery |
| `/reset-password/` | Password reset |
| `/two-factor/` | 2FA verification |
| `/accept-invitation/` | Org invitation accept |
| `/(platform)/` | Authenticated platform |
| `/(platform)/app/` | Dashboard |
| `/(platform)/app/admin/` | Tenant/role administration |
| `/(platform)/app/audit/` | Audit log viewer |
| `/(platform)/app/capacity/` | Capacity management |
| `/(platform)/app/cargo/` | Cargo operations |
| `/(platform)/app/integrations/` | External integrations |
| `/(platform)/app/notifications/` | Notification inbox |
| `/(platform)/app/planning/` | Transport planning |
| `/(platform)/app/reports/` | Reports |
| `/(platform)/app/security/` | Security settings |
| `/(platform)/app/settings/` | Organization settings |
| `/(platform)/app/tariffs/` | Tariff management |
| `/(platform)/app/tracking/` | Shipment tracking |

---

## 6. FRONTEND COMPONENTS (Domain)

`apps/web/components/` — 13 domain directories:

| Directory | Purpose |
|---|---|
| `auth/` | Auth-related components |
| `shell/` | Platform shell, navigation |
| `admin/` | Admin panel components |
| `capacity/` | Capacity management UI |
| `cargo/` | Cargo operation UI |
| `integration/` | Integration configuration UI |
| `notification/` | Notification components |
| `planning/` | Transport planning UI |
| `security/` | Security settings UI |
| `settings/` | Organization settings UI |
| `tariff/` | Tariff management UI |
| `tracking/` | Shipment tracking UI |
| — | `query-provider.tsx`, `form-toast.tsx` |

---

## 7. FRONTEND HOOKS & LIB

`apps/web/hooks/` — 7 hooks:
- `use-tracking-overview.ts`, `use-cargo-overview.ts`, `use-dashboard-stats.ts`
- `use-data-table.ts`, `use-rpc.ts`, `use-tracking-advisory.ts`, `use-tracking-analytics.ts`

`apps/web/lib/` — 25 lib files with domain-specific API callers.

---

## 8. UI COMPONENT LIBRARY (shadcn)

`packages/ui/src/components/` — 50 components:

Core: button, input, textarea, label, field, checkbox, switch, radio-group, select, select-native
Layout: card, sheet, dialog, drawer, popover, dropdown-menu, sidebar, navigation-menu
Data: table, data-table, pagination, calendar, date-picker, chart
Feedback: alert, toast, spinner, skeleton, progress, badge, badge-group, empty-state, error-card
Navigation: breadcrumb, tabs, command, search-palette, combobox
Display: avatar, tooltip, timeline, metric-tile, context-row, access-state
Theme: theme-provider, theme-toggle, separator
Utility: collapsible, toggle, alert-dialog

---

## 9. AUTH SYSTEM

**Framework:** Better Auth (^1.0.0)

**Architecture:**
- `packages/auth/src/server.ts` — Server instance factory
- `packages/auth/src/client.ts` — Client instance factory
- `packages/auth/src/context.ts` — Auth context type system
- `packages/auth/src/permissions.ts` — 40 platform permissions
- `packages/auth/src/policy.ts` — Authorization decision engine
- `packages/auth/src/session.ts` — Session resolution
- `packages/auth/src/api-key.ts` — API key management
- `packages/auth/src/invitations.ts` — Platform invitations
- `packages/auth/src/user-authorization.ts` — Org-level authorization

**Features:** Email/password, 2FA (TOTP), sessions, API keys, RBAC, orgs

---

## 10. DATABASE

**Provider:** PostgreSQL 17 (via Prisma 7)

**Schema:** 41 models, 33 enums (~1261 lines)

**Auth & Identity (11):** User, TwoFactor, Session, Account, Verification, ServiceAccount, ApiKey, Role, Permission, RolePermission, MembershipRole
**Organizations (6):** Organization, Membership, Team, TeamMember, AuditRecord, Notification
**Cargo (5):** Cargo, CargoDeliveryException, CargoClaimSettlement, CargoOperationalHandoff, CargoComplianceEvidence
**Tracking (2):** TrackingShipment, TrackingEvent
**Capacity (4):** CapacityResource, CapacitySlot, CapacitySlotReservation, CapacityAdvisoryDecision
**Planning (3):** TransportOrder, TransportOrderDispatch, TransportOrderScheduleRevision
**Tariff (3):** TariffRateCard, TariffRateRule, TariffQuote
**Integrations (4):** IntegrationEvent, OutboxEvent, WebhookEndpoint, WebhookDelivery
**Billing (3):** Subscription, Invoice, UsageRecord

---

## 11. TEST INFRASTRUCTURE

| Layer | Framework | Location | Files |
|---|---|---|---|
| RPC unit | node --test | `packages/rpc/tests/` | 11 files |
| API integration | node --test | `apps/api/tests/` | 16 files |
| UI component | node --test | `packages/ui/src/components/__tests__/` | 5 files (65 tests) |
| E2E | Playwright (chromium) | `tests/e2e/` | 3 spec files |

---

## 12. CI/CD PIPELINES (9 workflows)

| Workflow | File | Purpose |
|---|---|---|
| Platform CI | `platform-ci.yml` | PR + main: 30+ validation gates |
| Container CI | `container-ci.yml` | Docker build validation |
| Environment Deploy | `environment-deploy.yml` | K8s deployment |
| Environment Rollback | `environment-rollback.yml` | Rollback strategy |
| Cluster Baseline | `cluster-baseline.yml` | K8s cluster validation |
| Observability Deploy | `observability-deploy.yml` | OTEL/Prometheus/Grafana |
| AI CI | `ai-ci.yml` | AI workflow CI |
| AI Release | `ai-release.yml` | AI workflow release |
| AI Backlog Sync | `ai-backlog-sync.yml` | Backlog synchronization |

---

## 13. INFRASTRUCTURE

| Component | Technology | Configuration |
|---|---|---|
| Container Runtime | Docker Compose | `compose.yaml` (8 services) |
| API Container | node:22-alpine | Multi-stage Dockerfile |
| Web Container | node:22-alpine | Multi-stage Dockerfile (standalone) |
| Database | PostgreSQL 17 Alpine | Health check, persistent volume |
| Cache | Redis 7 Alpine | AOF persistence |
| Observability | OTEL Collector 0.104.0 | Config in deploy/ |
| Metrics | Prometheus v2.54.1 | 15d retention |
| Alerting | Alertmanager v0.27.0 | Config in deploy/ |
| Dashboards | Grafana 11.1.0 | Provisioned datasources |
| Kubernetes | Deploy configs in `deploy/kubernetes/` | — |

---

## 14. ENVIRONMENT VARIABLES

31 env vars across 4 categories:
- Web: `NEXT_PUBLIC_*` (3)
- API: `API_*` (2)
- Database/Cache: `DATABASE_*`, `REDIS_*` (3)
- Auth: `BETTER_AUTH_*`, `SAPTM_INVITATION_*` (4)
- Email: `RESEND_API_KEY`, `EMAIL_FROM` (2)
- Observability: `OTEL_*`, `LOG_LEVEL`, `SENTRY_*`, `GRAFANA_*` (y)
- Billing: `STRIPE_*` (6)

---

## 15. DESIGN TOKENS

8 token categories defined in `packages/ui/src/tokens/index.ts`:

| Category | Tokens |
|---|---|
| Semantic Colors | 21 (background, foreground, primary, secondary, etc.) |
| Operational Status | 8 (success, warning, risk, info) |
| Typography | 4 (sans, mono, numeric, tracking) |
| Density | 3 levels (comfortable, compact, operational) |
| Border Radius | 4 (sm, md, lg, xl) |
| Elevation | 4 (panel, overlay, command, sticky) |
| Spacing | 24 (0-32 step scale) |
| Motion | 7 (duration/easing) |
| Z-Index | 8 (base-command) |

---

## 16. VALIDATION SCRIPTS (47)

30+ production validation gates across security, observability, deployment, resilience, supply chain, cluster, and DR domains.

---

## 17. DEPLOYMENT

- Docker multi-stage builds for both apps
- Kubernetes manifests in `deploy/kubernetes/`
- Helm charts for observability stack
- Blue/green deployment capability
- Rollback automation script
