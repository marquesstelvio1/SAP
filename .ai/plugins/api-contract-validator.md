# API Contract Validator Plugin

**ID:** `api-contract-validator`
**Version:** 1.0.0
**Kind:** validation
**Execution Order:** 45
**Mandatory:** true
**Runs On:** post-backend, pre-frontend
**Blocking:** true

## Mission

Validate that all API contracts (RPC operations) are complete, well-defined, and follow the project's contract standards.

## Validation Checklist

### 1. RPC Operation Metadata

Every RPC operation MUST define:

- [ ] `name` — Unique operation name
- [ ] `version` — Semantic version
- [ ] `kind` — query | mutation | subscription
- [ ] `auth` — public | session | service
- [ ] `permissions` — Array of required permissions (empty if public)
- [ ] `audit` — true | false
- [ ] `idempotency` — true | false (required for mutations)
- [ ] `criticality` — low | medium | high | critical

### 2. Schema Validation

- [ ] Input schema defined (Zod object)
- [ ] Output schema defined (Zod object)
- [ ] All fields have proper Zod types
- [ ] No `z.any()` or `z.unknown()` (unless justified)
- [ ] Required fields marked with `.nonempty()` or proper constraints
- [ ] Optional fields explicitly marked
- [ ] Enums use `z.enum()` or `z.nativeEnum()`
- [ ] Nested objects properly defined

### 3. Error Catalog

- [ ] Error codes defined for all failure modes
- [ ] Error messages are descriptive
- [ ] Error codes follow naming convention
- [ ] HTTP status codes correctly mapped

### 4. Backend Implementation Check

- [ ] All RPC operations have corresponding handlers
- [ ] Handler signatures match contract schema
- [ ] Auth mode respected in handler
- [ ] Permissions checked in handler
- [ ] Idempotency implemented for mutations
- [ ] Audit logging for mutations

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| CV01 | error | Missing operation metadata |
| CV02 | error | Missing input schema |
| CV03 | error | Missing output schema |
| CV04 | error | Using z.any() without justification |
| CV05 | warning | Missing error codes |
| CV06 | error | Handler signature mismatch |
| CV07 | error | Missing auth check in handler |
| CV08 | warning | Missing idempotency on mutation |
| CV09 | warning | Missing audit on mutation |
| CV10 | error | No handler for defined operation |

## Output

Generate `contract-report.md` in `.ai/reports/`:

```markdown
# API Contract Validation Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Operations Checked: {n}
- Schema Issues: {n}
- Handler Issues: {n}
- Metadata Issues: {n}

## Operations
| Name | Kind | Auth | Schema | Handler | Status |
|---|---|---|---|---|---|
| {name} | query | session | ✓/✗ | ✓/✗ | PASS/FAIL |

## Issues
1. {rule-id} — {description}

## Recommendations
1. {recommendation}
```

## Success Criteria

- All operations have complete metadata
- All input/output schemas defined
- All operations have handlers
- All security requirements met
