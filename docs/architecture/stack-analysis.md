# STACK ANALYSIS — SAPTM

**Generated:** 2026-06-22
**Mode:** AI ENGINEERING OPERATING SYSTEM GENERATOR

---

## 1. FRONTEND STACK

| Technology | Version | Source | Notes |
|---|---|---|---|
| Next.js | ^16.0.0 | pnpm-workspace catalog | App Router, standalone output |
| React | 19.2.7 | pnpm-workspace catalog | Latest stable |
| TypeScript | ^5.8.0 | pnpm-workspace catalog | Strict mode, verbatimModuleSyntax |
| shadcn/ui | latest | components.json | new-york style, RSC enabled |
| Tailwind CSS | ^4.0.0 | pnpm-workspace catalog | CSS-first configuration |
| Radix UI | 1.4.3 | pnpm-workspace catalog | 50+ components via radix-ui |
| TanStack React Query | ^5.0.0 | pnpm-workspace catalog | Server state management |
| TanStack React Table | ^8.0.0 | pnpm-workspace catalog | Data tables |
| Sonner | ^2.0.0 | pnpm-workspace catalog | Toast notifications |
| Recharts | ^2.0.0 | pnpm-workspace catalog | Charts |
| next-themes | ^0.4.0 | pnpm-workspace catalog | Dark mode |
| Lucide React | ^0.468.0 | pnpm-workspace catalog | Icons |
| date-fns | ^4.0.0 | pnpm-workspace catalog | Date utilities |
| react-day-picker | ^9.0.0 | pnpm-workspace catalog | Date picker |
| Sentry (Next.js) | ^8.55.2 | apps/web package.json | Error tracking |
| CVA | 0.7.1 | pnpm-workspace catalog | Component variants |
| clsx | ^2.1.0 | pnpm-workspace catalog | Class utilities |
| tailwind-merge | ^2.6.0 | pnpm-workspace catalog | Class merging |
| cmdk | ^1.1.1 | packages/ui | Command menu |

### State Management Assessment
- **Server state:** TanStack React Query (correct choice)
- **Client state:** React hooks/context (adequate)
- **Form state:** No form library detected (react-hook-form, formik absent) — **GAP**
- **URL state:** Next.js search params (adequate)

---

## 2. BACKEND STACK

| Technology | Version | Source | Notes |
|---|---|---|---|
| NestJS | ^11.0.0 | pnpm-workspace catalog | Express platform |
| @nestjs/common | ^11.0.0 | pnpm-workspace catalog | |
| @nestjs/core | ^11.0.0 | pnpm-workspace catalog | |
| @nestjs/platform-express | ^11.0.0 | pnpm-workspace catalog | |
| @nestjs/cache-manager | ^3.1.3 | apps/api | Caching |
| @nestjs/throttler | ^6.5.0 | apps/api | Rate limiting |
| Prisma | ^7.0.0 | pnpm-workspace catalog | ORM |
| @prisma/adapter-pg | ^7.0.0 | pnpm-workspace catalog | PostgreSQL adapter |
| @prisma/client | ^7.0.0 | pnpm-workspace catalog | |
| oRPC | ^1.0.0 | pnpm-workspace catalog | RPC framework |
| ioredis | ^5.11.1 | apps/api | Redis client |
| cache-manager-redis-yet | ^5.1.5 | apps/api | Redis cache store |
| cookie-parser | ^1.4.7 | apps/api | Cookie parsing |
| csrf-csrf | ^4.0.3 | apps/api | CSRF protection |
| Zod | ^4.0.0 | pnpm-workspace catalog | Schema validation |
| Stripe | ^18.0.0 | pnpm-workspace catalog | Payments |
| reflect-metadata | ^0.2.0 | pnpm-workspace catalog | |
| rxjs | ^7.8.0 | pnpm-workspace catalog | |

---

## 3. AUTHENTICATION STACK

| Technology | Version | Notes |
|---|---|---|
| Better Auth | ^1.0.0 | Primary auth framework |
| Prisma Adapter (Better Auth) | — | Database integration |
| Two-Factor Plugin | — | TOTP + backup codes |
| Organization Plugin | — | Multi-tenant orgs (via custom RBAC) |

### Auth Architecture
- **Server:** `packages/auth/src/server.ts` — `betterAuth()` with prismaAdapter
- **Client:** `packages/auth/src/client.ts` — `betterAuth()` browser client
- **Subpath exports:** `@saptm/auth`, `@saptm/auth/client`, `@saptm/auth/server`
- **Session:** JWT-less, database-backed sessions (7d expiry, 1d update age)
- **Password policy:** Min 12, max 128, revoke sessions on reset
- **Email verification:** Required, on sign-up
- **2FA:** TOTP (6 digits, 30s period), encrypted backup codes (10 codes)
- **API Keys:** Service account auth, SHA-256 hashed, prefix-stored

### Permission System
- 40 platform permissions (tenant, cargo, tracking, capacity, etc.)
- Custom authorization engine (`policy.ts`) with evaluation modes (ALL, ANY)
- RBAC via Role/Permission/MembershipRole models

---

## 4. DATABASE STACK

| Component | Version | Notes |
|---|---|---|
| PostgreSQL | 17 Alpine | Production database |
| Prisma | ^7.0.0 | ORM with driver adapter |
| @prisma/adapter-pg | ^7.0.0 | PostgreSQL driver adapter |
| Redis | 7 Alpine | Caching, session store |

### Schema Metrics
| Metric | Value |
|---|---|
| Models | 41 |
| Enums | 33 |
| Relations | 45+ |
| Indices | 75 |
| Unique Constraints | 55 |
| Composite Keys | 2 |
| Total Lines | 1261 |

### Migration Strategy
- Prisma Migrate with `migrations/` directory
- Baseline migration: `20260602160000_initial_foundation`
- Rollback script: `scripts/rollback-migration.mjs`
- Validation: `prisma validate` in CI

### Outbox Pattern
- `OutboxEvent` model with status machine: pending → processing → published → failed
- Worker script: `scripts/process-outbox.mjs`
- Integrations include event-bus module in API

---

## 5. INFRASTRUCTURE STACK

| Component | Technology | Version |
|---|---|---|
| Package Manager | pnpm | 10.12.1 |
| Monorepo Tool | Turborepo | ^2.5.0 |
| Linter/Formatter | Biome | ^2.0.0 |
| CI/CD | GitHub Actions | ubuntu-latest |
| Container Runtime | Docker | Compose + K8s |
| Orchestration | Kubernetes | manifests in deploy/ |
| Secrets | External Secrets Operator | K8s native |
| TLS | Ingress + cert-manager | K8s |
| Observability | OpenTelemetry | 0.104.0 collector |
| Metrics | Prometheus | v2.54.1 |
| Alerting | Alertmanager | v0.27.0 |
| Dashboards | Grafana | 11.1.0 |

---

## 6. OBSERVABILITY STACK

| Component | Package | Notes |
|---|---|---|
| OpenTelemetry SDK | `@saptm/observability` | Custom package |
| Traces | OTEL OTLP exporter | HTTP/gRPC |
| Metrics | Prometheus client | Via `prometheus.ts` |
| Logs | Console + structured | LOG_LEVEL config |
| Sentry | @sentry/nextjs | Error tracking (web) |
| OTEL Collector | otel/opentelemetry-collector-contrib | 0.104.0 |

---

## 7. MISSING STACK ELEMENTS

| Element | Status | Impact |
|---|---|---|
| Frontend form library | **MISSING** | No react-hook-form or formik |
| Frontend component tests (interaction) | **PARTIAL** | 65 structural tests, no DOM interaction tests |
| Coverage tooling | **MISSING** | No c8, nyc, or vitest --coverage |
| E2E visual regression | **PARTIAL** | Snapshots exist but limited |
| API rate limit persistence | **PARTIAL** | Memory-based (restart resets) |
| Database backup tooling | **MISSING** | No backup scripts |
| Cache invalidation strategy | **MISSING** | No documented strategy |
| Internationalization | **MISSING** | PT-only email templates |
| API documentation (OpenAPI) | **MISSING** | No OpenAPI/Swagger generation |
| CI artifact caching | **PARTIAL** | pnpm store cached, but not build outputs |
