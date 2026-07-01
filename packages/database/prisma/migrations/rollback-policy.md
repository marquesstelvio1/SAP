# Rollback Policy

## Purpose

Define when and how to reverse a Prisma migration safely, without data loss
or unreviewed schema drift.

## Expand-Migrate-Contract Pattern

Breaking schema changes (rename column, change type, split table) **must** use
three-phase expand-migrate-contract to enable zero-downtime rollback:

| Phase | Action | Rollback |
|---|---|---|
| **Expand** | Add new columns/tables alongside old ones. Code writes to both. | Safe — old code still works. |
| **Migrate** | Backfill new columns, swap reads to new structure. | Reversible — swap reads back. |
| **Contract** | Drop old columns/tables. | Destructive — requires `rollback.sql` + backup. |

Only the **Contract** phase needs a `rollback.sql` file. Expand and Migrate
phases can be rolled back by redeploying the previous application version.

## When to Rollback vs Forward-Fix

| Scenario | Action |
|---|---|
| Migration caused data loss | Rollback + restore from backup |
| Migration caused application errors | Prefer forward-fix migration |
| Schema change incompatible with running code | Rollback migration + rollback deployment |
| Partial migration failure (network, timeout) | Forward-fix or manual repair |
| Destructive change deployed without approval | Rollback + incident review |

**Hotfix rollback must prefer forward-fix** unless the database is in an
inconsistent state that cannot be repaired by a new migration.

## Prisma `migrate resolve --rolled-back` Approach

Prisma tracks applied migrations in the `_prisma_migrations` table.
When a migration is reversed manually (via `rollback.sql`), Prisma still
believes the migration is applied. To correct this:

```bash
prisma migrate resolve --rolled-back "<migration_name>"
```

This updates the `_prisma_migrations` record without running any SQL.
It tells Prisma: "This migration has been undone; do not expect it."

The rollback script (`db:migrate:rollback`) automates this:

1. Executes `rollback.sql` if present in the migration directory.
2. Runs `prisma migrate resolve --rolled-back <migration_name>`.
3. Supports `--dry-run` to preview without side effects.

## Creating a `rollback.sql` File

Every **destructive** migration (Contract phase, DROP, data removal) **must**
include a `rollback.sql` file in the migration directory alongside `migration.sql`.

### Rollback SQL Rules

- **Reverse every** `CREATE TABLE` with `DROP TABLE IF EXISTS "<TableName>" CASCADE;`
- **Reverse every** `CREATE TYPE` with `DROP TYPE IF EXISTS "<TypeName>";`
- **Reverse every** `ALTER TABLE ... ADD COLUMN` with `ALTER TABLE "<TableName>" DROP COLUMN "<ColumnName>";`
- **Reverse every** `CREATE INDEX` with `DROP INDEX IF EXISTS "<IndexName>";`
- **Reverse every** `ALTER TABLE ... ADD CONSTRAINT` with `ALTER TABLE "<TableName>" DROP CONSTRAINT "<ConstraintName>";`
- **Restore dropped** objects using the original `CREATE` statements from `migration.sql`.
- **Do not include** non-reversible operations (data transformation, backfill) —
  document those as manual steps in the migration commit message.

### Example

```sql
-- rollback.sql for 20260604220000_tariff_pricing_foundation
DROP TABLE IF EXISTS "TariffQuote" CASCADE;
DROP TABLE IF EXISTS "TariffRateRule" CASCADE;
DROP TABLE IF EXISTS "TariffRateCard" CASCADE;
DROP TYPE IF EXISTS "TariffQuoteStatus";
DROP TYPE IF EXISTS "TariffCalculationBasis";
DROP TYPE IF EXISTS "TariffChargeType";
DROP TYPE IF EXISTS "TariffRateCardStatus";
```

## Backup Requirements Before Production Migrations

| Data Type | Backup Required | Verification |
|---|---|---|
| Production business data | `pg_dump` logical backup | File exists, size > 0 |
| Reference/seed data | Schema backup sufficient | N/A |
| Empty tables | No backup required | N/A |

**Before any production migration** (including rollback):

1. Confirm the latest successful database backup exists.
2. Verify backup integrity (file size, restore test if高风险).
3. Record the backup identifier in the change request.
4. For destructive rollbacks, take an **additional pre-rollback backup**.

See `docs/database/backup-restore-runbook.md` for full backup and restore
procedures.

## How to Use the Rollback Script

```bash
# Rollback the last applied migration
pnpm db:migrate:rollback -- --last

# Rollback a specific migration
pnpm db:migrate:rollback -- --name=20260604220000_tariff_pricing_foundation

# Preview without executing
pnpm db:migrate:rollback -- --last --dry-run
```

The `--` separates pnpm/pass-through arguments from the script's arguments.

## Recovery Fallback

If `db:migrate:rollback` fails or the database is in an inconsistent state:

1. **Stop** all application traffic to the affected services.
2. **Take** a forensic backup of the current state.
3. **Restore** from the pre-migration backup using the restore runbook.
4. **Document** the failure cause and adjust the rollback plan.

Full database restore instructions are in `docs/database/backup-restore-runbook.md`.
