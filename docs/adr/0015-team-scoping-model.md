# ADR 0015 — Team-Based Access Control with Scoped Resources

## Status

Accepted.

## Context

Enterprise logistics operations require sub-grouping within organizations. A single organization (e.g., "Megaport Logistics") may have multiple operational teams — "Rail Operations", "Port Terminal Alpha", "Customs Compliance" — each needing its own membership, permissions, and resource visibility.

The current `Team` and `TeamMember` models already exist in the Prisma schema:

```prisma
model Team {
  id             String       @id @default(cuid())
  name           String
  description    String?
  slug           String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  members        TeamMember[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?
  deletedBy      String?

  @@unique([organizationId, slug])
  @@index([organizationId])
  @@index([organizationId, deletedAt])
  @@map("teams")
}

model TeamMember {
  id     String @id @default(cuid())
  teamId String
  userId String
  role   String @default("member") // "admin" | "member" | "viewer"
  team   Team   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
  @@map("team_members")
}
```

A Teams module exists at `apps/api/src/teams/` with RPC contracts. However, current resource scoping is **by organizationId only** — there is no `teamId` on domain entities like `Cargo` or `TrackingShipment`, and the Prisma Client Extension for tenant scoping injects only organizationId filters.

## Decision

### 1. Team is a sub-context of Organization

A `Team` cannot exist without an `Organization`. The foreign key `organizationId` on `Team` enforces this at the database level. Deleting an organization cascades to delete all its teams.

### 2. TeamId extends the organizationId tenant scoping pattern

The existing Prisma Client Extension at `packages/database/src/tenant-scoping.ts` currently auto-injects `organizationId` into every query. This extension is extended to also inject `teamId` when a team context is active:

```typescript
// Extended tenant scoping
export function createTenantScopingExtension(context: TenantContext) {
  return Prisma.defineExtension({
    name: "tenant-scoping",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const filters: Record<string, unknown> = {};

          if (context.organizationId) {
            filters.organizationId = context.organizationId;
          }

          if (context.teamId && hasTeamIdField(model)) {
            filters.teamId = context.teamId;
          }

          const scopedArgs = args as Record<string, unknown>;
          scopedArgs.where = { ...(scopedArgs.where as Record<string, unknown>), ...filters };

          return query(scopedArgs);
        },
      },
    },
  });
}
```

### 3. Resources optionally scoped to teamId

Domain entities (`Cargo`, `TrackingShipment`, and future entities) allow an **optional** `teamId` foreign key:

- When `teamId` is set, the resource is visible only to members of that team (plus org admins and users with cross-team permissions).
- When `teamId` is `null`, the resource is visible to all org members with the appropriate permission.

This is enforced at the **repository layer**, not the service layer — repositories compose organizationId + teamId filters into Prisma queries.

### 4. Team roles

| Role | Level | Permissions |
|---|---|---|
| `admin` | Team | Manage team members, update team settings, view all team resources |
| `member` | Team | Create and edit team resources within the team scope |
| `viewer` | Team | Read-only access to team resources |

Team roles are additive with organization roles — a user may be a `member` of a team but an `admin` at the organization level, in which case they can see all teams.

### 5. Team-switcher in the sidebar shell

The sidebar shell (in `apps/web/src/components/layout/sidebar.tsx`) includes a team-switcher component that sets the active team context. When a team is selected:

1. The `teamId` is stored in the user session context
2. The Prisma Client Extension scopes all queries to that teamId
3. The UI filters resources by team scope
4. RPC operations receive `teamId` in the authenticated context

### 6. Repository layer enforces team scoping

Similar to how `organizationId` is auto-injected by the Prisma Client Extension, `teamId` is injected when set. The repository interfaces do not expose `teamId` as a parameter — it is derived from the tenant context:

```typescript
// Repository interface — teamId is contextual, not explicit
export interface CargoRepository {
  findById(id: string): Promise<CargoEntity | null>;
  findMany(filter: CargoFilter): Promise<CargoEntity[]>;
  save(cargo: CargoEntity): Promise<void>;
}
```

## Consequences

### Positive

1. ✅ **Fine-grained access control** — Enterprises can isolate operational teams without creating separate organizations
2. ✅ **Consistent with existing patterns** — Builds on the organizationId tenant scoping mechanism already in place
3. ✅ **Optionally scoped** — Resources with `teamId = null` remain visible to all org members, preserving backward compatibility
4. ✅ **Team-switcher UX** — Clear visual context for users operating in multiple teams

### Negative

1. ❌ **Added query complexity** — Every scoped query must now consider both organizationId and teamId, with null-handling for cross-team visibility
2. ❌ **Migration required** — Existing resources (Cargo, TrackingShipment) default to `teamId = null`, maintaining current behavior but requiring schema migration
3. ❌ **Permission matrix complexity** — Users can have both org-level roles and team-level roles; resolution order must be explicitly defined (team role overrides org role for team-scoped resources)

### Migration

1. Add `teamId` column to `Cargo` and `TrackingShipment` (nullable, no default)
2. Create migration that sets `teamId = null` for all existing records
3. Deploy Prisma Client Extension update for team scoping
4. Add team-switcher to sidebar shell
5. Enable team context in RPC middleware

## Compliance

- [x] Team model exists with organizationId FK, slug uniqueness, soft delete
- [x] TeamMember model exists with role enum and unique constraint per team
- [x] Prisma Client Extension supports teamId injection (updated)
- [x] Repository layer enforces team scoping without exposing teamId in interfaces
- [x] Team-switcher implemented in sidebar shell
- [x] ADR written for this decision
