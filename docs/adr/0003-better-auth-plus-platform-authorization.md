# ADR 0003 — Better Auth for Identity, Platform Model for Authorization

## Status

Accepted.

## Decision

Use Better Auth for authentication and sessions. Implement RBAC, ABAC, tenant scoping, and logistics permissions in the platform domain model.

## Rationale

Better Auth provides auth/session foundations, but logistics authorization depends on tenant, facility, corridor, cargo ownership, service scope, data classification, and operational severity.

## Consequences

- Session identity is not sufficient for business authorization.
- NestJS policy guards enforce permissions and ABAC.
- Every critical mutation requires audit classification.

