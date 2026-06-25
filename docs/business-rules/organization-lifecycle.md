# Business Rules: Organization Lifecycle

**Phase:** 3 — Business Rules Extraction
**Source:** Prisma schema, `packages/database/src/rbac-bootstrap.ts`

---

## Organization Creation

1. A user creates an organization (provides name + slug)
2. Creator becomes first member with administrative role
3. Organization status set to `active`
4. Org-scoped roles are bootstrapped

## Organization Statuses

| Status | Description | Allowed Operations |
|---|---|---|
| `active` | Full operation | All |
| `suspended` | Temporarily disabled | Read-only |
| `archived` | Permanently closed | No access |

## Membership Statuses

| Status | Description |
|---|---|
| `invited` | User invited, pending acceptance |
| `active` | Full member |
| `suspended` | Temporarily suspended |
| `removed` | Removed from org |

## Invitation Rules

| Rule | Value |
|---|---|
| Invitation token TTL | 48 hours (configurable via env) |
| Max active invitations | Unlimited |
| Invitation acceptance | Creates active membership |
| Role assignment | Optional at invitation time |

## Role Bootstrap

- Roles are created at org scope
- Default roles: Admin, Member, Viewer (TODO — NOT CONFIRMED in current code)
- Permissions assigned to roles via `RolePermission` table

## TODO

- Default roles on org creation — NOT CONFIRMED IMPLEMENTED
- Org suspension effects on active sessions — NOT IMPLEMENTED
- Org data deletion on archive — NOT DEFINED
- Org transfer of ownership — NOT IMPLEMENTED
