# Auth Skill

## Scope

Better Auth, session strategy, RBAC, ABAC, service accounts, permission matrix, and audit requirements.

## Rules

- Treat Better Auth as identity/session infrastructure.
- Enforce platform authorization through RBAC and ABAC.
- Do not trust client-selected tenant without membership verification.
- Do not allow sensitive operations through cookie-only validation.
- Test revocation, forbidden access, tenant isolation, and service scopes.

## Outputs

- Permission model.
- Policy rules.
- Audit classification.
- Session and service-account impact.

