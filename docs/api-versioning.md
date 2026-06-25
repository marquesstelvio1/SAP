# API versioning strategy

## 1. Versioning approach

**URL prefix versioning** — all RPC routes are scoped under `/v{major}/rpc/`.

```
# Current (implicit v1)
/rpc/tracking/overview

# Explicit v1
/v1/rpc/tracking/overview
```

The middleware already handles both prefixes (see `apps/api/src/rpc/rpc-http.middleware.ts:70`):

```ts
const prefixes = ["/v1/rpc", "/rpc"] as const;
```

Header-based versioning is **not used**. URL prefix is chosen because it is:
- Cache/CDN friendly (different versions are different URLs)
- Self-documenting in logs and metrics
- Easy to route at the reverse-proxy level
- Trivially testable with curl/httpie

## 2. Version lifecycle

```
introduce → active → deprecated → sunset
```

| Phase | Duration | Behavior |
|---|---|---|
| **Active** | indefinite | Full support, all requests served |
| **Deprecated** | 6 months | Still served, `Sunset` header returned, documentation marked |
| **Sunset** | — | 410 Gone, route removed from middleware |

**Transition rules:**

1. A new major version is introduced when an **incompatible** change is needed (see §3).
2. The previous major version is immediately marked **deprecated**.
3. A `Sunset` HTTP header is added to all deprecated routes: `Sunset: Sat, 01 Jan 2027 00:00:00 GMT`.
4. After the sunset window, the deprecated prefix is removed from the middleware and routes return 410.
5. At most **two major versions** are active at any time (`/v{N}/rpc/` + `/v{N-1}/rpc/`).

### Per-operation version metadata

Each operation in `@saptm/rpc` carries an explicit `version` field inside `RpcOperationMetadata`. This is **not** the route prefix — it is the operation-level contract version, used for granular capability detection:

```ts
export const trackingOverviewMetadata = createRpcOperationMetadata({
  name: "tracking.overview",
  version: 1,       // operation contract version
  kind: "query",
  // ...
});
```

The URL prefix major version and the operation metadata version may diverge (e.g., `/v1/rpc/` can serve operations at metadata version 1 or 2 if they are additive).

## 3. Backward compatibility

Within a major version, all changes **must** be backward-compatible:

| Change type | Allowed? | Rule |
|---|---|---|
| Add a field to output schema | ✅ Yes | New field is optional / has a default |
| Add a new operation | ✅ Yes | New route, no existing consumer affected |
| Add an optional field to input schema | ✅ Yes | Old requests without the field still work |
| Remove a field from output schema | ❌ No | Requires new major version |
| Rename a field | ❌ No | Requires new major version |
| Change a field type | ❌ No | Requires new major version |
| Make an optional field required | ❌ No | Requires new major version |
| Change auth/permission requirements | ❌ No | Requires new major version |
| **Change error contract** (error code removed or renamed) | ❌ No | Requires new major version |

**Error contract is part of the API contract.** Clients depend on error codes for retry logic, fallback UX, and monitoring. Changing error codes, removing error cases, or altering the envelope shape is a breaking change.

### Exception: security patches

Security-critical fixes (e.g., auth bypass, PII leak) may be backported to the previous major version without extending its sunset date.

## 4. Version policy

- **Support window:** each major version is supported for 6 months after the next major version ships.
- **Breaking change review:** all breaking changes require (a) an ADR in `docs/adr/`, (b) announcement on the internal changelog 30 days before deprecation.
- **Backport policy:** only critical bug fixes and security patches are backported to deprecated versions.
- **Client compatibility:** clients should declare the oldest API version they support. The `Sunset` header is the authoritative signal for client teams to upgrade.

## 5. Implementation plan

### Phase 1 — explicit `/v1/rpc/` prefix (current setup)

The middleware in `apps/api/src/rpc/rpc-http.middleware.ts` already accepts `/v1/rpc`. The client library defaults to `/rpc`. No migration needed — both paths work.

### Phase 2 — drop `/rpc` alias (next major release)

1. Remove `/rpc` from the prefixes array in `rpc-http.middleware.ts`.
2. Update all client calls in `apps/web/lib/*.ts` from `/rpc/...` to `/v1/rpc/...`.
3. Add redirect rule at reverse-proxy level (`/rpc/*` → `/v1/rpc/*`).

### Phase 3 — introducing v2

1. Create `apps/api/src/rpc/v2/` directory with new routers (or a compatibility shim).
2. Add `/v2/rpc` to the middleware prefixes array **before** `/v1/rpc` (first match wins).
3. Old operations continue on `/v1/rpc`; new or changed operations use `/v2/rpc`.
4. Document migration path and set sunset for v1.

### Adding a version prefix to @orpc routes

@orpc routes use a `prefix` option in `RPCHandler.handle()`. The prefix is a URL path prefix that is stripped before matching against route definitions. This means **route definitions inside routers do not change** — only the prefix passed to the handler changes:

```ts
// Route definition stays the same
.route({ method: "GET", path: "/tracking/overview" })

// Handler prefix determines the actual URL
handler.handle(request, response, { prefix: "/v1/rpc" })
// → matches GET /v1/rpc/tracking/overview
```

**When introducing v2 routes, create new router instances with a different prefix:**

```ts
// apps/api/src/rpc/rpc-http.middleware.ts
const v1Handler = new RPCHandler(v1Router);
const v2Handler = new RPCHandler(v2Router);

// Try v2 first, fall back to v1
const v2Result = await v2Handler.handle(req, res, { prefix: "/v2/rpc" });
if (v2Result.matched) return;
await v1Handler.handle(req, res, { prefix: "/v1/rpc" });
```

## 6. Examples

### Before — implicit v1

```ts
// Client call (apps/web/lib/tracking-overview.ts)
const result = await rpcGet("/rpc/tracking/overview", trackingOverviewOutputSchema);

// Middleware (apps/api/src/rpc/rpc-http.middleware.ts)
const prefixes = ["/v1/rpc", "/rpc"] as const;

// Route definition (apps/api/src/tracking/tracking-rpc.router.ts)
.route({ method: "GET", path: "/tracking/overview" })
```

### After — explicit v1 with v2 available

```ts
// Client call (apps/web/lib/tracking-overview.ts)
const result = await rpcGet("/v1/rpc/tracking/overview", trackingOverviewOutputSchema);

// Middleware (apps/api/src/rpc/rpc-http.middleware.ts)
const v1Result = await v1Handler.handle(req, res, { prefix: "/v1/rpc" });
if (v1Result.matched) return;
const v2Result = await v2Handler.handle(req, res, { prefix: "/v2/rpc" });

// v2 route definition (apps/api/src/rpc/v2/tracking-rpc.router.ts)
.route({ method: "GET", path: "/tracking/overview-v2" })
```

### Deprecation response

```
GET /v1/rpc/tracking/overview
→ 200 OK
   Sunset: Sat, 01 Jan 2027 00:00:00 GMT
   Content-Type: application/json
```

### Sunset response

```
GET /v1/rpc/tracking/overview
→ 410 Gone
   Content-Type: application/json

{ "code": "api.version_sunset", "message": "API version 1 was sunset on 2027-01-01. Use /v2/rpc/*." }
```

## References

- `apps/api/src/rpc/rpc-http.middleware.ts` — handler prefix configuration
- `apps/api/src/rpc/platform-rpc.router.ts` — RPC router assembly
- `packages/rpc/src/metadata.ts` — `RpcOperationMetadata.version` field
- `apps/web/lib/rpc-client.ts` — client-side `rpcGet` / `rpcPost`
- `apps/web/lib/tracking-overview.ts` — example client data-fetching module
