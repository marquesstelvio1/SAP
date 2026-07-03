# Security Audit Report — SAPTM

**Date:** 2026-07-02  
**Auditor:** @enterprise-security  
**Scope:** Full repository security review (OWASP Top 10, Threat Modeling, IAM, Network Security, DevSecOps)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH | 4 |
| 🟡 MEDIUM | 5 |
| 🔵 LOW | 3 |

**Overall Verdict:** ⚠️ CONDITIONAL — The codebase demonstrates strong security architecture patterns, but has critical gaps in runtime enforcement (TwoFactorGuard not wired) and sensitive data exposure (production secrets on disk). Remediation of the 2 critical items is required before production deployment.

---

## 🔴 CRITICAL FINDINGS

### C-01: TwoFactorGuard Never Wired — Admin 2FA Not Enforced

| Field | Value |
|-------|-------|
| **File** | `apps/api/src/auth/guards/two-factor.guard.ts` |
| **Severity** | 🔴 Critical |
| **CWE** | CWE-287 (Improper Authentication) |
| **Risk** | Admin users are not required to have 2FA enabled, violating the stated security policy |

**Description:** The `TwoFactorGuard` is defined in `guards/two-factor.guard.ts` and implements the logic to require 2FA for users with `tenant.manage` permission. However, it is **never applied** to any controller, route, or module. A `grep` for `TwoFactorGuard` across `apps/api/src/` finds only the definition file itself — zero usages.

The `@UseGuards(TwoFactorGuard)` decorator is absent from all admin-protected controllers/routes, and the guard is not registered as a global `APP_GUARD`.

**Evidence:**
- `grep -r "TwoFactorGuard" apps/api/src/` → only `two-factor.guard.ts` self-reference
- `grep -r "@UseGuards(" apps/api/src/` → only found in a documentation comment in `public.decorator.ts`
- No `.useGuards` or `APP_GUARD` registration for `TwoFactorGuard` exists

**Remediation:**
1. Register `TwoFactorGuard` as a `@Global()` guard or apply it via the platform RPC middleware to enforce on all `session`-auth operations
2. Alternatively, inject 2FA enforcement into the RPC metadata pipeline (check `authContext.twoFactorEnabled` for admin permissions)
3. Add integration tests that verify admin routes reject non-2FA sessions
4. Consider a migration script to flag existing admin users without 2FA

---

### C-02: Production Credentials in .env File on Filesystem

| Field | Value |
|-------|-------|
| **File** | `.env` (local filesystem, not git-tracked) |
| **Severity** | 🔴 Critical |
| **CWE** | CWE-312 (Cleartext Storage of Sensitive Information) |
| **Risk** | Compromise of the development machine or CI runner exposes production database, auth secrets, and admin credentials |

**Description:** The `.env` file contains live production secrets:
- `DATABASE_URL` pointing to a `render.com` PostgreSQL instance with credentials
- `BETTER_AUTH_SECRET` — a 256-bit hex secret used for session signing
- `SAPTM_LOCAL_ADMIN_PASSWORD` — admin account password

While `.env` is in `.gitignore` (confirmed: `git ls-files .env` returns error), the file persists on disk in the repository root. Any machine that has this file (developer laptops, CI runners, build servers) is at risk if compromised.

**Evidence:**
```env
DATABASE_URL=postgresql://saptmpostgres_67t4_user:TZjKyGbjmHElOPmEM5tDysnKvPyi4PTi@dpg-***.render.com/saptmpostgres_67t4
BETTER_AUTH_SECRET=e43a0c4f561db207145150aea991edd48e7c82cd99ad25f07698885dda2f7335
SAPTM_LOCAL_ADMIN_PASSWORD=LocalAdmin!2026
```

**Remediation:**
1. **Immediately** rotate ALL secrets: database password, Better Auth secret, and admin password
2. Use a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager, Doppler) for local development
3. Add `.env` to `.dockerignore` to prevent inclusion in Docker images
4. Implement pre-commit hooks (e.g., `leaked-secrets` or `truffleHog`) to detect secrets
5. Consider using `dotenvx` encryption: `dotenvx encrypt .env` and commit only `.env.encrypted`

---

## 🟠 HIGH FINDINGS

### H-01: In-Memory Rate Limiter for Auth Routes (Not Redis-Backed)

| Field | Value |
|-------|-------|
| **Files** | `apps/web/lib/rate-limiter.ts`, `apps/web/app/api/auth/[...all]/route.ts`, `apps/web/app/api/csp-report/route.ts` |
| **Severity** | 🟠 High |
| **CWE** | CWE-799 (Improper Control of Interaction Frequency) |
| **Risk** | Rate limiting breaks when multiple Next.js instances are deployed |

**Description:** The Next.js auth routes (`/api/auth/*`) and CSP-report endpoint use an `InMemoryRateLimiter` (sliding window). The implementation acknowledges the limitation:
```
* This is a single-process limiter — it works correctly when there is exactly
* one running instance of the Next.js server (typical for SMB deployments).
* For horizontally-scaled deployments (multiple Next.js instances), this MUST
* be replaced with a Redis-backed limiter.
```

In production, if Next.js runs with multiple workers or instances (e.g., `output: "standalone"` with multiple replicas), an attacker can bypass rate limits by distributing requests across instances.

**Contrast:** The API side (`@nestjs/throttler` with `RedisThrottlerStorage`) correctly uses Redis. The gap is only on the Next.js side.

**Remediation:**
1. Replace `InMemoryRateLimiter` with a Redis-backed implementation (e.g., `@upstash/ratelimit` or custom `ioredis` implementation)
2. Ensure the Redis client is shared with the one already used for cache
3. Add load tests that verify rate-limit behavior under distributed scenarios

---

### H-02: Tenant Scoping Bypass via findUnique/findUniqueOrThrow

| Field | Value |
|-------|-------|
| **File** | `packages/database/src/tenant-scoping.ts` (lines 66-69, 192-210) |
| **Severity** | 🟠 High |
| **CWE** | CWE-284 (Improper Access Control) |
| **Risk** | Cross-tenant data access via unique identifier lookups |

**Description:** The Prisma tenant scoping extension explicitly **skips** `findUnique` and `findUniqueOrThrow` operations because Prisma restricts `where` clauses in these operations to unique constraint fields. The extension implements a post-query check that returns `null` if the result's `organizationId` doesn't match. However:

1. **35+ `findUnique` calls** exist across repositories (cargo, tariff, billing, admin, teams, auth, privacy)
2. For models **not** in `TENANT_SCOPED_MODELS` (like `Organization`, `User`), there is no scoping at all
3. The post-query check returns `null` silently — developers may not expect `null` when a record exists but belongs to another tenant
4. The `findUniqueOrThrow` bypass could throw unexpected errors

**Affected calls include:**
- `prisma-cargo.repository.ts:686` — `this.database.cargo.findUnique({ where: { id } })`
- `prisma-tariff.repository.ts` — 7+ `findUnique` calls
- `prisma-admin.repository.ts` — multiple `findUnique` on `Organization`, `User`, `Role`
- `prisma-auth.repository.ts:16` — `apiKey.findUnique` (no orgId scoping on ApiKey model)

**Remediation:**
1. For models in `TENANT_SCOPED_MODELS`: use `findFirst` instead of `findUnique` where possible (allows orgId in where)
2. Add explicit `organizationId` checks in the calling service code for all `findUnique` calls
3. Document the scoping gap for `findUnique` in a `docs/adr/` entry
4. Consider a lint rule that flags `findUnique`/`findUniqueOrThrow` on tenant-scoped models

---

### H-03: Metrics Endpoint Exposed Without Authentication

| Field | Value |
|-------|-------|
| **File** | `apps/api/src/observability/metrics.controller.ts` |
| **Severity** | 🟠 High |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **Risk** | Prometheus metrics (potentially containing internal state, PII patterns, business metrics) exposed to unauthenticated callers |

**Description:** The `/metrics` endpoint is marked `@Public()` and carries only rate limiting (20 req/min via `@Throttle`). The code acknowledges the risk:
```
* In production, access to this endpoint SHOULD be restricted at the
* network level (firewall / Kubernetes NetworkPolicy) to allow only
* Prometheus servers to scrape it. Do NOT expose this endpoint to the
* public internet without authentication.
```

Metrics may expose:
- Request rates and latencies (can infer business volume)
- Error rates by endpoint
- Database connection pool status
- Memory/CPU profiles

**Evidence:** `metrics.controller.ts:31-37`

**Remediation:**
1. Add API key or bearer token authentication for the metrics endpoint (using the existing `ServiceAccountAuthService`)
2. Or implement IP allowlisting at the application level (not just network)
3. Consider implementing mutual TLS (mTLS) for the Prometheus scrape
4. Document which metrics are safe to expose in a `docs/security/metrics.md`

---

### H-04: Rate Limiting Completely Disabled in Dev/Test

| Field | Value |
|-------|-------|
| **File** | `apps/api/src/rate-limit/rate-limit.module.ts` (lines 44-47) |
| **Severity** | 🟠 High |
| **CWE** | CWE-693 (Protection Mechanism Failure) |
| **Risk** | Rate limiting bypass in non-production environments masks vulnerabilities |

**Description:** The `ThrottlerModule` configuration uses `skipIf` to bypass all rate limiting when `NODE_ENV` is `development` or `test`:
```ts
skipIf: (_ctx) => {
  const env = process.env.NODE_ENV;
  return env === "development" || env === "test";
},
```

This means:
- Integration tests never exercise rate limiting
- Developers are unaware of rate limit errors until production
- CI pipeline doesn't validate rate limit configuration

**Remediation:**
1. Remove the `skipIf` entirely — apply rate limits consistently across all environments
2. If needed for development, use a higher limit (e.g., `limit: 10000`) instead of skipping
3. Add a test that validates rate limit headers are present
4. Consider environment-specific config objects instead of blanket bypass

---

## 🟡 MEDIUM FINDINGS

### M-01: CSP Uses `unsafe-eval` in Development Mode

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/proxy.ts` (line 38) |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-79 (Cross-Site Scripting) |
| **Risk** | Reduced XSS protection during development could mask exploitable patterns |

**Description:** The CSP `script-src` directive includes `'unsafe-eval'` when `NODE_ENV` is `development`. While acceptable for development tooling (Hot Module Replacement, React DevTools), it prevents catching eval-based XSS vectors during development.

**Evidence:** `buildCsp` function (lines 37-39):
```ts
const scriptSrc = isDev
  ? `'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
  : `'nonce-${nonce}' 'strict-dynamic'`;
```

**Remediation:**
1. Consider removing `'unsafe-eval'` even in dev and switching to `--webpack` for compatibility
2. Document that dev mode CSP is less restrictive
3. Add a CI check that validates production CSP string does not contain `'unsafe-eval'`

---

### M-02: CSP `default-src 'self'` — Overly Permissive Fallback

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/proxy.ts` (line 48) |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-79 (Cross-Site Scripting) |
| **Risk** | Loading unintended resources from the same origin |

**Description:** The CSP uses `default-src 'self'` as the fallback for directives not explicitly listed. While `'self'` is reasonable for a web application, the strictest secure baseline is `default-src 'none'` with explicit allowlisting of each resource type.

Currently explicit directives cover: `base-uri`, `form-action`, `frame-ancestors`, `object-src`, `img-src`, `font-src`, `script-src`, `style-src`, `connect-src`, `worker-src`, `frame-src`. The `default-src 'self'` acts as a catch-all for unspecified directives like `media-src`, `manifest-src`, `prefetch-src`.

**Remediation:**
1. Change `default-src` to `'none'` and explicitly allow needed resource types
2. Audit any `media-src`, `manifest-src`, or other uncommon directives needed by the application

---

### M-03: Multi-Org Membership Results in Empty Permissions

| Field | Value |
|-------|-------|
| **File** | `packages/auth/src/user-authorization.ts` (lines 39-43) |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-862 (Missing Authorization) |
| **Risk** | Users who belong to multiple organizations lose all permissions |

**Description:** The `resolveDefaultUserAuthorization` function returns empty permissions when a user has more than one active membership:
```ts
if (memberships.length !== 1) {
  return {
    permissions: [],
  };
}
```
When `memberships.length > 1`, the function returns an empty permission set. The user retains access (session is valid) but gets zero permissions, leading to:
- Confusing "Forbidden" errors with no indication why
- No multi-org user management possible
- Potential account lockout for users legitimately belonging to multiple orgs

**Remediation:**
1. Implement explicit organization context switching (user selects which org to operate in)
2. Populate permissions from the first org or selected org instead of returning empty
3. Add a UI for org switching in the platform header/workflow
4. Document the limitation in `docs/architecture/multi-tenancy.md`

---

### M-04: CSP Report Endpoint Accepts Multiple Content Types Without Strict Validation

| Field | Value |
|-------|-------|
| **File** | `apps/web/app/api/csp-report/route.ts` (lines 78-117) |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-20 (Improper Input Validation) |
| **Risk** | Potential request smuggling / content-type confusion |

**Description:** The CSP report endpoint accepts `application/csp-report`, `application/json`, and even attempts to parse plain text as JSON (fallthrough on line 103-116). While the parsing is robust, accepting arbitrary content for JSON parsing opens a minor attack surface:

1. The endpoint does not validate `Content-Type` strictly
2. The fallthrough path accepts any content type that happens to be valid JSON
3. No request body size limit is enforced

**Remediation:**
1. Enforce strict `Content-Type` checking — accept only `application/csp-report` and `application/json`
2. Add request body size limits (e.g., 10KB max via `request.text()` options or middleware)
3. Validate the CSP report fields against a Zod schema instead of manual parsing

---

### M-05: Session Cookie Cache — 60-Second Window for Stale Sessions

| Field | Value |
|-------|-------|
| **File** | `packages/auth/src/server.ts` (lines 178-181) |
| **Severity** | 🟡 Medium |
| **CWE** | CWE-613 (Insufficient Session Expiration) |
| **Risk** | Revoked sessions remain valid for up to 60 seconds |

**Description:** Better Auth session cookie cache is enabled with a 60-second max-age:
```ts
cookieCache: {
  enabled: true,
  maxAge: 60,
},
```
While not bypassing the server-side session validation (Better Auth still validates the session on the server), the cookie cache delays the propagation of session revocation. A session revoked by an admin or due to password change remains usable for up to 60 seconds by a browser that has the cached cookie.

**Remediation:**
1. Reduce `maxAge` to 10-15 seconds for a balance between performance and security
2. Consider disabling cookie cache for sensitive operations (the RPC already passes `disableCookieCache: true` for critical paths)
3. Document the trade-off in session management strategy

---

## 🔵 LOW FINDINGS

### L-01: Auth Middleware Error Catching Swallows Exception Details

| Field | Value |
|-------|-------|
| **File** | `apps/api/src/auth/auth-context.middleware.ts` (lines 17-22) |
| **Severity** | 🔵 Low |
| **CWE** | CWE-778 (Insufficient Logging) |
| **Risk** | Auth resolution errors are silently stored without logging |

**Description:** The `AuthContextMiddleware` catches all errors during auth context resolution and stores them as `request.authResolutionError`, but does not log them:
```ts
catch (error) {
  request.authResolutionError = error;
}
```
If the auth service fails (e.g., database connection error, session validation failure), the error is stored but not logged to any monitoring system. Downstream code checks `authResolutionError` and returns 401, but the root cause remains invisible in production logs.

**Remediation:**
1. Add structured logging for auth resolution errors (including the error message and correlation ID)
2. Forward to OpenTelemetry span as an event
3. Consider differentiating between transient errors (DB down) and auth failures (invalid session)

---

### L-02: API Security Headers Missing `Cross-Origin-Resource-Policy` on Web Side

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/proxy.ts` |
| **Severity** | 🔵 Low |
| **CWE** | CWE-1021 (Improper Restriction of Rendered UI Layers) |
| **Risk** | Slightly reduced protection against cross-origin resource embedding |

**Description:** The Next.js proxy (`proxy.ts`) sets security headers on the web responses. Compared to the API side (`security-headers.ts`), the web proxy is missing:
- `Cross-Origin-Embedder-Policy` (set only on API)
- `Cross-Origin-Resource-Policy` (set only on API as `same-origin`)

The API side has `Cross-Origin-Embedder-Policy: require-corp` which is notably absent from web responses.

**Remediation:**
1. Add `Cross-Origin-Embedder-Policy` and `Cross-Origin-Resource-Policy` headers to the web proxy
2. Verify that all external resources (fonts, images) are compatible with `require-corp`

---

### L-03: No HSTS Preload Submission Requested

| Field | Value |
|-------|-------|
| **Files** | `apps/web/src/proxy.ts:21`, `apps/api/src/security/security-headers.ts:15` |
| **Severity** | 🔵 Low |
| **CWE** | CWE-319 (Cleartext Transmission of Sensitive Information) |
| **Risk** | Users visiting via HTTP for the first time are not automatically upgraded |

**Description:** Both the API and web layers set `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, but there is no evidence of submission to the HSTS preload list (`https://hstspreload.org/`). The `preload` directive has no effect unless the domain is included in browser preload lists.

**Remediation:**
1. Submit the production domain to [hstspreload.org](https://hstspreload.org/) after verifying full HTTPS support
2. Ensure no subdomains serve content over HTTP (check for any dev/staging subdomains)

---

## Compliance Check

| Standard | Requirement | Status |
|----------|-------------|--------|
| OWASP Top 10 (2021) | A01 - Broken Access Control | ⚠️ H-02 (Tenant scoping bypass) |
| OWASP Top 10 (2021) | A02 - Cryptographic Failures | ⚠️ C-02 (Secrets on disk) |
| OWASP Top 10 (2021) | A04 - Insecure Design | ⚠️ H-01 (In-memory rate limiting) |
| OWASP Top 10 (2021) | A05 - Security Misconfiguration | ⚠️ C-01 (2FA not enforced) |
| OWASP Top 10 (2021) | A07 - Identification/Auth Failures | ⚠️ C-01, H-01 |
| OWASP Top 10 (2021) | A09 - Security Logging/Monitoring | ⚠️ L-01 (Auth error logging) |
| PCI DSS 4.0 | Req 8.4 - MFA for admin access | ❌ C-01 (2FA not enforced) |
| SOC 2 | CC6.1 - Logical Access Controls | ⚠️ H-02 (Tenant isolation gaps) |
| SOC 2 | CC7.2 - Monitoring of Security Events | ⚠️ L-01 |
| GDPR Art 32 | Security of processing | ⚠️ C-02 |

---

## Threat Model (STRIDE)

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|-----------------|-----|-----------|
| **Better Auth** | ✅ Sessions signed | ✅ Encrypted OAuth tokens | ⚠️ Auth error logging gap | ✅ CSP headers | ⚠️ Rate limit skips dev | ⚠️ 2FA not wired |
| **CSRF Protection** | ✅ Double-submit cookie | ✅ HMAC-derived secret | ✅ N/A | ✅ Cookie not exposed | ✅ N/A | ✅ Safe methods excluded |
| **CSP** | ✅ Nonce-based | ✅ Strict-Dynamic | ✅ N/A | ⚠️ `'unsafe-eval'` dev | ✅ Report-only mode | ✅ N/A |
| **Rate Limiting (API)** | ✅ IP-based | ✅ Redis-backed | ✅ N/A | ✅ Fine-grained tiers | ✅ Redis TTL | ⚠️ Skipped dev/test |
| **Rate Limiting (Next.js)** | ⚠️ In-memory only | ❌ No distributed state | ✅ N/A | ✅ N/A | ❌ Bypass with multi-instance | ⚠️ In-memory |
| **Tenant Scoping** | ✅ Prisma extension | ✅ Mid-layer injection | ✅ Audit trail | ⚠️ findUnique bypasses | ✅ N/A | ⚠️ findUniqueOrThrow |
| **Authorization** | ✅ RBAC perms | ✅ Guard middleware | ✅ Observability records | ✅ N/A | ✅ N/A | ⚠️ Multi-org returns empty |
| **API Keys** | ✅ SHA-256 hashed | ✅ Prefix storage | ✅ Audit trail | ✅ Encrypted transport | ✅ N/A | ✅ Service account scoped |
| **Security Headers** | ✅ HSTS preload | ✅ CSP/XFO/COOP | ✅ N/A | ✅ Referrer-Policy | ✅ N/A | ✅ N/A |

---

## Quality Gates Status

| Gate | Status | Notes |
|------|--------|-------|
| OWASP Top 10 review | ⚠️ | 9 of 10 categories addressed; A01 needs attention |
| Threat modeling (STRIDE) | ✅ | Documented above for all components |
| Input validation (Zod) | ✅ | All RPC boundaries use Zod v4 schemas |
| Tenant scoping | ⚠️ | findUnique bypass gap (H-02) |
| Audit trail | ✅ | Comprehensive audit trail for all mutations |
| Secrets management | ❌ | Production credentials on local filesystem (C-02) |
| Dependencies audited | ✅ | `pnpm audit --audit-level high` in CI |
| CI security gates | ⚠️ | Rate limiting not tested in CI |
| Rate limiting | ⚠️ | Next.js side not Redis-backed (H-01) |
| CSP/CORS/CSRF/Headers | ✅ | Well-configured across both API and web |

---

## Recommendations (Priority Order)

1. 🔴 **Wire TwoFactorGuard** — Apply to all `session`-auth RPC operations, especially admin routes
2. 🔴 **Rotate secrets & use secret manager** — Rotate DB password, BETTER_AUTH_SECRET, and admin password immediately  
3. 🟠 **Replace in-memory rate limiter** — Switch Next.js auth routes to Redis-backed rate limiter
4. 🟠 **Fix findUnique tenant scoping** — Add explicit orgId checks to all findUnique calls
5. 🟠 **Secure metrics endpoint** — Add auth or IP allowlisting to `/metrics`
6. 🟠 **Enable rate limiting in dev/test** — Remove `skipIf` or use high limits instead of bypass
7. 🟡 **Harden CSP** — Change `default-src` to `'none'` and remove `'unsafe-eval'` from dev config
8. 🟡 **Fix multi-org permissions** — Implement org context switching instead of empty permissions
9. 🟡 **Reduce session cookie cache** — Lower `maxAge` from 60s to 15s
10. 🟡 **Strict CSP report validation** — Use Zod schema for CSP report body validation

---

*Report generated by @enterprise-security. For questions, escalate to @enterprise-executive.*
