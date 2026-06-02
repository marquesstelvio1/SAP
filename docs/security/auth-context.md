# Auth Context Contract

## Purpose

`AuthContext` is the platform-owned security context used after Better Auth identity validation and before business authorization.

Better Auth owns identity and session lifecycle. SAPTM owns active organization, platform permissions, service-account scope, support-mode evidence, and telemetry enrichment.

## Shared Package

`@saptm/auth` exposes:

- `AuthContext`
- `createAuthContext`
- `enrichTraceContextWithAuth`
- `hasPlatformPermission`
- `resolveAuthContextFromBetterAuthSession`
- `createServiceAccountAuthContext`
- `hashApiKey`
- `validateApiKeyCredential`

## Required Fields

| Field | Purpose |
| --- | --- |
| `actorId` | Stable user, service account, or platform actor identifier |
| `actorType` | `user`, `service_account`, or `platform` |
| `organizationId` | Active tenant scope when applicable |
| `permissions` | Platform permission keys resolved server-side |
| `correlationId` | Link to observability and audit records |
| `requestId` | Link to one request execution |

## API Runtime

`apps/api` provides `AuthContextService` and `AuthContextMiddleware`.

The middleware does not authenticate by trusting arbitrary headers. It resolves Better Auth browser identity from the cookie header only, attaches server-owned `AuthContext`, and synchronizes it with the request `TraceContext`.

Service-account identity uses a separate API key resolver and must not forge a browser session context.

## Rules

- Client-selected tenant is never authoritative.
- Human permissions must be resolved from active memberships and roles.
- Organization is auto-selected only for a single active membership.
- Protected handlers must use `SessionRequiredGuard` or a stricter policy guard.
- Permission checks must use server-resolved `AuthContext.permissions`.
- Audit records must use `AuthContext` plus `TraceContext`.
- Platform support access must include `supportGrantId`.
- Browser session resolution must disable cookie cache for API authorization.
