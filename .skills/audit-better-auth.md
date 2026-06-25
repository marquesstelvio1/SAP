# Audit: Better Auth

## Purpose
Verify `@saptm/auth` Better Auth configuration follows best practices for adapter setup, plugin usage (2FA, organization), session management, email/password settings, trusted origins, and security hardening.

## Inputs
- `packages/auth/src/server.ts`
- `packages/auth/src/client.ts`
- `packages/auth/src/`
- `packages/auth/package.json`

## Execution Steps

1. **Adapter configuration audit**:
   - Verify the database adapter uses `@saptm/database` Prisma client (not a raw driver or mock).
   - Confirm the adapter is configured with the correct provider flag (`"prisma"`).
   - Ensure the adapter instance is a singleton (not re-created per request).
   - Check that `schema` overrides in the adapter match the actual Prisma model names.

2. **Plugin usage audit (2FA)**:
   - Verify the `twoFactor` plugin is imported and registered in `auth()`.
   - Confirm TOTP authenticator app support is enabled.
   - Check backup codes are configured (minimum 8 codes).
   - Ensure `twoFactor` is required for all users with elevated roles (admin, super-admin).
   - Validate that 2FA enrollment endpoints are rate-limited.

3. **Plugin usage audit (organization)**:
   - Verify the `organization` plugin is imported and configured.
   - Confirm custom roles are defined matching the application's RBAC model.
   - Ensure `allowUserToCreateOrganization` is set intentionally (default: `false` for enterprise).
   - Check that organization invitations require email verification.
   - Validate team permission granularity (at least: `read`, `write`, `admin`, `owner`).

4. **Session configuration audit**:
   - Verify `session.maxAge` is set to 7 days (Article II §2.1.2).
   - Confirm `session.updateAge` is set to 24 hours (sliding window).
   - Ensure session cookies are configured with: `httpOnly: true`, `sameSite: "lax"`, `secure: true` (production).
   - Check that session is not stored in localStorage or accessible via client JS.

5. **Email/password settings audit**:
   - Verify password minimum length is ≥ 12 characters (Article II §2.1.4).
   - Confirm password maximum length is ≤ 128 characters.
   - Check that email verification is required before full access is granted.
   - Ensure password reset tokens expire within 1 hour.
   - Verify that the email verification template uses the correct application origin.

6. **Security hardening audit**:
   - Confirm `trustedOrigins` includes only the production web application URL (no wildcards).
   - Verify CSRF protection is enabled via the `csrf-csrf` double-submit cookie pattern.
   - Check that API key hashing uses SHA-256 and only the prefix is stored in plaintext.
   - Ensure rate limiting is configured on auth endpoints (login: 5/min, register: 2/min, 2FA: 3/min).
   - Validate that auth secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) are loaded from environment, not hardcoded.

7. **Client configuration audit**:
   - Verify `auth.client()` is initialized with the correct base URL.
   - Check that the client does not expose sensitive configuration to the browser.
   - Ensure client-side session fetching uses TanStack Query (not raw fetch).
   - Verify that auth-related server actions are properly typed.

## Validation Steps
- `turbo run build --filter=@saptm/auth` passes.
- `turbo run test --filter=@saptm/auth` passes.
- `turbo run lint --filter=@saptm/auth` passes.
- `turbo run typecheck --filter=@saptm/auth` passes.
- Auth server starts and responds to session validation requests.
- Login rate limit triggers correctly after 5 failed attempts.
- 2FA enrollment flow completes end-to-end.

## Definition Of Done
- Database adapter uses singleton Prisma client with correct provider.
- `twoFactor` plugin is configured with TOTP + backup codes; enforced for admin roles.
- `organization` plugin has custom RBAC roles and email verification on invitations.
- Session: 7-day max, 24-hour sliding window, secure/httpOnly/sameSite cookies.
- Password policy: 12–128 characters; email verification required.
- `trustedOrigins` is locked to production URL; CSRF protection active.
- Auth secrets sourced from environment variables only.
- Client configuration is minimal and does not leak sensitive data.

## Failure Conditions
- Adapter uses raw driver or mock instead of `@saptm/database` Prisma client.
- `twoFactor` plugin is missing or backup codes are fewer than 8.
- Organization plugin allows unlimited user-created orgs without justification.
- Session `maxAge` is not 7 days or `updateAge` is not 24 hours.
- Password minimum is less than 12 characters.
- `trustedOrigins` contains a wildcard or localhost in production config.
- Auth secret is hardcoded in source code.
- `turbo run build` fails for `@saptm/auth`.

## Required Reports
- `reports/audit-better-auth/adapter-config.json` — adapter singleton verification, provider, schema overrides.
- `reports/audit-better-auth/plugin-inventory.json` — list of registered plugins with configuration details.
- `reports/audit-better-auth/session-config.json` — session duration, cookie attributes, sliding window verification.
- `reports/audit-better-auth/security-headers.json` — CSRF, rate limiting, trusted origins, secret sourcing.
- `reports/audit-better-auth/summary.json` — pass/fail per step, total violations, remediation priority.
