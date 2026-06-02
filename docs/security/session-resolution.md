# Session Resolution

## Purpose

Define how a verified Better Auth session becomes a server-owned `AuthContext` in the NestJS API.

## Source Of Truth

Better Auth is the only valid source for browser session identity. The API does not trust client-provided actor, role, permission, tenant, or support-mode headers.

`apps/api` passes only the cookie header into Better Auth session resolution. This keeps session identity tied to the secure cookie transport and prevents arbitrary request headers from becoming authorization inputs.

## Runtime Flow

1. `ObservabilityMiddleware` creates `TraceContext`.
2. `AuthContextMiddleware` checks service-account API keys first.
3. If no API key is present, `AuthContextMiddleware` calls Better Auth session resolution.
4. `@saptm/auth` converts a valid identity into `AuthContext`.
5. `AuthContextService` attaches `AuthContext` to the request.
6. `TraceContext` is enriched with actor and tenant data.
7. `SessionRequiredGuard` and `AuthorizationGuard` fail closed when context is missing or resolution fails.

## Cache Position

API session resolution disables cookie cache and session refresh by default:

- `disableCookieCache: true`
- `disableRefresh: true`

The API validates the session for authorization. Better Auth route handlers own login, logout, refresh, and cookie lifecycle.

## Permission Position

The session resolver only proves human identity.

It does not grant business permissions by itself. Permissions must be resolved server-side from membership, roles, service scopes, support grants, or platform policy before protected operations execute.

Until that resolver exists, session-derived `AuthContext.permissions` may be empty and policy guards must deny protected operations requiring permissions.

## Failure Behavior

- Missing or invalid session leaves `authContext` empty.
- Resolution errors are stored on the request.
- Protected guards return unauthorized when resolution fails.
- Authorization metadata still requires a valid `AuthContext`.
- Public routes are not blocked by optional session resolution.
