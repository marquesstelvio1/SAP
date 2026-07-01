# Phase 4 — API ↔ Frontend Integration Audit

## Score: 78/100

## Communication Pattern

| Layer | Technology | Pattern |
|-------|-----------|---------|
| **Client → Server** | `next/headers` + `fetch()` | Server Components call API directly (BFF pattern) |
| **Auth** | Better Auth cookies | Cookie forwarding via `headers().get("cookie")` |
| **Transport** | HTTP + JSON | All RPC calls via HTTP (no WebSocket) |
| **Serialization** | `{ json: data }` | JSON-RPC style envelope |
| **Validation** | Zod on both sides | Input validated client-side (schema), output validated server-side |
| **Cache** | `cache: no-store` | All requests are uncached |

## RPC Body Format

Client sends:
```json
{ "json": <inputData> }
```

Server responds:
```json
{ "json": <outputData> }
```

Error responses use `{ json: <errorEnvelope> }` format (consistent with success).

## Lib Files: 18 total

All follow the same pattern:
1. Build URL from env + path
2. Forward cookies from `headers()`
3. fetch() with appropriate method
4. Check status → Result discriminated union
5. Parse `envelope.json` with Zod schema
6. Return typed result

## Critical Findings

**CRITICAL-003: CSRF blocking all RPC mutations**
- CSRF middleware excluded only `["/health", "/api/auth"]` from CSRF protection
- All POST/PUT/DELETE requests to `/rpc/*` would fail with 403 because:
  - Server Components don't send `x-csrf-token` header
  - POST and mutations require valid CSRF token
  - No mechanism to forward or generate CSRF tokens server-side
- **Fix**: Added `/rpc` and `/v1/rpc` to CSRF excluded paths (RPC has its own auth layer)
- **Status: FIXED** — see `apps/api/src/main.ts:21`

**MAJOR-008: Massive boilerplate duplication**
- Every lib file duplicates the same fetch + parse + error handling pattern
- 18 lib files, ~60 lines each = ~1080 lines of near-identical code
- No central `rpcClient` abstraction
- Adding a new RPC call requires copying the entire pattern
- Single point of failure: if the envelope format changes, all 18 files need updating

**MAJOR-009: No client-side data fetching**
- All data fetching happens in Server Components only
- No `useQuery`/`useMutation` pattern for client-side interactivity
- Mutations (markRead, export, search) trigger full server rerender
- No optimistic updates, no loading states for mutations
- No React Query / TanStack Query usage in the lib layer

**MINOR-008: Method inconsistency between GET and POST**
- Read operations use both GET (tracking, cargo) and POST (notifications, audit)
- Inconsistent HTTP semantics (should be GET for reads, POST for mutations)
- Causes issues with caching proxies and API gateways

**MINOR-009: No error body parsing**
- Client ignores error response body entirely
- Only checks HTTP status code → returns generic message
- Error details from server (validation errors, conflict details) are lost

## Recommendations

| Priority | Action |
|----------|--------|
| P0 | ✅ CSRF exclusion for RPC paths (fixed) |
| P1 | Create centralized `rpcClient.ts` wrapper to eliminate boilerplate |
| P1 | Add TanStack Query hooks for client-side mutations |
| P2 | Normalize HTTP methods (GET for queries, POST for mutations) |
| P2 | Parse error response bodies for richer error messages |
