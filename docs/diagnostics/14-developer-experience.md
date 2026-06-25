# Diagnostic: Developer Experience

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Developer Experience & Productivity
**Date:** 2026-06-23

---

## Current State

pnpm workspaces with Turborepo. Biome for lint/format. TypeScript strict mode. Knip for dead deps. Comprehensive validation scripts. Changesets for versioning.

## Problems

1. **Local setup friction** — Requires PostgreSQL 17 and Redis 7 locally; Docker Compose helps but initial setup has many steps.
2. **Script proliferation** — 60+ validation scripts with inconsistent naming (`validate-*.mjs`, `validate-*.ts`, `smoke-*.mjs`).
3. **No dev container** — No VS Code devcontainer.json or GitHub Codespaces configuration.
4. **Documentation drift** — AGENTS.md and docs may not reflect current code reality.
5. **No local database seed for development** — `db:seed` exists but may not provide comprehensive test data.
6. **TypeScript performance** — Large monorepo with strict mode may have slow type checking.

## Technical Debt

- `tsconfig.base.json` has `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` — strict but may cause friction.
- Bi-directional webpack/turbopack alias configuration is duplicated.

## Risks

- **Medium:** High barrier to entry for new contributors.
- **Low:** Developer productivity degrades as the monorepo grows.

## Impact

Onboarding takes hours instead of minutes. Developer tools (TS, lint) may feel slow.

## Priority

Medium

## Recommended Actions

1. Create VS Code devcontainer configuration with all dependencies pre-installed.
2. Consolidate validation scripts into organized groups with consistent naming.
3. Improve database seed with realistic test data.
4. Add repository-triggered documentation freshness check.
5. Consider TypeScript project references for faster incremental type checking.
6. Create a single `make dev` or `pnpm dev:setup` command for local environment setup.

## Estimated Effort

3-5 days

## Owner Agent

devops
