# Rule R08: Always Define RPC Operation Metadata

**Purpose:** Ensure every API operation has proper documentation, auth, and audit configuration.

**Allowed:**
- Using `createRpcOperationMetadata()` for all operations
- Default values for standard operations with explicit overrides

**Forbidden:**
- RPC operations without metadata
- Undefined auth mode (must be explicit: public/session/service)
- Public operations with permissions defined
- Mutations without explicit auth mode declaration
- Critical audit classification with low observability criticality

**Validation:**
- Metadata validation at build time
- `validateRpcOperationMetadata()` checks rules
- Integration tests verify metadata on all operations
- Code review must confirm metadata on new operations

**Failure Consequences:**
- Runtime errors from invalid metadata
- Security gaps from missing auth declarations
- Audit gaps from missing classifications

**Severity:** error
