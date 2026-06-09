# `@saptm/database`

Database package for Prisma schema, migrations, generated client access, and persistence guardrails.

Current status:

- Prisma schema implemented for foundation tables.
- Baseline migration implemented.
- Prisma client factory implemented.
- Audit trail helpers implemented.
- RBAC bootstrap seed implemented.
- No domain persistence implemented.

Implementation must follow `docs/database/database-strategy.md`.
Migration rollout must follow `docs/database/migration-runbook.md`.
