# Audit: Security

## Purpose
Audit the security posture of the SAPTM monorepo. Verify security headers, CSRF protection, CORS configuration, rate limiting, secret management, session configuration, and the permission system. Identify all violations of AGENTS.md Article II (Security Rules).

## Inputs
- `apps/web/next.config.ts` — security headers configuration
- `apps/api/src/security/` — security module files
- `packages/auth/` — authentication and authorization logic
- `.env.example` — documented environment variables
- `apps/api/src/modules/*/controller.ts` — route definitions
- `@saptm/rpc` contracts metadata

## Execution Steps
1. **Security Headers** (Rule 2.3.1)
   - Open `apps/web/next.config.ts` and locate the `headers()` async function.
   - Verify the following headers are present with correct values:
     - `Strict-Transport-Security` (HSTS): `max-age=63072000; includeSubDomains; preload`
     - `Content-Security-Policy` (CSP): check frame-ancestors, script-src, object-src, base-uri, form-action
     - `X-Frame-Options` (XFO): `DENY`
     - `Cross-Origin-Opener-Policy` (COOP): `same-origin`
     - `Cross-Origin-Resource-Policy` (CORP): `same-origin`
     - `Permissions-Policy`: all features set to `()` (self) or `*` (none by default)
     - `Referrer-Policy`: `strict-origin-when-cross-origin`
     - `X-Content-Type-Options`: `nosniff`
   - Flag any missing or misconfigured header as a P1 issue (P0 if CSP allows unsafe-inline or XFO is missing).

2. **CSRF Protection** (Rule 2.3.2)
   - Open `apps/api/src/security/csrf.module.ts` or equivalent.
   - Verify `csrf-csrf` package is used (not `csurf` — deprecated).
   - Confirm double-submit cookie pattern is implemented.
   - Verify cookies are signed.
   - Check CSRF token is validated on all state-changing requests (POST, PUT, PATCH, DELETE).
   - Validate CSRF secret is from environment variable, not hardcoded.

3. **CORS Configuration** (Rule 2.3.3)
   - Open `apps/api/src/main.ts` or CORS config file.
   - Verify `origin` is set to a whitelist resolved from environment configuration (not `*` or `true`).
   - Confirm `credentials: true` is set (since cookies are used).
   - Validate allowed methods are restricted (`GET, HEAD, PUT, PATCH, POST, DELETE`).
   - Confirm allowed headers are restricted.
   - Flag CORS set to `*` as P0.

4. **Rate Limiting** (Rule 2.3.4)
   - Verify `@nestjs/throttler` is registered as a global module.
   - Check `ttl` and `limit` values are set via environment variables (not hardcoded).
   - Confirm rate limiting applies to all routes (including auth endpoints).
   - Verify there is a bypass mechanism for trusted IPs (if needed).
   - Flag missing rate limiting on auth endpoints as P1.

5. **Authentication & Session Config** (Rules 2.1.1–2.1.5)
   - Verify all routes except `/health/live` and `/health/ready` require authentication (Rule 2.1.1).
   - Check session expiry: 7 days absolute, 24h sliding window (Rule 2.1.2).
   - Confirm email verification guard is applied before granting full access (Rule 2.1.3).
   - Validate password policy enforces 12–128 characters (Rule 2.1.4).
   - Check 2FA (TOTP) is available via `packages/auth/` (Rule 2.1.5).

6. **RPC Auth Metadata** (Rule 2.2.1)
   - Scan all RPC contracts in `packages/rpc/src/operations/`.
   - Verify every operation has `auth` field set to `public`, `authenticated`, or `service`.
   - Check `kind` field: `query` or `mutation`.
   - Verify `version` field is present.
   - Flag any operation missing `auth` as P0.

7. **Authorization Engine** (Rules 2.2.2–2.2.4)
   - Verify `evaluateAuthorization` from `@saptm/auth/policy` is used in all guards/interceptors.
   - Confirm permission evaluation modes `ALL` and `ANY` are supported.
   - Check RBAC roles are defined per-organization (not global).
   - Verify granular permission assignments (not just role-level).
   - Confirm all permission checks run server-side (Rule 2.2.5).

8. **API Key Management** (Rule 2.3.5)
   - Search for any API key storage or validation logic.
   - Verify keys are hashed with SHA-256 before storage.
   - Confirm only the key prefix is stored in plaintext.
   - Flag plaintext key storage as P0.

9. **Secret Management** (Rules 2.4.1–2.4.2)
   - Search entire codebase for hardcoded secrets, tokens, or passwords.
   - Verify `.env.example` documents all required variables without real values.
   - Confirm `.env` is in `.gitignore`.
   - Flag any secret in code as P0.

10. **Tenant Isolation** (Rules 2.5.1–2.5.3)
    - Run full audit-multitenancy.md skill (see `.skills/audit-multitenancy.md`).

## Validation Steps
- [ ] HSTS: `max-age=63072000; includeSubDomains; preload`
- [ ] CSP: no `unsafe-inline`, frame-ancestors restricted, script-src restricted
- [ ] XFO: `DENY`
- [ ] COOP: `same-origin`
- [ ] CORP: `same-origin`
- [ ] Permissions-Policy: all restricted
- [ ] Referrer-Policy: `strict-origin-when-cross-origin`
- [ ] X-Content-Type-Options: `nosniff`
- [ ] CSRF: double-submit cookie, signed cookies, `csrf-csrf` package
- [ ] CORS: whitelist from env, credentials enabled
- [ ] Rate limiting: `@nestjs/throttler` configured globally
- [ ] Sessions: 7d expiry, 24h sliding window
- [ ] Password: 12–128 chars
- [ ] 2FA: TOTP available
- [ ] Email verification: required before full access
- [ ] All RPC operations have `auth` metadata
- [ ] Authorization engine: `evaluateAuthorization` used, `ALL`/`ANY` modes
- [ ] API keys: SHA-256 hashed, prefix only in plaintext
- [ ] No hardcoded secrets in codebase
- [ ] Tenant isolation verified

## Definition of Done
- All security header checks pass.
- CSRF, CORS, rate limiting correctly configured.
- Auth/RPC metadata is complete and correct.
- Authorization engine properly implemented.
- No secrets found in codebase.
- Tenant isolation audit passes.
- All P0 security issues resolved.

## Failure Conditions
- CSP allows `unsafe-inline` or `unsafe-eval` — **P0**
- CORS set to `*` or `true` — **P0**
- Hardcoded secret found in code — **P0**
- Any RPC operation missing `auth` field — **P0**
- Plaintext API key storage — **P0**
- No CSRF protection — **P1**
- Missing rate limiting on auth endpoints — **P1**
- Session config does not match 7d/24h — **P1**
- Tenant isolation violated — **P0**

## Required Reports
- `audit-security-headers.md` — header-by-header check results
- `audit-security-csrf.md` — CSRF implementation details
- `audit-security-secrets.md` — secret scanning results
- `audit-security-summary.md` — pass/fail per section with severity
- `audit-security-p0.md` — P0 issues with remediation steps
