# Database Migration Runbook

## Purpose

Define how SAPTM database schema changes move from local development to production without
unreviewed drift, untracked SQL, or unsafe rollback assumptions.

## Current Baseline

The initial production baseline is:

- `packages/database/prisma/migrations/20260602160000_initial_foundation/migration.sql`
- `packages/database/prisma/migrations/migration_lock.toml`

It creates the Better Auth tables, organization/RBAC tables, audit trail, service accounts,
API keys, integration events, and outbox events. It does not create product-domain tables for
rail, port, cargo, tracking, analytics, or AI features yet.

## Local Development

1. Update `packages/database/prisma/schema.prisma`.
2. Create a Prisma migration:

```powershell
pnpm db:migrate:dev
```

3. Validate schema and migration coverage:

```powershell
pnpm db:validate
pnpm validate:migrations
```

4. Generate Prisma client:

```powershell
pnpm db:generate
```

## CI Gates

CI must run:

- `pnpm validate:foundation`
- `pnpm validate:migrations`
- `pnpm db:validate`
- `pnpm db:generate`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

## Production Deployment

Confirm the latest successful logical backup before any production migration:

```powershell
kubectl get jobs -n saptm-production -l app.kubernetes.io/component=database-backup
```

Production deploys must run migrations before API rollout:

```powershell
pnpm db:migrate:deploy
```

Then run the API and web release only after migration status is healthy:

```powershell
pnpm db:migrate:status
```

## Rollback Rules

- Prisma migrations are not automatically reversible.
- Every destructive schema change requires a documented rollback plan before merge.
- Expand-migrate-contract is mandatory for breaking changes.
- Data deletion migrations require backup evidence and explicit approval.
- Hotfix rollback must prefer forward-fix migration unless restoring from backup is safer.

## Prohibited Changes

- Editing an applied migration.
- Deploying schema changes without migration SQL.
- Running `db:migrate:dev` in production.
- Adding production seed data through the RBAC bootstrap seed.
- Introducing tenant-owned tables without authorization and audit rules.
