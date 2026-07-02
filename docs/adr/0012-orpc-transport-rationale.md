# ADR 0012 — oRPC as Single API Transport

## Status

Proposed.

## Context

SAPTM needs an API transport layer for communication between the frontend (`apps/web`, Next.js) and backend (`apps/api`, NestJS). The architecture audit identified that while oRPC (`@orpc/server` v1) is already implemented and in use, **no ADR documents why oRPC was chosen over alternatives** (REST, tRPC, gRPC, GraphQL).

This omission is a governance gap — future developers or stakeholders may question the decision without documented rationale.

### Current state

- `@orpc/server` v1 is the sole transport layer
- No REST endpoints exist (except `/health`, `/api/auth/*` from Better Auth)
- All API communication goes through oRPC contracts defined in `packages/rpc/src/{domain}.ts`
- Contracts include Zod schemas + metadata (name, version, kind, auth, permissions, audit, idempotency, criticality)
- Routing: HTTP POST to `/rpc` (and `/v1/rpc` for versioned requests)
- The frontend consumes RPC contracts via `@orpc/client` (or direct fetch)

### Requirements

The transport must satisfy these constraints:

| Requirement | Priority | Detail |
|---|---|---|
| **Type safety** | P0 | Full end-to-end inferred types from server to client |
| **Contract-first** | P0 | API contracts as source of truth, shareable between frontend and backend |
| **Validation** | P0 | Zod-based input/output validation on every operation |
| **Versioning** | P0 | API versioning strategy (currently `/v1/rpc`) |
| **Metadata** | P0 | Each operation must declare auth, permissions, audit requirements |
| **HTTP semantics** | P1 | Standard HTTP methods (GET for reads, POST for mutations) |
| **Streaming** | P1 | Future SSE/WebSocket for real-time tracking (KR2.1) |
| **OpenAPI compatibility** | P2 | Generate OpenAPI spec for documentation and external consumption |
| **Performance** | P2 | Minimal overhead vs raw HTTP |
| **Developer experience** | P0 | First-class TypeScript support, IDE autocomplete |

## Considered Options

### Option 1: oRPC (`@orpc/server` v1) — **Chosen**

A TypeScript-native RPC framework that builds on Zod schemas and provides end-to-end type safety.

**How it works:**
- Define contracts with Zod schemas + metadata
- Implement handlers that are automatically typed
- Client infers types from the contract
- HTTP transport via POST to a single endpoint (with method-based routing)

**Relevant features:**
- `os.router()` with nested routers per bounded context
- `.meta()` for operation metadata (auth, permissions, audit, etc.)
- `.route()` for HTTP method + path binding
- Contract-first approach — contracts live in `packages/rpc/` separate from implementation
- Zod-native — no type mapping layer needed
- First-party OpenAPI generation (`@orpc/openapi`)

### Option 2: REST (NestJS Controllers)

Traditional REST endpoints using NestJS `@Controller()`, `@Get()`, `@Post()` decorators.

**How it would work:**
- Controllers in each module with route decorators
- Validation via Zod or `class-validator`
- Type safety via shared DTOs in `packages/types/`
- OpenAPI via `@nestjs/swagger`

**Key differences from oRPC:**
- No automatic client generation — types must be manually duplicated or shared via a package
- Multiple HTTP endpoints (one per operation) vs single RPC endpoint
- NestJS-native — works with existing NestJS infrastructure
- Well-understood by most backend developers

### Option 3: tRPC

TypeScript RPC framework with end-to-end type safety, similar to oRPC but NestJS-independent.

**Why oRPC was preferred over tRPC:**
- tRPC is primarily designed for React/Next.js full-stack apps (not NestJS backends)
- NestJS integration requires adapter layers and is less mature
- oRPC works with any server framework (Express, Fastify, NestJS, Hono)
- oRPC has `.meta()` for operation metadata built-in — tRPC requires middleware for this
- oRPC supports OpenAPI generation — tRPC requires `trpc-openapi` (separate library)

### Option 4: gRPC

Binary protocol with Protocol Buffers for high-performance service-to-service communication.

**Why not chosen:**
- gRPC requires Protocol Buffers compilation step — adding build complexity
- gRPC-Web is less mature and has limitations (no bidirectional streaming in browser)
- gRPC is designed for service-to-service, not browser-to-server
- NestJS gRPC integration adds complexity (microservice transport layer)
- No Zod-native validation — requires Protobuf schema + mapping layer
- Developer experience is worse for a frontend-heavy application

### Option 5: GraphQL (NestJS + Apollo/Mercurius)

Query language for APIs with type-safe schema definition using SDL or code-first decorators.

**Why not chosen:**
- GraphQL adds significant complexity (resolvers, schema stitching, N+1 problem)
- Caching is harder (many unique queries vs. few well-defined RPC operations)
- Most SAPTM operations are mutations with business logic, not flexible queries
- oRPC provides better caching semantics (each operation maps to a URL)
- GraphQL's flexibility is unnecessary for a domain-driven application with bounded contexts
- Authorization is more complex at the field level
- Audit trail per operation is harder (no single operation boundary)

## Decision

**Use oRPC (`@orpc/server` v1) as the sole API transport for all application-level communication between frontend and backend.**

The oRPC contract layer (`packages/rpc/`) is the **single source of truth** for all API operations. No REST endpoints are created for application data (exemptions: health checks, Better Auth routes, webhook receivers from external systems).

### Contract structure

Every RPC module in `packages/rpc/src/{domain}.ts` must export:

```typescript
export const {domain}{Operation}InputSchema = z.object({ ... });
export const {domain}{Operation}OutputSchema = z.object({ ... });
export const {domain}{Operation}Metadata = {
  name: "{domain}.{operation}",
  version: "1",
  kind: "query" | "mutation",
  auth: { mode: "required" | "optional" | "public" },
  permissions: ["{domain}.{action}"] | undefined,
  audit: { severity: "low" | "medium" | "high" },
  idempotency: { supported: boolean, keySource: "header" | "body" },
  criticality: "low" | "medium" | "high",
} as const;
```

### Transport details

- **Endpoint:** `POST /rpc` (or `POST /v1/rpc` for versioned)
- **HTTP method binding:** via `.route({ method: "GET", path: "/... " })` for reads, `.route({ method: "POST", ... })` for mutations
- **Context:** `apps/api/src/rpc/rpc-context.ts` provides typed context with `IncomingMessage & RpcRequestWithAuthContext`
- **Authorization:** Centralized in `apps/api/src/rpc/rpc-context.service.ts` via `authorizeRequest()` — checks auth mode + permissions from metadata
- **Error handling:** Standardized error catalog at `packages/rpc/src/errors.ts`
- **OpenAPI:** Generated via `@orpc/openapi` for docs, available at `/api/docs` (Swagger UI)

### Exemptions (non-oRPC endpoints)

The following endpoints do NOT go through oRPC:
- `GET /health` — health checks (no auth, cannot be blocked by any middleware)
- `/api/auth/*` — Better Auth routes (authentication is pre-RPC)
- `/billing/webhook` — Stripe webhook receiver (external callback, signature-validated)
- Static assets and Next.js pages (served by Next.js, not the API)

## Consequences

### Positive
1. ✅ **Single source of truth** — Contracts in `packages/rpc/` are shared between `apps/api` and `apps/web`. Changes to contracts are type-checked on both sides at build time
2. ✅ **Zod validation built-in** — Every operation has input/output validation without decorators or DTO classes. Zod v4 is used consistently across the stack
3. ✅ **Operation metadata** — `.meta()` provides a declarative approach to auth, permissions, audit, idempotency, and criticality. No need for separate decorators or configuration
4. ✅ **Contract-first governance** — API contracts exist independently of implementation. New endpoints require a contract review (via ADR if cross-context)
5. ✅ **Clean separation** — `packages/rpc/` has no dependency on NestJS or Next.js. It only depends on Zod and `@orpc/server` contracts
6. ✅ **HTTP method semantics** — GET for queries (cacheable), POST for mutations (idempotent where supported). Standard caching and HTTP semantics apply
7. ✅ **OpenAPI compatible** — `@orpc/openapi` generates spec for documentation and external consumption (persona Ana — KR5.1)
8. ✅ **Future streaming support** — oRPC supports SSE/WebSocket transport for real-time tracking (KR2.1)

### Negative
1. ❌ **Single endpoint** — All RPC operations go through `POST /rpc`. This means load balancers and API gateways cannot route by path. Mitigation: version prefix (`/v1/rpc`) allows some routing; `.route()` method binding allows GET for cacheable queries
2. ❌ **Less familiar** — oRPC is less known than REST or GraphQL. New developers need to learn the framework. Mitigation: contracts are simple Zod objects; the RPC layer is thin
3. ❌ **HTTP caching** — GET-based queries are cacheable at the HTTP level, but POST-based queries are not. Mitigation: use `.route({ method: "GET" })` for all read operations (overview, analytics, detail queries)
4. ❌ **Framework dependency** — `@orpc/server` is a relatively young library. If abandoned, migration effort is moderate (contracts are the valuable part, not the transport). Mitigation: contracts are standard Zod schemas — any validation library can consume them
5. ❌ **Browser tooling** — Browser DevTools do not natively understand oRPC the way they understand REST. Mitigation: OpenAPI spec enables Postman/Insomnia usage; oRPC has built-in playground for development

### Migration notes

- **From REST to oRPC:** Not applicable — oRPC was chosen from the start
- **Version upgrades:** As `@orpc/server` evolves, the contract layer should remain stable (Zod schemas are framework-agnostic). The `@orpc/server` types are mostly internal to `apps/api/src/rpc/` and `apps/web/src/rpc/`
- **Adding new transport:** If gRPC is needed for internal service communication in the future, oRPC contracts can be mapped to Protobuf (both have defined input/output schemas). This is a P2 concern

## Compliance

- [x] C4 diagrams updated (Nível 3 — Component, showing RPC layer)
- [x] Bounded contexts documented
- [x] ADR written for this decision
- [x] Dependency graph validated (no cycles — `@saptm/rpc` is a leaf dependency)
- [x] Layer boundaries respected (Contracts → Implementation → Transport)

## References

- `packages/rpc/src/` — All contract definitions
- `apps/api/src/rpc/` — RPC context and authorization middleware
- `apps/api/src/{domain}/{domain}-rpc.router.ts` — RPC router implementations
- `apps/web/src/rpc/` — Frontend RPC client setup
- `docs/architecture/architecture-audit.md` §8 — Gap analysis mentioning missing ADR
- `docs/adr/0007-api-versioning-strategy.md` — API versioning using `/v1/rpc` prefix
