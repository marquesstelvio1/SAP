# Backend Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Tech Stack

- NestJS 11
- Express platform (@nestjs/platform-express)
- @orpc/server v1 (RPC framework)
- Prisma v7 + @prisma/adapter-pg
- Zod v4 (validation)
- Redis (cache) via cache-manager + ioredis
- @nestjs/throttler (rate limiting)
- csrf-csrf (CSRF protection)
- Stripe (billing)

## Architecture

```
src/
├── main.ts                           # Bootstrap + middleware
├── app.module.ts                     # Root module (imports all domains)
├── rpc/                              # RPC integration layer
│   ├── rpc.module.ts                 # RPC module wiring
│   ├── rpc-context.service.ts        # Request context builder
│   ├── rpc-context.ts                # Context types
│   ├── rpc-http.middleware.ts        # HTTP→RPC bridge
│   ├── platform-rpc.router.ts        # Route registration
│   └── exception.filter.ts           # RPC error handling
├── auth/                             # Auth integration
│   ├── auth.module.ts
│   ├── auth-context.service.ts
│   ├── auth-context.middleware.ts
│   ├── authorization.guard.ts
│   ├── authorization.decorator.ts
│   ├── session-required.guard.ts
│   ├── better-auth-session.service.ts
│   ├── service-account-auth.service.ts
│   └── user-authorization.service.ts
├── [domain]/                         # Domain modules (x22)
│   ├── [domain].module.ts
│   ├── [domain].service.ts
│   └── ... handlers
├── health/
│   └── health.module.ts
├── security/
│   ├── csrf.middleware.ts
│   └── security-headers.ts
├── event-bus/
├── cache/
└── observability/
```

## Middleware Pipeline (order of execution)

```
applySecurityHeaders()
  → cookieParser(secret)
    → createCsrfMiddleware()
      → enableCors()
        → RpcHttpMiddleware
          → AuthContextMiddleware
            → AuthorizationGuard
              → RPC Handler
```

## Domain Modules (22)

| Module | Responsibility | Key Operations |
|---|---|---|
| admin | User/role/org administration | invite, role CRUD, overview |
| audit | Audit trail | search, export |
| billing | Stripe subscriptions | checkout, portal, overview |
| capacity | Resource management | register resource, open/reserve/cancel slots, advisory |
| cargo | Cargo lifecycle | register, release, transport plan/depart/arrive, delivery, exceptions, claims, compliance |
| documents | Document storage | upload, list, get |
| health | Health checks | /health/live, /health/ready |
| integrations | External system adapters | TMS, ERP, WMS, GPS events |
| notifications | User notifications | inbox, mark read |
| organizations | Org profile | profile, status |
| planning | Transport orders | confirm, dispatch, reschedule, cancel |
| reports | Report export | domain exports |
| settings | Org settings | branding, organization |
| tariff | Rate management | rate cards, rules, quote calculate/approve |
| teams | Team management | CRUD, members |
| tracking | Shipment tracking | events, exceptions, advisories, analytics |
| webhooks | Webhook endpoints | CRUD, delivery logs |

## Error Handling

- RPC exception filter catches all unhandled errors
- Error catalog in `@saptm/rpc/errors.ts` with typed error codes
- All errors returned via RPC error envelope
