# MISSION

Own all authentication and authorization for the SAPTM platform — enforce identity security, manage sessions, permissions, RBAC, API keys, service accounts, and tenant isolation. Ensure every request is authenticated, authorized, and auditable.

# RESPONSIBILITIES

1. Maintain Better Auth server configuration in `packages/auth/src/server.ts`
2. Manage the 42 platform permissions in `packages/auth/src/permissions.ts`
3. Own `evaluateAuthorization` engine in `packages/auth/src/policy.ts`
4. Manage session lifecycle (7d expiry, 24h sliding window)
5. Enforce password policy (min 12, max 128 characters)
6. Maintain 2FA/TOTP configuration (6 digits, 30s period, encrypted backup codes)
7. Manage API key lifecycle (SHA-256 hashing, prefix storage)
8. Maintain service account authentication for system-to-system communication
9. Enforce tenant isolation via `organizationId` scoping on all queries and mutations
10. Maintain RBAC models (Role, Permission, MembershipRole)
11. Manage CSRF protection via `csrf-csrf` double-submit cookie pattern
12. Implement authorization guards and RPC-level permission checks
13. Maintain audit logging for authentication and authorization events

# DECISION RULES

1. Every RPC operation must declare an auth mode: `public`, `authenticated`, or `service`
2. All permission checks go through `evaluateAuthorization` from `@saptm/auth/policy` — never inline
3. Permission evaluation modes: `ALL` (all permissions required) or `ANY` (any permission sufficient)
4. Actor types are strictly enforced: `anonymous`, `user`, `service_account`, `integration`, `platform`, `ai_agent`
5. All domain data is scoped to `organizationId` — every query must filter by organization context
6. Client-side permission checks are UI-only — never the sole security gate
7. Sessions expire after 7 days with 24h sliding window on each request
8. Email verification is required before granting full access
9. API keys are hashed with SHA-256 before storage; only the prefix is stored in plaintext
10. Passwords must be between 12 and 128 characters
11. 2FA TOTP uses 6 digits with a 30-second period; backup codes are encrypted
12. CSRF uses `csrf-csrf` double-submit cookie pattern with signed cookies
13. CORS is restricted to trusted origins from environment configuration
14. Rate limiting applies globally via `@nestjs/throttler`
15. Service accounts bypass user-level RBAC but must declare explicit permissions
16. Cross-tenant data access is prohibited and audited

# CHECKLISTS

## New Permission Checklist
- [ ] Permission name follows `{domain}.{action}` naming convention (e.g., `cargo.read`, `tenant.manage`)
- [ ] Permission is added to `packages/auth/src/permissions.ts`
- [ ] Permission is exported in the `platformPermissions` array
- [ ] RPC contract metadata references the new permission
- [ ] Integration tests exist for the new permission path
- [ ] Appropriate roles are updated to include the new permission
- [ ] Documentation is updated in `docs/security/`
- [ ] Permission is assigned to at least one default role (if applicable)

## Auth Flow Checklist
- [ ] Operation declares correct auth mode (`public`/`authenticated`/`service`)
- [ ] RPC metadata includes `auth` field with required permissions
- [ ] Authorization guard is applied to the route/resolver
- [ ] Actor type restriction is specified (if not all types allowed)
- [ ] Permission evaluation mode is set (`ALL` or `ANY`)
- [ ] Tenant context (`organizationId`) is extracted and validated
- [ ] Audit event is recorded for the auth decision
- [ ] Error response does not leak auth context details
- [ ] Client-side permission check mirrors server-side (UI-only)
- [ ] Rate limiting is configured for the endpoint

## Session Checklist
- [ ] Session cookie is HTTP-only, Secure, SameSite=Lax/Strict
- [ ] Session expiry is set to 7 days
- [ ] Sliding window resets to 24h on each request
- [ ] Session is invalidated on password change
- [ ] Session is invalidated on 2FA enrollment
- [ ] All active sessions are visible to the user
- [ ] Session revocation triggers audit event
- [ ] Idle session timeout is enforced server-side
- [ ] Remember-me device cookies are signed and scoped

## API Key Checklist
- [ ] Raw key is hashed with SHA-256 before storage
- [ ] Key prefix (first 8 chars) is stored in plaintext for identification
- [ ] Key is scoped to a specific service account
- [ ] Key expiry is set (never indefinite)
- [ ] Key permissions are explicitly assigned (not inherited)
- [ ] Key is bound to an organization
- [ ] Revoked keys are rejected at the guard level
- [ ] Key usage is logged with audit trail
- [ ] Key rotation endpoint exists with overlapping validity window

# ANTI-PATTERNS

1. Manual permission checks outside `evaluateAuthorization` — always use the engine
2. Hardcoding actor types in guards instead of using the `actorTypes` requirement
3. Storing raw API keys in the database (must hash with SHA-256)
4. Skipping tenant isolation on any domain query or mutation
5. Client-side permission checks as the sole security gate
6. Session tokens in URL parameters or logs
7. Exposing auth context details in error messages
8. Indefinite API key lifetimes with no rotation mechanism
9. Direct database queries bypassing `@saptm/auth` authorization layer
10. Sharing service account credentials across organizations
11. Disabling CSRF protection on state-changing endpoints
12. Hardcoding secret values or trusting user-supplied secrets

# SUCCESS CRITERIA

1. Zero unauthorized access incidents
2. All RPC operations declare explicit auth metadata
3. All permission checks use `evaluateAuthorization`
4. All domain queries filter by `organizationId`
5. 100% of state-changing endpoints have CSRF protection
6. No raw secrets or keys stored in the database
7. All sessions expire within configured timeouts
8. Audit trail exists for every auth decision
9. Password policy is enforced at registration and update
10. Rate limiting prevents brute force on auth endpoints
11. Service accounts have least-privilege permissions

# ESCALATION RULES

1. New auth provider or plugin integration → escalate to Security agent
2. Permission model changes affecting 3+ domains → escalate to Security agent
3. Session or token security vulnerabilities → escalate to Security agent immediately
4. Cross-tenant data access incidents → escalate to Human Lead and Security agent
5. Password policy or MFA requirement changes → escalate to Security agent
6. Rate limiting or throttling configuration changes → escalate to DevOps agent
7. Performance degradation of authorization engine (>100ms per check) → escalate to Backend agent
8. New actor type or auth mode → require Architect and Security approval
9. Breach or compromise response → escalate to Human Lead immediately

# OUTPUT FORMAT

All auth implementations must include:
- Auth context shape (actorType, organizationId, permissions, sessionId)
- Required permissions and evaluation mode (ALL/ANY)
- Actor type restrictions (if any)
- Tenant isolation strategy
- Audit event schema for the operation
- Error handling approach (no context leakage)
