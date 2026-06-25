# TARGET ARCHITECTURE — SAPTM

> Ideal final architecture for enterprise mesh.

---

## Monorepo Structure (current + target)

```
saptm/
├── apps/
│   ├── api/          # NestJS 11 — existing, maintain
│   └── web/          # Next.js 16 — existing, maintain
├── packages/
│   ├── auth/         # Better Auth — existing, maintain
│   ├── config/       # Env validation — existing, maintain
│   ├── database/     # Prisma ORM — existing, maintain
│   ├── email/        # Resend — existing, maintain
│   ├── observability/# OTEL — existing, maintain
│   ├── rpc/          # oRPC contracts — existing, maintain
│   ├── testing/      # Test fixtures — existing, maintain
│   ├── tsconfig/     # TS presets — existing, maintain
│   ├── types/        # Shared types — existing, maintain
│   └── ui/           # shadcn/ui — existing, maintain
├── docs/             # Documentation hub
│   ├── adr/          # Architecture Decision Records
│   ├── architecture/ # Architecture docs
│   ├── database/     # DB strategy, runbooks
│   ├── design-system/# Tokens, components
│   ├── enterprise/   # Audit reports, health scores
│   ├── security/     # Auth context, policies
│   ├── testing/      # Testing strategy
│   └── standards/    # Coding, commit, branch standards
├── scripts/          # Cross-platform Node.js scripts (no PowerShell)
├── tests/            # E2E tests (Playwright)
└── deploy/           # Docker, K8s, IaC
```

---

## Module Boundaries (NestJS)

Each domain module follows Clean Architecture:

```
src/{domain}/
├── domain/
│   ├── {entity}.ts           # Aggregate root + value objects
│   ├── {enum}.ts             # Status enums (branded types)
│   ├── {repository}.ts       # Repository interface
│   └── {events}.ts           # Domain events
├── application/
│   ├── {use-case}.ts         # Orchestration use case
│   └── {dto}.ts              # Application DTOs
├── infrastructure/
│   ├── prisma-{repo}.ts      # Prisma repository implementation
│   └── {module}.ts           # NestJS module definition
├── rpc/
│   └── {domain}-rpc.router.ts # oRPC router
└── domain/
    └── {business-rules}.ts   # Pure business logic functions
```

### Required Modules

| Module | Status | Priority |
|---|---|---|
| AuthModule | ✅ Existing | Maintain |
| AdminModule | ✅ Existing | Maintain |
| AuditModule | ✅ Existing | Maintain |
| CargoModule | ✅ Existing | Refactor to clean arch |
| TrackingModule | ✅ Existing | Refactor to clean arch |
| CapacityModule | ✅ Existing | Refactor to clean arch |
| PlanningModule | ✅ Existing | Refactor to clean arch |
| TariffModule | ✅ Existing | Refactor to clean arch |
| NotificationsModule | ✅ Existing | Refactor to clean arch |
| ReportsModule | ✅ Existing | Refactor to clean arch |
| IntegrationsModule | ✅ Existing | Refactor to clean arch |
| WebhooksModule | ✅ Existing | Maintain |
| BillingModule | ⚠️ Partial | Implement charge/invoice lifecycle |
| OrganizationsModule | ✅ Existing | Maintain (extracted from admin/auth) |
| DocumentsModule | ✅ Existing | Maintain (extracted from cargo) |
| TeamsModule | ✅ Existing | Maintain |
| SettingsModule | ✅ Existing | Maintain |
| CacheModule | ✅ Existing | Maintain |
| RateLimitModule | ✅ Existing | Maintain |
| ObservabilityModule | ✅ Existing | Maintain |
| HealthModule | ✅ Existing | Maintain |
| EventBusModule | ✅ Existing | Maintain (enhance with domain events) |
| RpcModule | ✅ Existing | Maintain (add versioning) |

---

## Service Separation Strategy

```
apps/web (Next.js 16)
  │ RSC data fetching (default)
  │ TanStack Query mutations (supplement)
  │
  ▼ oRPC type-safe contracts
apps/api (NestJS 11)
  │
  ├── AuthContextMiddleware (cookie → server auth context)
  ├── AuthorizationGuard (RBAC/ABAC evaluation)
  ├── RpcExceptionFilter (typed error envelopes)
  │
  ▼ Domain Use Cases
Domain Services
  │
  ├── Repository Interface ← PrismaRepository Impl
  ├── EventBus Interface ← OutboxEventBus Impl
  └── Audit Trail (explicit helpers)
```

---

## Design System Enforcement Rules

1. **All** UI components must be `packages/ui/src/components/`
2. **No** inline component definitions in page files
3. **All** spacing uses `--space-*` tokens via Tailwind theme
4. **All** control heights use `--density-*` tokens
5. **All** animations use `--motion-*` tokens
6. **All** z-index values use `--z-*` tokens
7. **No** raw color utility classes — use semantic tokens
8. **All** forms use `FieldGroup`/`Field` composition
9. **All** dialogs/sheets include accessible titles
10. **All** data tables use `Pagination` component after 25 rows

---

## API Layer Contracts

```
packages/rpc/src/
├── foundation.ts        # system.health
├── admin.ts             # User/Org/Role management
├── audit.ts             # Audit search/export
├── cargo.ts             # Cargo lifecycle
├── tracking.ts          # Shipment tracking
├── capacity.ts          # Capacity management
├── planning.ts          # Transport planning
├── tariff.ts            # Tariff/pricing
├── notifications.ts     # Notification inbox
├── reports.ts           # Report export
├── integrations.ts      # External system integrations
├── webhooks.ts          # Webhook endpoints
├── teams.ts             # Team management
├── billing.ts           # Billing/subscriptions
├── settings.ts          # Org settings
└── metadata.ts          # RPC operation metadata
```

Each file exports:
- Zod input/output schemas
- TypeScript inferred types
- `createRpcOperationMetadata` for auth, audit, idempotency config

---

## Testing Strategy

| Layer | Tool | Coverage Target |
|---|---|---|
| Static | Biome + tsc | 100% files |
| Unit (domain logic) | `node --test` | 80%+ business rules |
| Contract (RPC) | `node --test` | 100% operations |
| Integration (API) | `node --test` | All critical paths |
| Component (UI) | Vitest + testing-library | Key components |
| E2E | Playwright | Critical user journeys |
| Performance | k6/autocannon | SLA verification |
| Security | Manual + automated | OWASP Top 10 |

---

## Package Dependency Rules

```
web → { ui, rpc, auth/client, config, types, observability }
api → { database, rpc, auth/server, config, types, observability }
ui → { types } (no auth, no rpc)
database → { } (standalone)
rpc → { auth } (permission types only)
auth → { database }
config → { }
testing → { auth, rpc }
types → { }
observability → { }
```

Domain modules in `apps/api` may depend on:
- `AuthModule` (for auth context and authorization)
- `RpcModule` (for oRPC mounting)
- `ObservabilityModule` (for telemetry)
- `EventBusModule` (for domain events)
- Their own domain package

Domain modules must NOT depend on other domain modules directly. Cross-domain communication uses domain events.
