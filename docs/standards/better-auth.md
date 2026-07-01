# Standard: Better Auth

**Phase:** 4 — Engineering Standards

---

## Required

- Better Auth server created via `createSaptmAuth()` in `@saptm/auth/server`
- Prisma adapter for database persistence
- Session-based authentication with 7-day max age
- Email/password authentication enabled
- Email verification required for full access
- Password minimum 12 characters
- CSRF protection on all auth routes

## Recommended

- Enable 2FA (TOTP) for all users
- Use `trustedOrigins` from environment config
- Use cookie caching for session validation (60s TTL)
- Enable `revokeSessionsOnPasswordReset`
- Use custom email templates via Resend

## Forbidden

- Disabling email verification
- Password length < 12 characters
- Storing plaintext OAuth tokens
- Disabling CSRF protection on auth routes
- Hardcoding Better Auth secrets

## Client Usage

```typescript
import { createSaptmAuthClient } from "@saptm/auth/client";

const auth = createSaptmAuthClient();
// auth.signIn.email(), auth.signUp.email(), etc.
```

## Server Configuration

```typescript
import { createSaptmAuthFromEnv } from "@saptm/auth/server";

const auth = createSaptmAuthFromEnv();
// Use in Next.js API routes or NestJS integration
```

## Validation

- Auth configuration validated at server start
- Session validation on every authenticated request
- Email verification flow tested in E2E
- Password reset flow tested in E2E

## Migration

- Better Auth version upgrades: check plugin compatibility
- Test all auth flows after upgrade (signup, login, 2FA, password reset)
- Verify session migration if schema changes
