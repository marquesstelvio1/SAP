# Authentication & Authorization Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Tech Stack

- Better Auth v1
- Prisma adapter for database
- Custom policy engine (`@saptm/auth/policy`)
- 41 platform permissions
- TOTP 2FA via authenticator apps

## Authentication Flow

```
Browser                    Next.js                      NestJS
  │                          │                            │
  │  POST /api/auth/login    │                            │
  │ ───────────────────────► │                            │
  │                          │  Better Auth validates     │
  │                          │  email + password          │
  │                          │                            │
  │                          │  Better Auth server        │
  │                          │  checks session            │
  │                          │                            │
  │  Set-Cookie:             │                            │
  │  better-auth.session_token│                            │
  │ ◄─────────────────────── │                            │
```

## Auth Modes

| Mode | Description | Actor Type | Use Case |
|---|---|---|---|
| `public` | No authentication | anonymous | Health checks, public data |
| `session` | User session required | user | All platform operations |
| `service` | API key required | service_account | External system integrations |

## Session Lifecycle

1. **Creation:** On successful login/register
2. **Max age:** 7 days (604,800 seconds)
3. **Sliding window:** Refreshed on activity within 24h
4. **Cookie cache:** 60-second cache reduces DB reads
5. **Revocation:** On password reset, admin action, or explicit logout

## Authorization Flow

```
RPC Request
  → AuthContextMiddleware (extracts session/API key)
    → Auth context built (actorId, permissions, orgId)
      → AuthorizationGuard checks:
          - Auth mode (public/session/service)
          - Required permissions
          - Actor type
          - Organization scope
        → Allowed? → RPC Handler
        → Denied? → Return authorization error
```

## Policy Engine

The `evaluateAuthorization()` function in `@saptm/auth/policy` checks:

1. **Actor type** — Is the actor allowed to perform this operation?
2. **Organization scope** — Is the actor in the required organization?
3. **Permissions** — Does the actor have all/any required permissions?
4. **Organization required** — Does the operation require an org context?

## Permission Model

- 41 flat permission strings (e.g., `cargo.register`, `tracking.event.record`)
- Permission mode: ALL (all required) or ANY (any sufficient)
- Permissions assigned via Role → RolePermission → Permission
- Roles are per-organization
- Memberships link users to organizations with roles

## Service Account Auth

- Used for external system integrations
- API key authentication (SHA-256 hashed)
- Scoped to specific permissions
- Idempotent provisioning
- Audit trail on all operations
