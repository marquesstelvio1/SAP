# Standard: Prisma

**Phase:** 4 — Engineering Standards

---

## Required

- Prisma v7 with `@prisma/adapter-pg`
- All domain models scoped to `organizationId`
- Idempotency keys with unique constraints on mutation models
- `@@index` on all foreign keys and frequent query patterns
- `@@unique` on business identifiers (reference codes, slugs)
- Enums for all fixed-value fields (statuses, types)
- Migrations applied at deployment via init container

## Recommended

- Use `@map` for table names (snake_case in DB, camelCase in code)
- Use `@@map` for model names
- Use Prisma validator for runtime type safety
- Use `select` over `include` to limit data transfer
- Use transactions for multi-table mutations
- Use batch operations for bulk inserts

## Forbidden

- Raw SQL queries unless absolutely necessary
- `any` typed fields — Use `Json` type with validation at application layer
- N+1 queries — Use `include` or batch queries
- Missing indexes on foreign keys
- Hard-deleting domain data — Use status-based lifecycle

## Schema Organization

```
datasource db { provider = "postgresql" }
generator client { provider = "prisma-client" }

// Enums first
// Then models (auth → org → domain → supporting)
```

## Validation

- `prisma validate` passes
- `prisma generate` succeeds
- Migration no-op in production (check before deploy)
- All indexes are applied in production

## Migration

- Generate migration locally with `prisma migrate dev`
- Review SQL before applying
- Deploy with `prisma migrate deploy` in init container
- Rollback with custom rollback script
- Never edit migration files manually
