# Diagnostic: Authentication

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Authentication System
**Date:** 2026-06-23

---

## Current State

Better Auth v1 with Prisma adapter. Session-based auth with 7-day expiry and 24h sliding window. Email/password with 2FA (TOTP). Email verification required. All routes except health require auth.

## Problems

1. **OAuth token encryption unconfirmed** — OAuth access/refresh tokens may be stored as plaintext in the Account model.
2. **Session revocation lacks audit trail** — When sessions are revoked, no AuditRecord is created for incident response.
3. **Service account auth** — API key authentication for service accounts exists but integration test coverage is minimal.
4. **Rate limiting on auth endpoints** — Login/register endpoints may not have specific rate limits beyond global throttler.
5. **No brute force protection** — No account lockout after failed login attempts.

## Technical Debt

- Better Auth configuration is duplicated between server.ts and env config.
- Two-factor backup codes stored encrypted but encryption key management is unclear.

## Risks

- **High:** OAuth plaintext tokens compromise connected services if DB is breached.
- **Medium:** No brute force protection allows credential stuffing attacks.
- **Medium:** No session revocation audit trail hinders incident investigation.

## Impact

Security incidents involving compromised accounts cannot be fully investigated. OAuth integrations expose third-party services.

## Priority

High

## Recommended Actions

1. Encrypt OAuth tokens at rest using AES-256 with key rotation.
2. Add AuditRecord creation on session revocation.
3. Implement specific rate limits on `/api/auth/*` endpoints (login, register, verify).
4. Add account lockout after N failed attempts (e.g., 5 attempts in 15 minutes).
5. Document encryption key management for 2FA backup codes.

## Estimated Effort

3-4 days

## Owner Agent

auth
