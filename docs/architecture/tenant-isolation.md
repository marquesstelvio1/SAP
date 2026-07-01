# Tenant Isolation Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Multi-tenancy Model

SAPTM uses a **per-organization** multi-tenancy model where each organization is a separate tenant with isolated data.

## Tenant Identification

- **Primary key:** `organizationId` (UUID/CUID)
- **Context header:** `x-tenant-id` (HTTP header for API requests)
- **Active org cookie:** `saptm_active_org` (browser cookie)
- **User context:** Users can belong to multiple organizations

## Data Isolation

### Database Level
All domain models include `organizationId` as a foreign key to `Organization`:

```prisma
model Cargo {
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  // ...
}
```

### Query Level
Every query and mutation must filter by `organizationId`:
```typescript
const results = await prisma.cargo.findMany({
  where: { organizationId: authContext.organizationId },
});
```

### Application Level
- Auth context includes `organizationId` for the current session
- Authorization guard validates org membership
- RPC operations declare `organizationRequired: boolean` in metadata

## Organization Lifecycle

```
Registration → Active → Suspended → Archived
                    ↘          ↗
                  (reactivation)
```

### States
| Status | Description | Allowed Operations |
|---|---|---|
| `active` | Normal operation | All |
| `suspended` | Temporarily disabled | Read-only (no mutations) |
| `archived` | Permanently closed | No access |

## Membership Lifecycle

```
Invited → Active → Suspended → Removed
              ↘          ↗
            (reactivation)
```

### States
| Status | Description |
|---|---|
| `invited` | User invited but not accepted |
| `active` | Full member access |
| `suspended` | Temporarily suspended |
| `removed` | Removed from organization |

## Cross-Tenant Prevention

1. **Auth context** ensures every request has an organizationId
2. **RPC metadata** validates organization scope
3. **Policy engine** (`evaluateAuthorization`) rejects cross-org access
4. **Database queries** must filter by organizationId
5. **No direct data access** outside of authorized context

## Tenant Resource Quotas

Usage tracked via `UsageRecord` model:
- Per-organization metric tracking
- Configurable limits per metric
- Period-based usage windows

## Current Gaps

1. **No Prisma middleware** for automatic tenant scoping
2. **No tenant-level rate limiting**
3. **Cross-tenant data exposure risk** from missing org filters
