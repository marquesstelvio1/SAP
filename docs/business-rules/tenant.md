# Business Rules: Tenant Isolation

**Phase:** 3 — Business Rules Extraction
**Source:** Prisma schema, `packages/auth/src/context.ts`, Auth modules

---

## Organization Rules

| Rule | Value |
|---|---|
| Tenant identifier | `organizationId` (UUID/CUID) |
| Org name | Required, free text |
| Org slug | Required, unique, URL-friendly |
| Default status | `active` |
| Status values | `active`, `suspended`, `archived` |

## Data Isolation Rules

| Rule | Description |
|---|---|
| All domain data scoped | Every domain model has `organizationId` FK |
| Cross-tenant access | Prohibited and audited |
| Query isolation | Every query must filter by org context |
| Org context source | Auth context (from session or API key) |

## Organization Status Lifecycle

```
active → suspended (temporary disable)
active → archived (permanent close)
suspended → active (reactivation)
```

## Organization Context Resolution

1. User authenticates → sessions contains org memberships
2. User selects active org → stored in `saptm_active_org` cookie
3. Each request resolves org from cookie or session default
4. Auth context includes resolved `organizationId`

## TODO

- Automatic Prisma middleware for tenant scoping — NOT IMPLEMENTED
- Tenant-level rate limiting — NOT IMPLEMENTED
- Tenant resource quotas — NOT IMPLEMENTED (UsageRecord model exists but enforcement unclear)
- Suspended org session invalidation — NOT IMPLEMENTED
