# Rule R09: Always Implement Idempotency for Mutations

**Purpose:** Enable safe retry of mutation operations.

**Allowed:**
- Idempotency keys on all mutation operations
- Idempotency key = `required` for billing and financial operations
- Idempotency key = `recommended` for other mutations
- Unique constraints on idempotency key columns

**Forbidden:**
- Mutations without idempotency support
- Reusing idempotency keys across different operations
- Ignoring idempotency key in mutation handlers
- Allowing duplicate mutations due to missing idempotency

**Validation:**
- Schema must have unique constraints on idempotency keys
- RPC metadata must declare idempotency mode
- Integration tests must verify idempotency
- Code review must confirm idempotency on new mutations

**Failure Consequences:**
- Duplicate charges (financial impact)
- Duplicate records (data quality issues)
- PR rejection

**Severity:** error
