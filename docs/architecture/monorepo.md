# Monorepo Architecture

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## Tooling

- pnpm 10.12.1 (workspaces)
- Turborepo ^2.5.0
- TypeScript ^5.8 (project references)
- Biome ^2.0.0 (lint + format)
- Knip ^5.0.0 (dead dependency detection)
- Changesets ^2.29.0 (version management)

## Workspace Structure

```
saptm/                          # Root
├── pnpm-workspace.yaml         # Package discovery + catalog
├── turbo.json                  # Task pipeline definitions
├── tsconfig.base.json          # Shared TypeScript config
├── biome.json                  # Shared lint/format config
├── components.json             # shadcn/ui configuration
├── knip.json                   # Dead dependency check config
├── compose.yaml                # Docker Compose (8 services)
│
├── apps/
│   ├── api/                    # @saptm/api — NestJS backend
│   └── web/                    # @saptm/web — Next.js frontend
│
├── packages/
│   ├── auth/                   # @saptm/auth — Auth logic
│   ├── config/                 # @saptm/config — Env validation
│   ├── database/               # @saptm/database — Prisma
│   ├── email/                  # @saptm/email — Resend
│   ├── form/                   # @saptm/form — Forms
│   ├── observability/          # @saptm/observability — OTEL
│   ├── rpc/                    # @saptm/rpc — Contracts
│   ├── testing/                # @saptm/testing — Fixtures
│   ├── tsconfig/               # @saptm/tsconfig — Presets
│   ├── types/                  # @saptm/types — Shared types
│   └── ui/                     # @saptm/ui — Components
│
├── tests/
│   ├── e2e/                    # Playwright tests
│   └── load/                   # Load tests
│
├── deploy/
│   ├── kubernetes/             # K8s manifests
│   └── observability/          # Monitoring configs
│
├── scripts/                    # 60+ validation scripts
├── .github/workflows/          # 9 CI workflows
└── docs/                       # Documentation
```

## Dependency Rules

```
@saptm/web ──► @saptm/auth, @saptm/config, @saptm/form, @saptm/rpc, @saptm/types, @saptm/ui
@saptm/api ──► @saptm/auth, @saptm/config, @saptm/database, @saptm/observability, @saptm/rpc, @saptm/types

Packages:
@saptm/auth ──► @saptm/config, @saptm/database, @saptm/email, @saptm/observability
@saptm/database ──► @saptm/config, @saptm/email, @saptm/observability
@saptm/rpc ──► @saptm/auth, @saptm/observability, @saptm/types
@saptm/ui ──► react, react-dom, radix-ui, tailwind-merge, cva

Apps NEVER depend on other apps.
Packages NEVER depend on apps.
```

## Task Pipeline (turbo.json)

```
build:     ^build → build
typecheck: ^build → typecheck
test:      ^build → build → test
lint:      lint
dev:       persistent, no cache
```

## Catalog Versioning

All shared dependency versions managed in `pnpm-workspace.yaml` `catalog:` section. No direct dependency versions in package.json (uses `catalog:` references).

## Key Constraints

1. All source code in `apps/` or `packages/`
2. No direct `src/` imports across packages — use workspace package names
3. Package boundaries enforced by TypeScript project references
4. No dependency added outside catalog without ADR approval
5. No circular dependencies between packages
