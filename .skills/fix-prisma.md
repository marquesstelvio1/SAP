# fix-prisma.md

## Purpose
Resolve Prisma schema, client generation, and migration issues in the SAPTM monorepo, ensuring `@saptm/database` package produces a valid Prisma client and migrations are consistent with the schema.

## Inputs
- `prisma validate` output
- `prisma migrate` status / error output
- `prisma generate` output
- `schema.prisma` file at `packages/database/prisma/schema.prisma`
- Migration files at `packages/database/prisma/migrations/`
- Typecheck errors referencing Prisma client types

## Execution Steps

1. **Capture current state**
   ```bash
   cd packages/database
   npx prisma validate 2>&1 | tee .prisma-validate.txt
   npx prisma migrate status 2>&1 | tee .prisma-migrate-status.txt
   ```

2. **Check schema.prisma syntax**
   - Verify datasource block: `provider = "postgresql"`, `url = env("DATABASE_URL")`
   - Verify generator block: `provider = "prisma-client-js"`
   - Check for unsupported native types (Postgres-specific types must match Prisma mapping)
   - Ensure `@@map` and `@map` conventions match domain naming in `@saptm/database`

3. **Verify relation integrity**
   - Every `@relation` must reference a valid field on the related model
   - One-sided relations (missing `fields` or `references`) are invalid
   - Relation scalar fields must match in type and optionality
   - Self-relations must be properly configured
   - Check for ambiguous relations requiring `name` argument
   - Verify no circular relation chains that could cause client generation to fail

4. **Inspect enum changes**
   - Enum values removed? Check if they are used in data — requires migration plan
   - Enum values added? Safe additive change
   - Enum renamed? Consider `@@map` instead of breaking rename
   - Database enums vs Prisma-level enums — ensure consistency

5. **Check migration history**
   ```bash
   npx prisma migrate status 2>&1
   ```
   - Migration history must be linear (no branches)
   - Latest migration must match current schema
   - No unapplied migrations in production baseline
   - If migration conflict: `prisma migrate resolve --rolled-back "migration_name"` or `--applied`
   - Use `prisma migrate diff` to diagnose drift

6. **Handle migration conflicts**
   - Baseline conflict: `prisma migrate resolve --baseline "migration_name"`
   - Diverged history: manually align or use `prisma migrate diff` + `prisma db execute` for surgical fix
   - Failed migration: rollback migration file, fix schema, re-run `prisma migrate dev`

7. **Generate client**
   ```bash
   npx prisma generate 2>&1 | tee .prisma-generate.txt
   ```
   - Verify `@prisma/client` is generated in `node_modules/@prisma/client`
   - Verify `packages/database/src/client.ts` imports correctly from generated client

8. **Validate generation**
   ```bash
   npx prisma validate 2>&1
   ```

9. **Run typecheck**
   ```bash
   cd ../.. && turbo run typecheck --filter=@saptm/database
   ```
   - Fix any type errors caused by schema changes (regenerated client types)

## Validation Steps
- [ ] `prisma validate` exits with code 0
- [ ] `prisma generate` completes without error
- [ ] Migration history is linear and matches schema
- [ ] `turbo run typecheck --filter=@saptm/database` passes
- [ ] No dangling `@relation` or orphaned scalar fields
- [ ] All enums used in schema are defined or mapped correctly

## Definition Of Done
- `prisma validate` passes without warnings
- `prisma generate` produces valid client
- Migration history is consistent and deployable
- Typecheck passes for `@saptm/database` and all downstream consumers
- CI database validation gate passes

## Failure Conditions
- Client generation fails due to schema errors
- Migration history cannot be resolved without data loss
- Fix introduces relation ambiguity that breaks queries
- Schema fix requires changing generated client API consumed by `@saptm/rpc` or `@saptm/api`
- Circular relation chain prevents client generation

## Required Reports
- `.prisma-validate.txt` — validation output before fix
- `.prisma-generate.txt` — generation output before fix
- `.prisma-migrate-status.txt` — migration status before fix
- `schema-diff.md` — schema changes made (with `@@map`/`@map` justification)
- `migration-plan.md` — any migration resolution steps taken
