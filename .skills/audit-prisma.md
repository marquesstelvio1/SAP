# Audit: Prisma Schema and Migrations

## Purpose
Verify `@saptm/database` Prisma schema is normalized, indexes are optimized, relation integrity is sound, migration history is clean, enum usage follows conventions, cascading deletes are intentional, and idempotency patterns are applied correctly.

## Inputs
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/`
- `packages/database/prisma/seed.ts`
- `packages/database/package.json`

## Execution Steps

1. **Schema normalization**:
   - Verify every model has an `id` field (UUID or cuid2) as the primary key.
   - Check for redundant fields derivable from relations — flag and suggest removal.
   - Ensure field types use Prisma-native types (`String`, `Int`, `Float`, `Boolean`, `DateTime`, `Json`, `Decimal`) — no raw SQL types.
   - Validate that `@default(autoincrement())` is not used for distributed compatibility (use `@default(uuid())` or `@default(cuid())`).
   - Confirm `@@map` and `@map` are used for all models and fields to enforce snake_case in the database.

2. **Index strategy audit**:
   - Verify every `@unique` constraint is intentional (not used solely for indexing).
   - Check composite indexes on foreign keys used in `where` and `orderBy` queries.
   - Ensure indexes exist for all `@@index` patterns — flag missing indexes on commonly queried foreign keys.
   - Verify `@@index` uses the correct column order (cardinality-first for composite indexes).
   - Check for redundant indexes (duplicate or overlapping columns).

3. **Relation integrity audit**:
   - Verify every `@relation` is bidirectional (both sides defined) unless explicitly intentional.
   - Ensure `onDelete` is set for every required relation.
   - Validate that `onDelete: Cascade` is used only when data ownership semantics are correct (child data is meaningless without parent).
   - Check for `onDelete: SetNull` or `onDelete: Restrict` on critical financial/audit relations.
   - Verify `fields` and `references` in `@relation` match the actual database column types.

4. **Migration history audit**:
   - Check migration directory for squashing opportunities (migrations > 50 should be squashed).
   - Verify `migration_lock.yaml` exists and matches the target database provider.
   - Ensure no migration has been deleted or altered after creation (detect by hash mismatch).
   - Validate that each migration has a descriptive name corresponding to its purpose.
   - Check for `drift` between schema.prisma and the database (run `prisma migrate diff`).

5. **Enum usage audit**:
   - Verify all enums are defined at the schema level (`enum Status { ... }`) rather than as String fields.
   - Ensure enums do not contain deprecated values still referenced in migrations.
   - Check that enum values use PascalCase consistent with Prisma conventions.
   - Validate that application code handles all enum variants (no exhaustive switch warnings).

6. **Cascading delete audit**:
   - Inventory every `onDelete` directive in the schema.
   - Categorize each cascade as: `OWNER` (child owned by parent — Cascade OK), `REFERENCE` (child may outlive parent — SetNull/Restrict), `AUDIT` (child is audit log — Restrict/NoAction).
   - Flag any Cascade on `AUDIT` or `REFERENCE` relations as a security violation.
   - Ensure `onDelete: NoAction` is used for externally referenced models.

7. **Idempotency and seed audit**:
   - Verify `seed.ts` uses `upsert` for all seeded data (not `create`).
   - Ensure seed data has deterministic IDs.
   - Check that migration rollback strategy is documented for each migration.
   - Validate that `prisma generate` produces no warnings.

## Validation Steps
- `prisma validate` passes without warnings.
- `prisma migrate diff --from-schema-datamodel --to-schema-datamodel` produces no diff.
- `prisma generate` completes without errors.
- `turbo run test --filter=@saptm/database` passes.
- `turbo run build --filter=@saptm/database` passes.

## Definition Of Done
- All models have UUID/cuid primary keys; no `autoincrement()` on primary keys.
- Indexes exist on all foreign key columns; composite indexes are cardinality-ordered.
- Every relation has an explicit `onDelete` directive that matches data ownership semantics.
- Migration history is sequential, well-named, and squashed under 50 files.
- Enums are defined at schema level; no String-based enum patterns.
- Cascading deletes are categorized: `OWNER` = Cascade, `REFERENCE` = SetNull/Restrict, `AUDIT` = NoAction.
- Seed script uses `upsert` with deterministic IDs.

## Failure Conditions
- A model lacks a primary key or uses `autoincrement()`.
- A foreign key column is missing a `@@index` or `@index`.
- A `@relation` is missing a bidirectional counterpart.
- Cascade is used on an audit-log or financial transaction relation.
- Migration count exceeds 50 without squash documentation.
- `prisma validate` reports errors or warnings.
- Seed script uses `create` instead of `upsert` for any entry.

## Required Reports
- `reports/audit-prisma/schema-normalization.json` — model-by-model field audit with violations.
- `reports/audit-prisma/index-strategy.json` — full index inventory with cardinality analysis and missing index recommendations.
- `reports/audit-prisma/relation-integrity.json` — relation inventory with `onDelete` categorization and bidirectional verification.
- `reports/audit-prisma/migration-history.json` — migration list with timestamps, drift status, squash recommendations.
- `reports/audit-prisma/cascade-classification.json` — each cascade classified as OWNER/REFERENCE/AUDIT with rationale.
- `reports/audit-prisma/summary.json` — pass/fail per step, total violations, remediation priority.
