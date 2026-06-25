# Repository Analysis: SAPTM

**Generated:** 2026-06-23
**Phase:** 0 — Repository Discovery
**Method:** Full source inspection via AI agents

---

## 1. Stack Inventory

### Platform
| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >=22.0.0 |
| Package Manager | pnpm | 10.12.1 |
| Monorepo | Turborepo | ^2.5.0 |
| Language | TypeScript | ^5.8.0 |
| Lint/Format | Biome | ^2.0.0 |
| Dead Dep Check | Knip | ^5.0.0 |
| Changesets | `@changesets/cli` | ^2.29.0 |
| Secrets/Env | `@dotenvx/dotenvx` | ^1.44.0 |

### Backend (`@saptm/api`)
| Category | Technology | Version |
|---|---|---|
| Framework | NestJS | ^11.0.0 |
| HTTP Engine | Express (via `@nestjs/platform-express`) | ^11.0.0 |
| RPC Framework | `@orpc/server` | ^1.0.0 |
| Auth | Better Auth (server) | ^1.0.0 |
| ORM | Prisma | ^7.0.0 |
| DB Adapter | `@prisma/adapter-pg` | ^7.0.0 |
| Validation | Zod | ^4.0.0 |
| Rate Limiting | `@nestjs/throttler` | ^6.5.0 |
| Caching | `cache-manager` + `cache-manager-redis-yet` | ^7.x / ^5.x |
| Redis Client | `ioredis` | ^5.11.1 |
| CSRF | `csrf-csrf` | ^4.0.3 |
| Billing | Stripe | ^18.0.0 |
| Cookie Parsing | `cookie-parser` | ^1.4.7 |
| Reactive | `rxjs` | ^7.8.0 |
| Reflection | `reflect-metadata` | ^0.2.0 |

### Frontend (`@saptm/web`)
| Category | Technology | Version |
|---|---|---|
| Framework | Next.js | ^16.0.0 |
| Language | React | 19.2.7 |
| Styling | Tailwind CSS | ^4.0.0 |
| UI Library | `@saptm/ui` (shadcn/new-york style) | workspace |
| Client Cache | TanStack Query | ^5.0.0 |
| Table | TanStack Table | ^8.0.0 |
| Forms | react-hook-form + @hookform/resolvers | ^7.54 / ^4.1 |
| Date Picker | react-day-picker | ^9.0.0 |
| i18n | next-intl | ^3.0.0 |
| Theme | next-themes | ^0.4.0 |
| Analytics | PostHog (posthog-js) | ^1.200.0 |
| Charts | recharts | ^2.0.0 |
| Error Tracking | Sentry (@sentry/nextjs) | ^8.55.2 |
| Bundle Analyzer | @next/bundle-analyzer | ^16.0.0 |
| Web Vitals | web-vitals | ^4.0.0 |
| Toasts | sonner | ^2.0.0 |
| Icons | lucide-react | ^0.468.0 |
| Class Utils | class-variance-authority, clsx, tailwind-merge | — |
| Component Library | Radix UI (radix-ui) | 1.4.3 |

### Infrastructure
| Category | Technology |
|---|---|
| Container Runtime | Docker (multi-stage, node:22-alpine) |
| Orchestration | Kubernetes (manifests in deploy/kubernetes/) |
| Database | PostgreSQL 17 (Docker, port 25432) |
| Cache | Redis 7 (Docker, port 26379) |
| Observability | OpenTelemetry Collector, Prometheus, Grafana, Alertmanager |
| CI/CD | GitHub Actions (9 workflows) |
| Image Registry | GHCR (GitHub Container Registry) |
| Image Signing | Cosign |
| Vulnerability Scan | Trivy |

### Testing
| Category | Technology |
|---|---|
| E2E | Playwright (chromium only, serial) |
| API Tests | Node `--test` runner (.test.mjs) |
| RPC Tests | Node `--test` runner (.test.mjs) |
| UI Tests | Node `--test` runner (.test.mjs) |
| Load Tests | Bash scripts (tests/load/) |
| Accessibility | axe-core + Playwright |
| Coverage | c8 |

---

## 2. Monorepo Structure

```
saptm/
├── apps/
│   ├── api/              # NestJS backend (@saptm/api)
│   │   ├── src/          # 22 domain modules + app.module + main
│   │   ├── tests/        # 16 integration test files
│   │   └── Dockerfile    # Multi-stage production build
│   └── web/              # Next.js frontend (@saptm/web)
│       ├── app/          # App Router pages (platform, auth, api routes)
│       ├── components/   # Page-specific components (14 dirs)
│       ├── i18n/         # Internationalization config
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Client-side utilities
│       ├── sentry.*.config.ts
│       ├── instrumentation.ts
│       └── Dockerfile
├── packages/
│   ├── auth/             # Better Auth config, policy engine, session, API keys
│   ├── config/           # Zod-validated env schemas (server + client)
│   ├── database/         # Prisma client, schema, migrations, outbox, audit, RBAC
│   ├── email/            # Resend-based transactional emails
│   ├── form/             # react-hook-form wrappers + Zod resolver
│   ├── observability/    # OpenTelemetry helpers, trace context, signals
│   ├── rpc/              # RPC contracts (Zod schemas + metadata + errors)
│   ├── testing/          # Test fixtures (auth, permissions, RPC, traces)
│   ├── tsconfig/         # Shared tsconfig presets (base, next, nest)
│   ├── types/            # Shared runtime types
│   └── ui/               # shadcn/ui components, tokens, hooks, Storybook
├── tests/
│   ├── e2e/              # Playwright E2E specs
│   └── load/             # Load test scripts
├── deploy/
│   ├── kubernetes/       # K8s manifests (base + overlays)
│   └── observability/    # OTEL, Prometheus, Grafana, Alertmanager configs
├── scripts/              # 60+ validation & automation scripts (.mjs + .ts)
├── .github/workflows/    # 9 CI/CD workflows
├── docs/                 # Full documentation suite (existing — will be rebuilt)
├── .ai/                  # AI Engineering OS (existing — will be rebuilt)
├── compose.yaml          # Full Docker Compose stack (8 services)
├── tsconfig.base.json    # Shared TS config (strict mode)
├── biome.json            # Biome config (recommended rules)
├── components.json       # shadcn/ui config
├── knip.json             # Dead dependency checker config
└── AGENTS.md             # AI Constitution
```

---

## 3. Package Dependency Graph

```
@saptm/web (Next.js)
  ├── @saptm/auth       → better-auth, @saptm/config, @saptm/database, @saptm/email, @saptm/observability
  ├── @saptm/config      → zod
  ├── @saptm/form        → react-hook-form, zod
  ├── @saptm/rpc         → @orpc/server, @saptm/auth, @saptm/observability, @saptm/types, zod
  ├── @saptm/types       → (tsup-built shared types)
  ├── @saptm/ui          → radix-ui, cva, tailwind-merge, sonner, recharts, lucide-react, next-themes
  └── external           → next, react, better-auth, @sentry/nextjs, @tanstack/react-query, next-intl

@saptm/api (NestJS)
  ├── @saptm/auth        → (same as above)
  ├── @saptm/config      → zod
  ├── @saptm/database    → @prisma/client, @prisma/adapter-pg, @saptm/config, @saptm/email, @saptm/observability
  ├── @saptm/observability → OpenTelemetry SDK
  ├── @saptm/rpc         → (same as above)
  ├── @saptm/types       → (tsup-built shared types)
  └── external           → @nestjs/*, @orpc/server, cache-manager, ioredis, stripe, csrf-csrf, zod

@saptm/auth
  ├── @saptm/config      → zod
  ├── @saptm/database    → Prisma client
  ├── @saptm/email       → resend
  └── external           → better-auth

@saptm/database
  ├── @prisma/client, @prisma/adapter-pg
  ├── @saptm/config, @saptm/email, @saptm/observability
  └── prisma (dev)

@saptm/rpc
  ├── @orpc/server, @saptm/auth, @saptm/observability, @saptm/types, zod
  └── c8 (dev)
```

**Key constraint:** Packages never depend on apps. Circular dependencies are not allowed.

---

## 4. Package Ownership & Responsibilities

| Package | Responsibility |
|---|---|
| `@saptm/auth` | Better Auth setup (server + client), policy engine, session governance, API key management, RBAC, user authorization |
| `@saptm/config` | Zod-validated env schemas (server + client), trusted origins resolver |
| `@saptm/database` | Prisma schema, client generation, migrations, transactional outbox, domain events, audit records, RBAC bootstrap |
| `@saptm/email` | Resend-based transactional email (verification, password reset, invitations) |
| `@saptm/form` | React Hook Form wrappers with Zod resolver integration |
| `@saptm/observability` | OpenTelemetry trace context, span creation, signal types, metric helpers |
| `@saptm/rpc` | RPC contract definitions (Zod schemas), operation metadata, authorization rules, error catalog |
| `@saptm/testing` | Test fixtures: auth context, permissions, RPC contracts, trace contexts |
| `@saptm/tsconfig` | Shared TypeScript config presets (base, Next.js, NestJS) |
| `@saptm/types` | Shared runtime type definitions |
| `@saptm/ui` | shadcn/ui components, design tokens, hooks, styles, Storybook stories |

---

## 5. Frontend Architecture

### Structure
- **Framework:** Next.js 16 App Router
- **Default locale:** Portuguese (`lang="pt"`)
- **Rendering:** Server components by default, client components where interactivity needed
- **Route groups:** `(platform)/` for authenticated app, standalone routes for auth pages
- **Data fetching:** TanStack Query on client, server components for initial data
- **Styling:** Tailwind CSS v4 with CSS variables (design tokens from `@saptm/ui/tokens`)
- **Components:** shadcn/ui pattern (cva for variants, tailwind-merge for classes)
- **Forms:** react-hook-form + @hookform/resolvers with Zod schemas

### Routes
```
/app
├── (platform)/
│   ├── app/              # Main platform app pages
│   ├── layout.tsx        # Authenticated layout
│   ├── loading.tsx       # Loading state
│   └── error.tsx         # Error boundary
├── accept-invitation/    # Org invitation acceptance
├── api/
│   ├── auth/             # Better Auth API routes
│   └── health/           # Health check endpoint
├── design-system/        # Design system showcase
├── forgot-password/      # Password recovery
├── reset-password/       # Password reset
├── sign-in/              # Authentication
├── two-factor/           # 2FA flows
├── layout.tsx            # Root layout (ThemeProvider, QueryProvider, Toaster)
├── loading.tsx           # Root loading state
├── error.tsx             # Root error boundary
├── global-error.tsx      # Global error boundary
├── not-found.tsx         # 404 page
├── page.tsx              # Landing page
├── icon.tsx              # Favicon
├── robots.ts             # Robots config
└── sitemap.ts            # Sitemap
```

### Security Headers (next.config.ts)
- Content-Security-Policy (restrictive)
- Cross-Origin-Opener-Policy (same-origin)
- Cross-Origin-Resource-Policy (same-origin)
- Permissions-Policy (all disabled)
- Referrer-Policy (strict-origin-when-cross-origin)
- HSTS (1 year, includeSubDomains, preload)
- X-Content-Type-Options (nosniff)
- X-Frame-Options (DENY)

---

## 6. Backend Architecture

### Structure
- **Framework:** NestJS 11 with Express platform
- **RPC layer:** `@orpc/server` on top of NestJS, all communication via RPC contracts
- **Module pattern:** Domain modules with `module.ts`, services are injected
- **No controllers** — API surface is purely RPC-based (no traditional REST controllers)
- **Middleware pipeline:** Security headers → Cookie parser → CSRF → CORS → Rate limiting → Auth context → RPC handler

### Domain Modules (22)
| Module | Responsibility |
|---|---|
| `admin/` | Admin functions: user invite, role CRUD, org oversight |
| `audit/` | Audit trail search and export |
| `auth/` | Auth context service, guards, decorators, session validation |
| `billing/` | Stripe integration, subscription management, invoices |
| `cache/` | Redis cache manager setup |
| `capacity/` | Resource registration, slot management, reservation, advisory decisions |
| `cargo/` | Cargo lifecycle: register, release, transport plan/depart/arrive, delivery, exceptions, claims, compliance |
| `documents/` | Document storage and retrieval |
| `event-bus/` | Internal event bus for module communication |
| `health/` | Health check endpoints (/health/live, /health/ready) |
| `integrations/` | External system adapters: TMS, ERP, WMS, GPS, Port TOS, Rail TMS |
| `notifications/` | Notification inbox, read/unread management |
| `observability/` | OpenTelemetry integration, metrics, logging |
| `organizations/` | Organization profile and status management |
| `planning/` | Transport order lifecycle: confirm, dispatch, reschedule, cancel |
| `rate-limit/` | Global rate limiting via @nestjs/throttler |
| `reports/` | Report generation and export |
| `rpc/` | RPC router, context service, exception filter, HTTP middleware |
| `security/` | CSRF middleware, security headers, additional security controls |
| `settings/` | Organization settings: branding, profile |
| `tariff/` | Rate card management, quote calculation and approval |
| `teams/` | Team CRUD, member management |
| `tracking/` | Shipment tracking, event recording, exception management, advisories |
| `webhooks/` | Webhook endpoint management, delivery tracking |

### RPC Layer (`@saptm/rpc`)
Each RPC operation has metadata:
- `name` — operation identifier
- `version` — contract version
- `kind` — query | mutation | subscription
- `auth` — public | session | service
- `permissions` — required platform permissions
- `permissionMode` — ALL | ANY
- `audit` — none | standard | sensitive | critical
- `idempotency` — none | required | recommended
- `criticality` — low | medium | high | critical

---

## 7. Database Architecture

### Provider
- **PostgreSQL 17** via Prisma ORM v7
- **Driver adapter:** `@prisma/adapter-pg`
- **Migrations:** Prisma Migrate (deploy via init container)

### Schema Overview (20 models, 28 enums)

**Identity & Auth (4 models):**
- `User` — Core user profile
- `Session` — Better Auth sessions with IP tracking
- `Account` — OAuth + email/password accounts
- `Verification` — Email verification tokens

**Multi-tenancy (5 models):**
- `Organization` — Tenant with status lifecycle (active/suspended/archived)
- `Membership` — User-org link with status lifecycle
- `Role` — Org-scoped role definitions
- `Permission` — Platform permission registry
- `RolePermission` — Role-permission assignments

**Domain (10+ models):**
- `Cargo` — Central freight entity with full lifecycle
- `TrackingShipment` — Shipment tracking with status/mode/events
- `TrackingEvent` — Timeline events per shipment
- `TransportOrder` — Transport orders linked to cargo
- `CapacityResource` — Physical resources (terminal, gate, berth, etc.)
- `CapacitySlot` — Time-based capacity windows
- `CapacitySlotReservation` — Reserved capacity units
- `TariffRateCard` — Rate card definitions
- `TariffRateRule` — Individual rate rules
- `TariffQuote` — Calculated quotes

**Supporting (5 models):**
- `AuditRecord` — Immutable audit trail
- `OutboxEvent` — Transactional outbox for event-driven architecture
- `Notification` — User notifications derived from outbox
- `ServiceAccount` — Integration service accounts
- `ApiKey` — Hashed API keys with prefixes

### Key Patterns
- **Multi-tenant:** All domain models scoped to `organizationId`
- **Idempotency:** Mutation operations use idempotency keys (unique constraints)
- **Audit trail:** `AuditRecord` captures before/after state per mutation
- **Outbox pattern:** Domain events → `OutboxEvent` → `Notification` pipeline
- **Soft deletes:** Status-based lifecycle (no hard deletes on domain entities)

---

## 8. Authentication Architecture

### Stack
- **Better Auth** v1 (server + client packages)
- **Prisma adapter** for database persistence
- **Session-based auth** with cookie tokens

### Auth Modes
| Mode | Description |
|---|---|
| `public` | No auth required (health endpoints, RPC health check) |
| `session` | User session required (default for all operations) |
| `service` | Service account API key required (integrations) |

### Session Management
- **Max age:** 7 days (604,800 seconds)
- **Sliding window:** 24 hours (session refreshes on activity)
- **Cookie cache:** 60 seconds (reduces DB reads)
- **Password policy:** min 12, max 128 characters
- **Email verification:** Required for full access
- **2FA:** TOTP via authenticator app (optional)

### Authorization
- **Policy engine:** `evaluateAuthorization()` in `@saptm/auth/policy`
- **Permission modes:** ALL (all required) or ANY (any sufficient)
- **Actor types:** user, service_account, platform
- **RBAC:** Per-organization roles with granular permission assignments
- **Permissions:** 41 flat permission strings (e.g., `cargo.register`, `tracking.event.record`)

### API Security
- **CSRF:** double-submit cookie pattern via `csrf-csrf` (signed cookies)
- **CORS:** Restricted to trusted origins from env config
- **Rate limiting:** Global via `@nestjs/throttler`
- **API keys:** SHA-256 hashed before storage, prefix-only in plaintext
- **Security headers:** Multiple layers (CSP, HSTS, XFO, COOP, CORP, etc.)

---

## 9. Deployment Architecture

### Local Development
```yaml
# compose.yaml (8 services)
- postgres:17-alpine    # Database (port 25432)
- redis:7-alpine        # Cache (port 26379)
- api                   # NestJS backend (port 4000)
- web                   # Next.js frontend (port 3000)
- otel-collector        # OpenTelemetry Collector
- alertmanager          # Prometheus Alertmanager
- prometheus            # Metrics storage (15d retention)
- grafana               # Dashboards (port 3001)
```

### CI/CD Pipeline (GitHub Actions)
**Workflows:**
- `platform-ci.yml` — 30+ validation gates on PR/push to main
- `container-ci.yml` — Container build, scan, sign
- `ai-ci.yml` — AI-assisted CI
- `ai-release.yml` — AI-assisted release
- `cluster-baseline.yml` — K8s cluster baseline
- `environment-deploy.yml` — Environment deployment
- `environment-rollback.yml` — Rollback automation
- `observability-deploy.yml` — Observability stack deploy
- `ai-backlog-sync.yml` — Backlog synchronization

### CI Gates (platform-ci.yml order)
1. Foundation validation
2. Workspace checks (pnpm install, frozen lockfile)
3. Foundation gate → Environment gate → Migration gate
4. Container gate → Deployment gate → Production inputs gate
5. Production handoff gate → Observability gate → Alert routing gate
6. DR gate → TLS gate → Security runtime gate
7. Secrets & network gate → Supply chain gate → Resilience gate
8. Resource governance gate → Cluster gate → Cluster baseline gate
9. Local readiness gate → Tracking, Cargo, Capacity, Tariff gates
10. Evidence gate → Prisma validate → Prisma generate
11. Biome lint → TypeScript typecheck → Tests → E2E smoke
12. Documentation freshness → Knip (unused deps) → Build
13. Release evidence generation → Upload artifact

---

## 10. Key Architectural Patterns & Decisions

1. **RPC-first communication** — All API-to-client via `@orpc/server`, not direct HTTP.
2. **Multi-tenant by design** — All domain data scoped to `organizationId`.
3. **Transactional outbox** — Domain events → `OutboxEvent` → `Notification`.
4. **Idempotency everywhere** — Mutations use idempotency keys for safe retries.
5. **Immutable audit trail** — `AuditRecord` captures before/after with correlation IDs.
6. **RBAC with org-scoped roles** — Permissions are flat strings, roles per org.
7. **Layer boundaries enforced** — Packages never depend on apps.
8. **Polish locale** — Frontend default: `lang="pt"`.
9. **Defense in depth** — Security headers, CSRF, CORS, rate limiting, API key hashing.
10. **30+ validation gates in CI** — Before merge to main.

---

## 11. Existing Documentation Landscape

The repository already contains extensive documentation at `docs/` and `.ai/`. Per the user's instructions, all existing documentation will be rebuilt from scratch following the 13-phase pipeline.

---

## 12. Risks & Observations from Discovery

| Risk | Details |
|---|---|
| Massive cargo service | Cargo service appears to be a large monolith within the module |
| No controller pattern | Traditional NestJS controllers are absent; all via RPC |
| Outbox worker status | `worker:outbox` script exists but may not be running in production |
| Test coverage | API has 16 test files, RPC has 11, but no package-level tests |
| Frontend tests | Only E2E tests exist, no unit/component tests for pages |
| Missing indexes | Some large tables may lack critical query indexes |
