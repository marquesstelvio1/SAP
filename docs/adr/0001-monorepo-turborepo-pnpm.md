# ADR 0001 — Use PNPM and Turborepo Monorepo

## Status

Accepted.

## Decision

Use PNPM workspaces and Turborepo to manage `apps/*` and `packages/*`.

## Rationale

The platform needs shared contracts, auth, database, UI, config, and testing utilities with strict dependency direction. PNPM provides efficient workspace dependency management. Turborepo provides task orchestration and caching.

## Consequences

- All internal dependencies use `workspace:*`.
- Root scripts orchestrate work through Turbo.
- Package boundaries must remain explicit.

