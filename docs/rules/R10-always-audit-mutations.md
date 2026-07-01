# Rule R10: Always Audit Mutations

**Purpose:** Maintain immutable audit trail for all data changes.

**Allowed:**
- Creating `AuditRecord` entries for all mutations
- Capturing before/after state for changed data
- Including correlation ID for traceability
- Classifying audit severity (standard/sensitive/critical)

**Forbidden:**
- Mutations without audit records
- Skipping audit for "minor" changes
- Modifying or deleting audit records
- Omitting actor identity from audit records

**Validation:**
- RPC metadata declares audit classification
- Integration tests verify audit record creation
- Audit queries return correct data
- Code review must confirm audit on new mutations

**Failure Consequences:**
- Compliance violation
- Missing forensic evidence
- PR rejection

**Severity:** error
