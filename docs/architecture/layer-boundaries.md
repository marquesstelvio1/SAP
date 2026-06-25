# LAYER BOUNDARIES — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Classification:** CONSTITUTIONAL — ALL AGENTS MUST OBEY

---

## 1. THREE-LAYER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │   @saptm/web        │  │   @saptm/api                 │  │
│  │   (Next.js)         │  │   (NestJS)                   │  │
│  │                     │  │                              │  │
      │  │   apps/web/         │  │   apps/api/src/              │  │
      │  │     app/            │  │     admin/                   │  │
      │  │     components/     │  │     audit/                   │  │
      │  │     hooks/          │  │     auth/                    │  │
      │  │     lib/            │  │     billing/                 │  │
      │  └─────────┬───────────┘  │     cache/                   │  │
      │            │              │     capacity/                │  │
      │            │              │     cargo/                   │  │
      │            │              │     documents/               │  │
      │            │              │     event-bus/               │  │
      │            │              │     health/                  │  │
      │            │              │     integrations/            │  │
      │            │              │     notifications/           │  │
      │            │              │     observability/           │  │
      │            │              │     organizations/           │  │
      │            │              │     planning/                │  │
      │            │              │     rate-limit/              │  │
      │            │              │     reports/                 │  │
      │            │              │     rpc/                     │  │
      │            │              │     settings/                │  │
      │            │              │     tariff/                  │  │
      │            │              │     teams/                   │  │
      │            │              │     tracking/                │  │
      │            │              │     webhooks/                │  │
│            │              └──────────┬───────────────────┘  │
│            │                         │                      │
│            └──────────┬──────────────┘                      │
└───────────────────────┼─────────────────────────────────────┘
                        │ depends on
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │@saptm/rpc│  │@saptm/   │  │@saptm/   │  │ @saptm/types│ │
│  │(contracts)│  │auth      │  │email     │  │ (shared     │ │
│  │          │  │(identity │  │(comm)    │  │  types)     │ │
│  │ oRPC +   │  │ & access)│  │          │  │             │ │
│  │ Zod      │  │          │  │ Resend   │  │             │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
│                                                              │
│  Domain contracts define:                                   │
│  - Operation metadata (auth, permissions, audit, criticality)│
│  - Input/output schemas (Zod)                               │
│  - Error catalog (8 error codes)                            │
│                                                              │
│  Auth owns:                                                 │
│  - Authentication (Better Auth)                             │
│  - Authorization engine (policy evaluation)                 │
│  - Platform permissions (40 permissions)                    │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ depends on
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                       │
│                                                              │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │ @saptm/      │  │ @saptm/        │  │ @saptm/config    │ │
│  │ database     │  │ observability  │  │                  │ │
│  │              │  │                │  │ (env loading +   │ │
│  │ Prisma ORM   │  │ OpenTelemetry  │  │  Zod validation) │ │
│  │ Migrations   │  │ Prometheus     │  │                  │ │
│  │ Outbox       │  │ Metrics        │  │                  │ │
│  │ Audit        │  │                │  │                  │ │
│  └──────────────┘  └────────────────┘  └──────────────────┘ │
│                                                              │
│  + @saptm/tsconfig (shared TypeScript config)                │
│  + @saptm/testing (test utilities, Playwright fixtures)       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. LAYER DEFINITIONS

### 2.1 Infrastructure Layer (Foundation)

**Packages:**
- `@saptm/database` — data access, migrations, outbox bus, event types
- `@saptm/config` — environment configuration, Zod validation
- `@saptm/observability` — OpenTelemetry, Prometheus metrics
- `@saptm/tsconfig` — shared TypeScript configuration
- `@saptm/testing` — test utilities and fixtures

**Rules:**
- Must not import from Domain Layer or Presentation Layer
- May only import from other Infrastructure Layer packages or external npm packages
- `@saptm/config` is the lowest-level package — zero `@saptm/*` dependencies
- `@saptm/observability` is the second-lowest — zero `@saptm/*` dependencies

### 2.2 Domain Layer (Business Logic)

**Packages:**
- `@saptm/rpc` — contract definitions (Zod schemas, operation metadata, error catalog)
- `@saptm/auth` — authentication, authorization engine, permissions, RBAC
- `@saptm/email` — email sending via Resend
- `@saptm/types` — shared TypeScript type utilities

**Rules:**
- May import from Infrastructure Layer packages
- Must not import from Presentation Layer
- Must not import from other Domain Layer packages in a way that creates cycles
- `@saptm/rpc` may import `@saptm/auth` (for permission type references) but not `@saptm/database`
- `@saptm/auth` may import `@saptm/database` (for persistence) but not `@saptm/rpc`
- Domain packages must not have runtime dependencies on each other that create bidirectional coupling

### 2.3 Presentation Layer (Applications)

**Applications:**
- `@saptm/api` (NestJS) — backend API server, domain modules
- `@saptm/web` (Next.js) — frontend web application

**Rules:**
- May import from Infrastructure Layer and Domain Layer packages
- Must not be imported by any package (packages never consume applications)
- Application code lives in `apps/` directories
- Each API module follows: `module.ts`, `*-rpc.router.ts`, `*.service.ts`, `domain/`, `infrastructure/`

---

## 3. CROSS-LAYER COMMUNICATION RULES

### 3.1 API → RPC Communication
- All API-to-client communication MUST use `@saptm/rpc` contracts
- No direct HTTP endpoints — all operations go through oRPC routers
- Each domain module has a `*-rpc.router.ts` that wires contracts to services
- Exception: health endpoint (`/health/live`, `/health/ready`) may use direct HTTP

### 3.2 Domain Event Flow
```
Domain Module Service
    │
    ├── creates DomainEvent
    ├── persists via @saptm/database (Prisma transaction)
    └── publishes via EventBus (outbox pattern)
        │
        ├── triggers audit record (same transaction)
        ├── triggers notification (async)
        └── triggers webhook delivery (async)
```

### 3.3 Authorization Flow
```
RPC Router → extracts RpcOperationMetadata → evaluates authorization
    │
    └── @saptm/auth/evaluateAuthorization(authContext, requirement)
        │
        └── checks: authentication status, actor type, organization,
                    permissions (ALL/ANY mode), session validity
```

### 3.4 Error Propagation
```
Domain Service throws domain error
    │
    ├── caught by rpc-context layer
    ├── mapped to RpcErrorCode
    └── returned as RpcErrorEnvelope
        │
        └── includes traceId, requestId for debugging
```

---

## 4. COMMUNICATION PATTERNS

| Pattern | Mechanism | Used For |
|---|---|---|
| **RPC** | oRPC server/client via `@saptm/rpc` contracts | All API operations |
| **Synchronous Query** | Direct service method calls within module | Business logic composition |
| **Domain Events** | Outbox pattern via `@saptm/database` | Cross-domain propagation |
| **Audit Trail** | Same-transaction insert via database | Immutable records |
| **Notifications** | Async outbox → notification service | User alerts |
| **Webhooks** | Async outbox → webhook delivery worker | External system integration |
| **Observability** | OpenTelemetry spans + Prometheus metrics | Tracing, monitoring |

---

## 5. LAYER VIOLATION DETECTION

### Automated (TypeScript project references)
- `tsconfig.json` path mappings enforce package boundaries
- Each package has its own `tsconfig.json` that references only its dependency `tsconfig.json` files
- Importing from another package's `src/` directly will fail type checking

### Manual (Code Review)
| Violation Type | Example | Severity |
|---|---|---|
| Infrastructure imports Domain | `database` imports `rpc` | BLOCKER |
| Package imports Application | `rpc` imports from `apps/api` | BLOCKER |
| Domain circle | `rpc` ↔ `auth` bidirectional | BLOCKER |
| Skipping layers | Module imports database directly instead of through domain | WARN |
| Direct HTTP in domain | Service exposes Express route | BLOCKER |

---

## 6. DEPLOYMENT LAYER

Deployment is a cross-cutting concern that wraps all three layers:

```
┌────────────────────────────────────────────────────────┐
│                    DEPLOYMENT LAYER                      │
│                                                         │
│  Docker multi-stage builds                              │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │ @saptm/api   │  │ @saptm/web   │                    │
│  │ Dockerfile   │  │ Dockerfile   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                         │
│  Kubernetes manifests (deploy/k8s/)                      │
│  CI/CD via GitHub Actions                               │
│  Database migrations via init container                  │
│                                                         │
└────────────────────────────────────────────────────────┘
```
