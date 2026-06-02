# Permission Resolution

## Purpose

Define how human sessions receive server-resolved permissions before authorization guards run.

## Source Of Truth

User permissions are resolved from database membership, role, and permission records:

- `Membership.status = active`
- `MembershipRole`
- `Role`
- `RolePermission`
- `Permission.key`

Client-provided tenant, role, permission, or organization headers are not authoritative.

## Default Organization Rule

The API may select a default active organization only when the user has exactly one active membership.

If the user has zero or multiple active memberships:

- `AuthContext.organizationId` is not set.
- `AuthContext.permissions` is empty.
- Protected routes requiring organization-scoped permissions fail closed.

This avoids silently selecting the wrong tenant in multi-organization enterprise accounts.

## Runtime Flow

1. Better Auth validates the browser session.
2. `AuthContextService` creates a base user `AuthContext`.
3. `UserAuthorizationService` loads active memberships and role permissions.
4. Permissions are filtered against `@saptm/auth.platformPermissions`.
5. Duplicate permissions are removed.
6. The enriched `AuthContext` is attached to the request.
7. `AuthorizationGuard` evaluates route metadata.

## Future Explicit Tenant Selection

Explicit organization selection must be implemented as a separate server-verified operation.

That operation must:

- verify active membership before switching organization;
- persist selection only in trusted server/session state;
- refresh `AuthContext.permissions` after switch;
- audit tenant switch events;
- never trust raw client headers as tenant authority.
