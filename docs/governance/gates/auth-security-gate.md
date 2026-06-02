# Auth And Security Gate

## Purpose

Protect identity, session, permission, and infrastructure security boundaries.

## Required evidence

- RBAC or permission impact analysis
- explicit authorization metadata for protected API operations
- ABAC scope evidence for organization, facility, corridor, cargo ownership, or support mode
- session and cookie impact analysis when relevant
- authorization and mutation audit logging plan
- approval for critical changes

## Fail conditions

- access control behavior is unclear
- protected operation has no policy metadata
- permission is used without being defined in `@saptm/auth`
- organization scope is client-provided without server verification
- privileged path has no regression coverage
- critical auth change lacks approval
