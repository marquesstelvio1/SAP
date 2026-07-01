# Rule R01: Never Bypass RBAC

**Purpose:** Prevent unauthorized access to protected resources.

**Allowed:**
- Using `evaluateAuthorization()` from `@saptm/auth/policy`
- Declaring auth mode in RPC metadata (`auth: "public"`, `"session"`, `"service"`)
- Using `AuthorizationGuard` for route protection
- Client-side permission checks for UI-only (never sole gate)

**Forbidden:**
- Accessing protected resources without auth check
- Hardcoding permission bypass for development/testing
- Using public auth mode for operations that access user data
- Client-side only permission checks for data access

**Validation:**
- Code review must verify auth metadata on every RPC operation
- Integration tests must test both allowed and denied scenarios
- Audit log must record all authorization decisions

**Failure Consequences:**
- Critical security incident
- Immediate PR rejection
- Security review required

**Severity:** critical
