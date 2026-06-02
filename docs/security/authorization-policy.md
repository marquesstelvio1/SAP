# Authorization Policy

## Purpose

Define the platform-owned RBAC and ABAC enforcement contract used by SAPTM API modules.

Authentication proves actor identity. Authorization decides whether that actor can perform an operation in a given organization and runtime scope.

## Enforcement Boundary

`@saptm/auth` owns the pure policy evaluator:

- `AuthorizationRequirement` declares required permissions, actor types, organization rules, and permission mode.
- `evaluateAuthorization` returns a deterministic decision with missing permissions and failed ABAC attributes.
- `AuthContext` is the only accepted input for policy evaluation.

`apps/api` owns NestJS enforcement:

- `RequireAuthorization` attaches policy metadata to controllers or handlers.
- `RequirePermissions` attaches an all-permissions RBAC requirement.
- `AuthorizationGuard` is registered globally and only enforces routes with policy metadata.
- Missing auth context returns unauthorized.
- Failed policy evaluation returns forbidden.

## Policy Rules

- No protected operation may rely on client-provided role, tenant, or permission headers.
- No route metadata means the authorization guard allows the request and leaves protection to explicit auth/session guards.
- Any route with authorization metadata requires `AuthContext`.
- `permissionMode: "all"` requires every listed permission.
- `permissionMode: "any"` requires at least one listed permission.
- `organizationRequired: true` denies actors without active organization context.
- `organizationId` enforces exact organization scope and must be resolved server-side.
- Actor type checks are ABAC constraints, not substitutes for permissions.

## Audit Contract

Every evaluated authorization requirement emits an authorization audit signal through observability:

- action: `authorization.evaluate`
- outcome: `success` or `failure`
- resource type: `api.route`
- resource id: HTTP method plus route
- reason: deterministic authorization decision reason
- attributes: required permissions, missing permissions, failed attributes, permission mode, actor type

Persistent audit storage is handled by `@saptm/database` audit helpers when a module has access to a Prisma client.

## Implementation Gate

Before adding any feature route:

1. Define the permission in `@saptm/auth`.
2. Attach `RequireAuthorization` or `RequirePermissions`.
3. Prove organization and actor scope are server-resolved.
4. Confirm denial path is observable.
5. Add tests covering allow, missing session, and denied permission.

Human organization scope must follow `docs/security/permission-resolution.md`.
