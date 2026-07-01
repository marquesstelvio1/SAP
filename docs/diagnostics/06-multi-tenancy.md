# Diagnostic: Multi-tenancy

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Tenant Isolation & Multi-tenancy
**Date:** 2026-06-23

---

## Current State

All domain data scoped to `organizationId`. Every query/mutation filters by org context. Organizations have status lifecycle (active/suspended/archived). Memberships link users to orgs.

## Problems

1. **No automatic tenant query scoping** — Developers must manually add `organizationId` filters to every query. No Prisma middleware enforces this.
2. **Cross-tenant data leak risk** — A missing `organizationId` filter exposes other tenants' data.
3. **No tenant-level rate limiting** — One tenant can consume all API capacity, starving others.
4. **Suspended org handling** — When an org is suspended, active sessions may still have access until token expiry.
5. **No tenant resource quotas** — No enforcement of per-tenant storage/API call limits.

## Technical Debt

- Tenant context is passed via `x-tenant-id` header but enforcement is manual.
- No Prisma client middleware to inject tenant filters automatically.

## Risks

- **Critical:** Missing org filter on any query causes cross-tenant data exposure.
- **Medium:** Suspended orgs may retain access until session expiry.

## Impact

A single developer error can expose all tenants' data. Platform cannot enforce tenant-level SLAs.

## Priority

Critical

## Recommended Actions

1. Implement Prisma client middleware that automatically injects `organizationId` filters.
2. Add tenant-level rate limiting via `@nestjs/throttler` with org-based throttler groups.
3. Add session validation against org status on each request.
4. Implement tenant resource quotas with `UsageRecord` enforcement.
5. Add automated tests that verify no cross-tenant data access.

## Estimated Effort

5-7 days

## Owner Agent

security
