# ADR 0007 — API Versioning Strategy

## Status

Accepted.

## Context

The platform uses oRPC as the sole API transport layer — all frontend-to-backend communication passes through RPC, with no REST endpoints. The RPC HTTP middleware in `apps/api` currently supports both `/v1/rpc` and `/rpc` URL prefixes for backwards compatibility.

Each RPC operation carries a `version` field in its metadata (`packages/rpc/src/metadata.ts`), defaulting to `1`. All current contracts use `version: 1`.

The frontend client (`apps/web/lib/rpc-client.ts`) makes requests using unversioned paths (e.g., `/rpc/billing/overview`). The browser-side proxy rewrites `/api/rpc/*` to the NestJS API.

As the platform matures and contracts evolve, a strategy is needed to introduce breaking changes, maintain backwards compatibility for existing clients, and communicate API lifecycle clearly.

## Decision

**Version the API through the URL prefix (`/v{n}/rpc/...`) at the API level** (not per-endpoint or per-domain).

### Mechanics

1. **URL prefix routing** — The RPC middleware (`RpcHttpMiddleware`) tries prefixes in order. When version `v2` is introduced, the prefix list becomes `["/v2/rpc", "/v1/rpc", "/rpc"]`. The unversioned `/rpc` alias is kept for one major version as a migration aid, then removed.

2. **Version granularity** — API-level versioning. All endpoints are versioned together under a single `v{n}` prefix. Domain-level versioning (e.g., `/v2/rpc/cargo`, `/v1/rpc/tracking`) is explicitly not adopted, as it creates an inconsistent client experience and complicates middleware chains.

3. **Metadata version field** — The `version` field in `RpcOperationMetadata` records the API version when the operation was introduced or last changed. This is a documentary field for observability and contract governance, not a routing mechanism. When migrating to a new API version, all operations that changed are deployed under the new prefix.

4. **Version lifecycle** — Each API version follows a three-phase lifecycle:
   - **Active** — fully supported, receives bug fixes and non-breaking improvements.
   - **Deprecated** — still functional but scheduled for sunset. Deprecation is announced at least 6 months in advance via the health endpoint response and release notes.
   - **Sunset** — removed from the `RpcHttpMiddleware` prefix list. Requests receive a `404` response.

5. **Client version selection** — The frontend RPC client (`rpcUrl()` in `apps/web/lib/rpc-client.ts`) constructs the URL with the appropriate version prefix. The active API version is configured via environment variable. Server-to-server calls use the same mechanism.

6. **Backwards compatibility** — When a new API version is introduced, the previous version remains active in the middleware prefix list. Both versions are served by the same NestJS application instance, avoiding the operational overhead of parallel deployments for API versioning.

### What does NOT change

- **Contract-first approach** (ADR 0004) — contracts remain in `@saptm/rpc` with Zod schemas.
- **Metadata validation** — the `version` field continues to be validated by `createRpcOperationMetadata`.
- **Transport** — oRPC remains the sole transport, with no REST endpoints introduced for versioning purposes.
- **Error catalog** — error codes and their HTTP mappings remain shared across versions.

## Rationale

- **URL prefix versioning** is the simplest strategy to implement with the current middleware architecture — the prefix array pattern already exists.
- **API-level granularity** avoids the complexity of maintaining multiple contract versions simultaneously for different domains, which would require contract duplication and complex middleware routing.
- **Same-instance deployment** avoids the operational burden of running separate API deployments per version while still providing a clean break between versions.
- **Documentary version field** in metadata provides observability and governance without dictating routing, keeping the two concerns separate.

## Consequences

### Positive

- The current middleware already supports the prefix pattern — no new infrastructure required.
- Clients explicitly opt into a version, making API changes visible and traceable.
- The unversioned `/rpc` fallback eases migration during the first version bump.
- Same-instance serving keeps operational costs low.

### Negative

- API-level versioning means a single breaking change in one domain forces a version bump for the entire API.
- The prefix list in the middleware grows linearly with each major version, requiring periodic cleanup.
- Unversioned `/rpc` creates a window of ambiguity — clients may unknowingly depend on the unversioned prefix.

### Mitigations

- Breaking changes are expected to be rare in the logistics domain; most evolution is additive (new contracts, new fields).
- Sunset versions are removed from the prefix list on a defined schedule, documented in the changelog.
- Monitoring alerts on unversioned prefix usage track migration progress.
- The documentary `version` field in contract metadata ensures visibility into which version introduced each operation.
