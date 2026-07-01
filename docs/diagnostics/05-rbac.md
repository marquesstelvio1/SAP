# Diagnostic: RBAC

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Role-Based Access Control
**Date:** 2026-06-23

---

## Current State

Custom RBAC implementation in `@saptm/auth`. 41 flat permissions. Per-organization roles with granular assignments. ALL/ANY evaluation modes. Policy engine in `policy.ts`.

## Problems

1. **No default roles** — On org creation, no default roles (Admin, Member, Viewer) are provisioned.
2. **No role hierarchy** — Roles are flat collections of permissions without inheritance.
3. **Permission assignment is all-or-nothing** — No resource-level scoping (e.g., "cargo.read on specific shipments").
4. **No role templates** — No predefined role templates for common profiles.
5. **Permission audit** — No tooling to review which users have which permissions across orgs.

## Technical Debt

- Permission list is hardcoded in `permissions.ts` — adding new permissions requires code change.
- Role-permission mapping is in `RolePermission` join table but no migration/seed for baseline roles.

## Risks

- **Medium:** Without default roles, org administrators must manually configure access from scratch.
- **Low:** Flat permission model will become unwieldy as the platform grows.

## Impact

Org onboarding is slow. Admins must create roles manually. Permission auditing requires SQL queries.

## Priority

Medium

## Recommended Actions

1. Implement role bootstrap on org creation (seed Admin, Member, Viewer roles).
2. Add role templates/permission groups for common profiles.
3. Implement permission audit view showing user-permission matrix.
4. Consider hierarchical roles for long-term scalability.

## Estimated Effort

4-5 days

## Owner Agent

auth
