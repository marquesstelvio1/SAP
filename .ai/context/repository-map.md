# Repository Map

**Phase:** 11 — AI Memory Layer

---

## Quick Reference

### Root Config
- `package.json` — Root workspace config
- `pnpm-workspace.yaml` — Package discovery + catalog
- `turbo.json` — Task pipeline
- `tsconfig.base.json` — Strict TypeScript config
- `biome.json` — Lint/format config
- `compose.yaml` — 8-service Docker Compose

### Apps
- `apps/api/` — NestJS 11 backend (22 modules)
- `apps/web/` — Next.js 16 frontend

### Key Packages
- `packages/auth/` — Better Auth + policy engine
- `packages/database/` — Prisma schema + client
- `packages/rpc/` — RPC contracts + metadata
- `packages/ui/` — shadcn/ui components + tokens
- `packages/config/` — Zod env validation
- `packages/observability/` — OpenTelemetry helpers

### Key Directories
- `docs/` — Full documentation suite
- `.ai/` — AI Engineering OS
- `deploy/` — Kubernetes + observability configs
- `scripts/` — 60+ validation scripts
- `tests/` — E2E + load tests
