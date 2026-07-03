# Proxy & Session Forwarding Audit

> **Date:** 2026-07-03  
> **Scope:** Session cookie flow from browser → Next.js web → NestJS API  
> **Architecture:** Next.js 16 (App Router) + NestJS 11 + Better Auth v1  
> **Domains:** `saptmweb.onrender.com` (web) / `saptmapi.onrender.com` (API)

---

## 1. Architecture Overview

```
Browser ──► saptmweb.onrender.com ──► saptmapi.onrender.com
              │                              │
              ├─ Better Auth                 ├─ BetterAuthSessionService
              │  (creates session)           │  (validates session)
              ├─ proxy.ts                    ├─ AuthContextMiddleware
              │  (security headers,          ├─ CSRF Middleware
              │   rate limit, session check) └─ Tenant scoping
              ├─ /api/auth/[...all]          └─ Resolves orgId from user auth
              │  (Better Auth handler)
              └─ /api/rpc/[...path]
                 (forwards to API)
```

---

## 2. Session Cookie Flow

### 2.1 Cookie Creation (Sign-In)
- **Better Auth** sets the session cookie on `saptmweb.onrender.com`
- Cookie name in production: `__Secure-better-auth.session_token` (HTTPS forces `__Secure-` prefix)
- Cookie name in development: `better-auth.session_token`
- Cookie attributes (Better Auth defaults for production):
  - `Secure: true`
  - `SameSite: Lax`
  - `HttpOnly: true`
  - `Path: /`
  - Domain: defaults to `saptmweb.onrender.com` (from `baseURL: env.BETTER_AUTH_URL`)
- No custom `domain` override is configured (no `crossSubDomainCookies`)
- **Cookie cache** enabled with `maxAge: 60s` (encrypted session data cached in a signed cookie)

### 2.2 Browser → Web Proxy (Client-Side RPC)
**Path:** `rpc-client.ts` → Browser `fetch()` → `/api/rpc/...` → Route Handler → API

1. Browser makes `fetch("/api/rpc/tracking/overview")` to same origin
2. Browser automatically includes `cookie: __Secure-better-auth.session_token=...` (same-origin, SameSite=Lax allows this)
3. Proxy route handler (`apps/web/app/api/rpc/[...path]/route.ts`) receives the request
4. Extracts `cookie` header: `request.headers.get("cookie")`
5. Makes server-side `fetch()` to `https://saptmapi.onrender.com/rpc/tracking/overview` with:
   - `cookie: <original cookie header>`
   - `x-internal-request: true`
   - `content-type: <original>`
6. API CSRF middleware sees `x-internal-request: true` → **skips CSRF check** ✅
7. `AuthContextMiddleware` → `BetterAuthSessionService.getSession({ headers })` → validates session ✅

### 2.3 Browser → Web → SSR (Server Components)
**Path:** `rpc-server.ts` → Incoming `headers()` → `rpc-client.ts` → Direct API call

1. Server Component calls `getTrackingOverview()` from `rpc-client.ts`
2. `rpc-server.ts` wrapper calls `headers()` from `next/headers` (gets **incoming request** headers)
3. Extracts `cookie` from incoming request headers
4. Calls `rpcGet("/rpc/tracking/overview", schema, { cookie })`
5. `rpc-client.ts` sees `hasCookie = true` → constructs URL: `https://saptmapi.onrender.com/rpc/tracking/overview`
6. Server-side `fetch()` includes `cookie` + `x-internal-request: true`
7. API validates session normally ✅

### 2.4 Server Actions
**Path:** Server Action → `requirePlatformSession()` → `createSaptmAuthFromEnv()` → Database

1. `org-actions.ts` calls `requirePlatformSession()`
2. `auth-session.ts` calls `headers()` from `next/headers` (incoming request)
3. Validates session via `createSaptmAuthFromEnv().api.getSession({ headers })` directly on the **web side**
4. This does NOT go through the API at all — session validated against shared database ✅

---

## 3. Header Forwarding Analysis

### 3.1 Headers Forwarded by Proxy Route Handler
| Header | Forwarded? | Source |
|--------|-----------|--------|
| `cookie` | ✅ Lines 15-18 | `request.headers.get("cookie")` |
| `content-type` | ✅ Lines 20-23 | `request.headers.get("content-type")` |
| `x-internal-request` | ✅ Hardcoded (line 12) | Always set to `"true"` |
| `x-forwarded-for` | ❌ Not forwarded | Missing |
| `x-real-ip` | ❌ Not forwarded | Missing |
| `user-agent` | ❌ Not forwarded | Missing |
| `x-forwarded-proto` | ❌ Not forwarded | Missing |
| `authorization` | ❌ Not forwarded | Missing |
| `host` | ❌ Not forwarded | Auto-set by `fetch()` |
| `origin` | ❌ Not forwarded | Missing |
| `referer` | ❌ Not forwarded | Missing |

### 3.2 Headers Returned from API → Browser
| Header | Forwarded? | Source |
|--------|-----------|--------|
| `content-type` | ✅ Lines 42-43 | Forwarded to browser |
| `x-csrf-token` | ✅ Lines 42-43 | Forwarded (or empty string) |
| `set-cookie` | ✅ Lines 45-48 | Forwarded to browser |
| All others | ❌ Stripped | Not forwarded |

---

## 4. Issues Found

### ⚠️ ISSUE 1 (Medium): Missing IP and User-Agent Forwarding

**Problem:** The proxy does not forward `x-forwarded-for`, `x-real-ip`, or `user-agent` headers to the API.

**Impact:**
- Better Auth session tracking records `ipAddress: null` and `userAgent: null` for RPC-based operations
- API rate limiting (NestJS `@nestjs/throttler`) cannot determine real client IP
- Audit trail loses original client IP context
- Better Auth's `advanced.ipAddress.ipAddressHeaders: ["x-client-ip", "x-real-ip"]` configuration cannot extract real IP

**Code reference:** `apps/web/app/api/rpc/[...path]/route.ts` lines 11-18

**Recommendation:**
```typescript
const headers: Record<string, string> = {
  "x-internal-request": "true",
};

const cookie = request.headers.get("cookie");
if (cookie) {
  headers.cookie = cookie;
}

// Forward IP tracking headers
const forwardedFor = request.headers.get("x-forwarded-for");
if (forwardedFor) {
  headers["x-forwarded-for"] = forwardedFor;
}

const realIp = request.headers.get("x-real-ip");
if (realIp) {
  headers["x-real-ip"] = realIp;
}

const userAgent = request.headers.get("user-agent");
if (userAgent) {
  headers["user-agent"] = userAgent;
}
```

### ⚠️ ISSUE 2 (Low): CSRF Session Cookie Name Mismatch

**Problem:** The API's CSRF middleware (`apps/api/src/security/csrf.middleware.ts`) only reads the non-prefixed cookie name for session identification:

```typescript
// Line 115 - Only checks "better-auth.session_token"
const match = cookies.match(/(?:^|;\s*)better-auth.session_token=([^;]+)/);
```

In production, Better Auth uses `__Secure-better-auth.session_token` (with the `__Secure-` prefix for HTTPS), so this regex never matches in production. The anonymous fallback ID is always used:

```typescript
return deriveSessionId(`${csrfSecret}:${ANONYMOUS_SESSION_ID}`);
```

**Impact:** The CSRF token derivation uses an anonymous session identifier for ALL users in production. This means:
- CSRF tokens are not bound to specific sessions
- Session revocation doesn't invalidate CSRF tokens
- All users' CSRF tokens are interchangeable

**Mitigation:** This is mitigated because:
- All RPC requests from the proxy include `x-internal-request: true`, which bypasses CSRF entirely
- Only safe methods (GET, HEAD, OPTIONS) generate CSRF tokens
- The CSRF cookie (`__Host-saptm-csrf`) is still cryptographically bound to the secret

**Recommendation:** Update the regex to also match the `__Secure-` prefix:
```typescript
const match = cookies.match(
  /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/
);
```

### ⚠️ ISSUE 3 (Low): `/api/` Paths Exempt from Proxy Rate Limiting

**Problem:** In `apps/web/proxy.ts`, `isPublicPath()` treats ALL `/api/` paths as public:

```typescript
function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/")  // ← All API paths bypass rate limiting
  );
}
```

This means `/api/rpc/*` requests bypass the in-memory rate limiter in `proxy.ts`. The API has its own rate limiting via `@nestjs/throttler`, but:
- The proxy uses a simple in-memory limiter (30 req/min)
- The API uses Redis-backed throttler with tiers (200/min global, 1000/min org, 100/min user)
- The proxy's limiter acts as a first line of defense

**Mitigation:** The API has proper Redis-backed rate limiting. The proxy's in-memory limiter is a lightweight front-line defense primarily for page requests.

**Recommendation:** Consider adding a separate rate-limiting check for `/api/` paths in the proxy, or move all rate limiting to the API where Redis storage is available.

### ⚠️ ISSUE 4 (Info): No `authorization` Header Forwarding

**Problem:** The proxy doesn't forward the `authorization` header. While the system primarily uses cookie-based auth, service account authentication relies on `authorization: Bearer <api-key>` or similar.

**Impact:** If a service account makes an API call through the proxy (e.g., from a webhook or integration), the Bearer token won't be forwarded, and the request will fail authentication.

**Recommendation:** Forward the `authorization` header if present:
```typescript
const auth = request.headers.get("authorization");
if (auth) {
  headers.authorization = auth;
}
```

---

## 5. Security Headers & CSP Assessment

### 5.1 CSP `connect-src`
The CSP built by `proxy.ts` includes:
- `'self'`
- `origin` (web domain)
- `apiUrl` (API domain, if different from origin)
- `https://vitals.vercel-analytics.com`

Since `saptmweb.onrender.com !== saptmapi.onrender.com`, the API domain IS included in `connect-src`. This permits browser-side `fetch()` calls directly to the API. However:
- No client-side code makes direct API calls (all go through the proxy)
- The API's CSRF middleware would block direct browser requests
- **Defense-in-depth weakening** but not exploitable

### 5.2 Cross-Origin Security Headers
| Header | Value | Assessment |
|--------|-------|-----------|
| `Cross-Origin-Opener-Policy` | `same-origin` | ✅ Correct |
| `Cross-Origin-Resource-Policy` | `same-origin` | ✅ Correct |
| `X-Frame-Options` | `DENY` | ✅ Correct |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ Correct |

No issues with cross-origin security headers affecting cookie forwarding.

### 5.3 Cookie `SameSite` Assessment
- Better Auth session cookie: `SameSite=Lax` (default)
- `saptm_active_org` cookie: `sameSite: "lax"` (configured in `org-actions.ts`)
- CSRF cookie: `sameSite: "strict"` (configured in CSRF middleware)

**Assessment:** All `SameSite` settings are appropriate. `Lax` allows the session cookie to be sent on top-level navigations and same-origin requests. CSRF cookie uses `Strict` for maximum protection.

---

## 6. Multi-Tenancy Context Forwarding

### 6.1 Organization ID Flow
The `organizationId` is resolved through two parallel paths:

**Path A: RPC calls to the API**
1. Proxy forwards session cookie to API
2. API resolves session via `BetterAuthSessionService.getSession()`
3. `AuthContextService.resolveSessionContext()` calls `UserAuthorizationService.resolveDefaultUserAuthorization(userId)`
4. Returns the user's default organization based on database memberships
5. `TenantContextMiddleware` sets AsyncLocalStorage with `organizationId` for Prisma scoping

**Path B: Server Components / Server Actions**
1. `auth-session.ts` `getCurrentPlatformSession()` validates session directly in Next.js
2. Reads `saptm_active_org` cookie from the incoming request
3. Resolves authorization to get default organization
4. If cookie has a different accessible org, uses the cookie value

**Observation:** The `saptm_active_org` cookie is read by the web app but NOT by the API. The API always resolves the organization from the user's default authorization. This could lead to inconsistency if the user switches organizations via the `saptm_active_org` cookie — RPC calls to the API would still use the default org, not the cookie-selected org.

### 6.2 Recommendation for Org Context
If the API needs to respect the user's active organization selection, the `organizationId` should be forwarded explicitly:
- Add a custom header like `x-saptm-org-id` from the proxy
- The API could optionally use this header to scope queries
- Alternatively, the API's `UserAuthorizationService` could accept an `organizationId` override from the request

---

## 7. Forwarded Cookie Dry-Run Diagram

```
CLIENT BROWSER
  │
  │ Cookie: __Secure-better-auth.session_token=abc...; saptm_active_org=org_123
  │
  ▼
saptmweb.onrender.com/api/rpc/tracking/overview
  │
  ├─ proxy.ts skips (isPublicPath: /api/ → true)
  │
  ▼
RPC Route Handler [...path]/route.ts
  │
  ├─ Reads cookie: ✓ "better-auth.session_token=..." (or __Secure- prefix variant)
  │  Note: In production, the `__Secure-` prefix version is the actual cookie name
  │
  ├─ Constructs headers:
  │   ├─ x-internal-request: true          ← always set ✓
  │   ├─ cookie: full cookie header         ← forwarded ✓
  │   └─ content-type: application/json     ← forwarded ✓
  │   └─ (missing: x-forwarded-for, user-agent, authorization) ← ✗
  │
  ▼
saptmapi.onrender.com/rpc/tracking/overview
  │
  ├─ CSRF Middleware: sees x-internal-request → bypass ← ✓
  │  (cookie name mismatch for non-internal would be an issue)
  │
  ├─ AuthContextMiddleware
  │   └─ BetterAuthSessionService.getSession({ headers })
  │       └─ Reads cookie → validates session → returns user + session
  │
  ├─ UserAuthorizationService
  │   └─ resolveDefaultUserAuthorization(userId)
  │       └─ Returns permissions + organizationId
  │
  └─ TenantContextMiddleware
      └─ runWithTenantContext({ organizationId }, ...)
```

---

## 8. Summary of Recommendations

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **Medium** | Missing `x-forwarded-for`, `user-agent`, `x-real-ip` in proxy | Add these headers to the forwarded request |
| 2 | **Low** | CSRF middleware only matches non-prefixed session cookie | Update regex to include `__Secure-` prefix |
| 3 | **Low** | All `/api/` paths bypass proxy rate limiter | Add RPC-specific rate limiting or rely on API-only rate limiting |
| 4 | **Info** | Missing `authorization` header forwarding | Add Bearer token forwarding for service account support |
| 5 | **Info** | API doesn't respect `saptm_active_org` cookie | Add `x-saptm-org-id` header forwarding or API support for org override |

### Validated: Working Correctly ✅
- Session cookie forwarded from browser → proxy → API
- SSR cookie forwarding via `rpc-server.ts` → `rpc-client.ts` → direct API call
- CSRF bypass via `x-internal-request` header (internal-only)
- Response `Set-Cookie` headers forwarded back to browser
- `x-csrf-token` response header forwarded back to browser
- Cookie cache disabled for RPC session validation (`disableCookieCache: true`)
- Session refresh disabled for RPC calls (`disableRefresh: true`) — intentional to avoid write contention
- Separate `saptm_active_org` cookie for org switching (used server-side in web app)
