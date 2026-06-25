# Standard: Security

**Phase:** 4 — Engineering Standards

---

## Required

- All API responses include security headers (HSTS, CSP, XFO, COOP, CORP, Permissions-Policy, Referrer-Policy)
- CSRF protection via double-submit cookie pattern with signed cookies
- CORS restricted to trusted origins from environment config
- Rate limiting applied globally
- API keys hashed with SHA-256 before storage
- No secrets in code — environment variables or External Secrets Operator
- `.env` gitignored; `.env.example` is documentation source

## Authentication Security

- All routes except public health endpoints require authentication
- Sessions expire after 7 days with 24h sliding window
- Email verification required before full access
- Passwords: min 12, max 128 characters
- 2FA (TOTP) available for all users
- Brute force protection on auth endpoints

## Authorization Security

- Every RPC operation must declare auth mode
- Permission checks use `evaluateAuthorization` engine
- Client-side permission checks are UI-only — never sole security gate
- RBAC roles are per-organization with granular permissions

## Supply Chain Security

- Lockfile must be frozen in CI (`pnpm install --frozen-lockfile`)
- Container vulnerability scanning via Trivy
- Image signing via Cosign
- Only built dependencies allowed (`onlyBuiltDependencies` in package.json)

## Forbidden

- Hardcoded secrets, API keys, or passwords
- Disabling CSRF on authenticated endpoints
- Storing plaintext passwords or tokens
- Using deprecated TLS versions (<1.2)
- Running containers as root in production
- Allowing CORS from `*` in production

## Validation

- Security header check in E2E tests
- Dependency vulnerability scan in CI
- Container image scan in CI
- Secret detection pre-commit
- Regular security audit

## Migration

- When upgrading auth libraries, review security implications
- Rotate all secrets after security incident
- Update CSP when adding new external resources
