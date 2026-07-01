# Phase 2 — Enterprise Architecture & Security Audit

## 1. Backend Architecture (NestJS 11) — Score: 82/100

### Modules
| Module | Status | Notes |
|--------|--------|-------|
| AppModule | ✅ | Clean import composition, onApplicationShutdown disconnects Prisma |
| RpcModule | ✅ | Middleware-based, imports all domain modules |
| HealthModule | ✅ | HealthController at /health |
| ObservabilityModule | ✅ | Interceptor + middleware + service |
| RateLimitModule | ✅ | ThrottlerGuard global |
| 14 domain modules | ✅ | DDD pattern with domain/infrastructure split |
| CacheModule | ✅ | Redis-based, used globally |

### Critical Findings

**CRITICAL-001: Prisma error messages leaked to client**
- File: `apps/api/src/rpc/exception.filter.ts:103`
- `exception.message` is sent verbatim in the RPC error envelope
- Prisma errors can contain table names, column names, constraint names, and query structure
- Severity: **CRITICAL** — Information disclosure
- Fix: Sanitize by returning generic "Database error occurred" for INTERNAL_ERROR codes

**CRITICAL-002: RPC error envelope double-wrapped**
- File: `apps/api/src/rpc/exception.filter.ts:109-111, 136-138, 155-157`
- Response format: `{ json: { code, message, ... } }` instead of `{ code, message, ... }`
- The `json` wrapper is inconsistent with standard RPC error envelope format
- Clients expecting standard format will fail to parse errors
- Severity: **CRITICAL** — Functional correctness

**MAJOR-001: AuthorizationGuard fail-open default**
- File: `apps/api/src/auth/authorization.guard.ts:29-31`
- When no `@RequirePermission` decorator is present, guard returns `true` (everyone allowed)
- Good for gradual adoption but risky if a developer forgets to add auth decorator
- Severity: **MAJOR** — Security

**MAJOR-002: RPC context `getRequiredAuthContext` throws generic Error**
- File: `apps/api/src/auth/auth-context.ts:13-18`
- Throws `new Error(...)` instead of `HttpException`
- This bypasses the exception filter's proper error code mapping
- Severity: **MAJOR** — Error handling

**MAJOR-003: No Vary headers on security responses**
- CSRF middleware (csrf.middleware.ts:53-55) sets `X-CSRF-Token` header
- No `Vary: Cookie` header to inform caches
- Can cause caching proxies to serve wrong CSRF tokens
- Severity: **MAJOR** — Cache correctness

**MINOR-001: CSRF session ID uses non-cryptographic hash**
- File: `apps/api/src/security/csrf.middleware.ts:83-90`
- `deriveSessionId` uses a simple djb2-style hash
- Not cryptographically secure, but used only for CSRF session binding
- Severity: **MINOR** — Information

**MINOR-002: Missing Cache-Control header on API responses**
- No `Cache-Control: no-store` for authenticated endpoints
- Severity: **MINOR** — Information

**MINOR-003: Security headers duplicated between proxy.ts and next.config.ts**
- HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy set in both
- Not harmful but redundant; headers are additive
- Severity: **MINOR** — Information

---

## 2. Frontend Architecture (Next.js 16 App Router) — Score: 84/100

### Strengths
- Every route has loading.tsx + error.tsx (23 routes verified)
- Server Components by default, auth via `requirePlatformSession()`
- Nonce-based CSP with strict-dynamic
- Proper TypeScript strict mode, `typedRoutes: true`
- Responsive design system with dark mode

### Findings

**MAJOR-004: CSP missing directives**
- File: `apps/web/src/proxy.ts:22-36`
- Missing: `worker-src`, `frame-src`, `upgrade-insecure-requests`
- Missing `Vary: Cookie` on proxy response
- Severity: **MAJOR** — Security

**MAJOR-005: Turbopack resolveAlias uses brittle relative paths**
- File: `apps/web/next.config.ts:43-53`
- Paths like `../../packages/auth/dist/index.js` assume a specific working directory
- Will break if build context changes or in CI with different directory structure
- Severity: **MAJOR** — Build reliability

**MINOR-004: serverExternalPackages may be incomplete**
- File: `apps/web/next.config.ts:37-41`
- Only lists `@better-auth/kysely-adapter`, `better-auth`, `kysely`
- `@saptm/database` and `@prisma/client` removed because driver adapters use WASM
- Should verify no native modules are missed
- Severity: **MINOR** — Information

---

## 3. Security Posture — Score: 88/100

### In Place
- ✅ Nonce-based CSP (script-src with strict-dynamic)
- ✅ CSRF double-submit cookie pattern (__Host-saptm-csrf)
- ✅ Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- ✅ Rate limiting: 200 req/60s
- ✅ API key hashing (SHA-256)
- ✅ RBAC with 36 permissions, 12 role templates
- ✅ Cookie signing with BETTER_AUTH_SECRET
- ✅ HSTS preload
- ✅ Form-action CSP directive (anti-phishing)
- ✅ Skip link for keyboard users

### Missing
- ❌ Content-Security-Policy-Report-Only for gradual rollout
- ❌ Cache-Control: no-store on authenticated routes
- ❌ Vary: Cookie on responses that depend on auth state
- ❌ Worker-src and frame-src CSP directives
- ❌ Upgrade-Insecure-Requests CSP directive
- ❌ X-Content-Type-Options: nosniff set twice (redundant but not harmful)
- ❌ No error tracking (Sentry, etc.)
- ❌ No API endpoint for security.txt/.well-known/security.txt

---

## 4. Observability — Score: 90/100

### In Place
- ✅ OpenTelemetry collector + traces + metrics + logs
- ✅ Prometheus in-memory registry with /metrics endpoint
- ✅ Grafana with provisioned dashboards
- ✅ Alertmanager with configured routing
- ✅ Correlation ID, request ID, trace context propagation
- ✅ Structured logging with service name, environment, levels
- ✅ Authorization decision auditing (both HTTP and RPC)
- ✅ HTTP request duration metrics (histogram)

### Missing
- ❌ No span sampling configuration
- ❌ No database query tracing (Prisma middleware)
- ❌ No external dependency tracing (Redis, etc.)
- ❌ No user-facing error reporting endpoint

---

## 5. Database — Score: 85/100

### In Place
- ✅ Full data model with 35+ models
- ✅ Outbox pattern for async writes
- ✅ Audit trail with severity levels
- ✅ RBAC: 36 seed permissions, 12 role templates
- ✅ Soft-delete patterns
- ✅ Multi-tenant org model
- ✅ Connection pooling with pg-pool
- ✅ Idempotency keys on cargo lifecycle operations

### Missing
- ❌ No migration rollback strategy documented
- ❌ No backup/restore scripts
- ❌ No database migration CI step to verify migrations
- ❌ No database query performance monitoring

---

## 6. DevOps / CI-CD — Score: 80/100

### In Place
- ✅ Docker multi-stage builds for api + web
- ✅ Docker Compose with 9 services + healthchecks
- ✅ 9 GitHub Actions workflows
- ✅ K8s manifests (base + cluster + overlays)
- ✅ 30+ validation scripts
- ✅ Changesets versioning

### Missing
- ❌ PowerShell AI scripts won't run on Linux CI
- ❌ No database backup job in CI/CD
- ❌ No canary deployment strategy
- ❌ No migration validation in CI pipeline
- ❌ No load testing scripts

---

## Summary of Actions Required

| Priority | ID | Fix |
|----------|----|-----|
| P0 | CRITICAL-001 | Sanitize Prisma error messages in exception.filter.ts |
| P0 | CRITICAL-002 | Fix RPC error envelope format (remove double-wrapped `json` key) |
| P0 | MAJOR-003 | Add Vary: Cookie header to CSRF middleware |
| P1 | MAJOR-001 | Add default deny or explicit allow-list pattern to AuthorizationGuard |
| P1 | MAJOR-002 | Replace generic Error with HttpException in auth-context.ts |
| P1 | MAJOR-004 | Add missing CSP directives (worker-src, frame-src, upgrade-insecure-requests) |
| P1 | MAJOR-005 | Fix turbopack resolveAlias to use absolute paths or improve reliability |
| P2 | MINOR-001 | Consider replacing deriveSessionId hash |
| P2 | MINOR-002 | Add Cache-Control headers to authenticated API routes |
| P2 | MINOR-004 | Verify serverExternalPackages completeness |
