# PACKAGE MAP — SAPTM

> Complete package dependency map with purpose and rules.

---

## Applications

### `@saptm/api` (apps/api)

| Property | Value |
|---|---|
| Purpose | NestJS backend — domain services, RPC handlers, persistence |
| Stack | NestJS 11, @orpc/server, Express platform |
| Port | 4000 |
| Build | `tsc -p tsconfig.json` |
| Dev | `tsx watch src/main.ts` via dotenvx |
| Docker | Multi-stage, production-only deps |
| Dependencies | `@saptm/database`, `@saptm/rpc`, `@saptm/auth/server`, `@saptm/config`, `@saptm/types`, `@saptm/observability` |
| Rules | All mutations require authorization + validation + idempotency + audit |

### `@saptm/web` (apps/web)

| Property | Value |
|---|---|
| Purpose | Next.js frontend — browser UI, RSC data fetching, auth routes |
| Stack | Next.js 16, React 19, Turbopack, shadcn/ui |
| Port | 3000 |
| Build | `next build` (standalone) |
| Dev | `next dev` via dotenvx (Turbopack) |
| Docker | Multi-stage, standalone output |
| Dependencies | `@saptm/ui`, `@saptm/rpc`, `@saptm/auth/client`, `@saptm/config`, `@saptm/types`, `@saptm/observability` |
| Rules | Server Components by default, Client Components only when needed |

---

## Packages

### `@saptm/auth` (packages/auth)

| Property | Value |
|---|---|
| Purpose | Better Auth configuration, session types, RBAC policy, permissions |
| Exports | `/client`, `/server` (subpath exports) |
| Dependencies | `@saptm/database` |
| Key files | `src/permissions.ts` (41 permissions), `src/policy.ts` (evaluator), `src/context.ts` (AuthContext) |
| Rules | Permission changes require migration. Authorization is custom, not Better Auth RBAC. |

### `@saptm/config` (packages/config)

| Property | Value |
|---|---|
| Purpose | Zod-validated environment schema |
| Dependencies | None (standalone) |
| Exports | `getServerEnv()`, `getClientEnv()`, `getTrustedOrigins()` |
| Rules | Zod v4 API — use `"received" in i` pattern for invalid type checks |

### `@saptm/database` (packages/database)

| Property | Value |
|---|---|
| Purpose | Prisma ORM v7, schema/migrations, audit trail, outbox, RBAC seeds |
| Schema | 1261 lines, 30+ models, 25+ enums |
| Dependencies | `@prisma/adapter-pg`, `@prisma/client` (both ^7.0.0) |
| Key files | `prisma/schema.prisma`, `prisma/seed.ts`, `scripts/process-outbox.mjs` |
| Rules | All migrations need rollback plan. Tenant scope on all business entities. Audit on critical mutations. |

### `@saptm/rpc` (packages/rpc)

| Property | Value |
|---|---|
| Purpose | oRPC contract definitions + Zod schemas for all domains |
| Domains | 14 domain files + metadata + authorization + errors |
| Dependencies | `@saptm/auth` (permission types only) |
| Key files | `src/cargo.ts` (1192 lines), `src/tracking.ts` (618 lines), `src/capacity.ts`, `src/planning.ts`, `src/tariff.ts`, etc. |
| Rules | Every contract has: input schema, output schema, operation metadata. Metadata includes auth mode, permissions, audit class, idempotency mode. |

### `@saptm/ui` (packages/ui)

| Property | Value |
|---|---|
| Purpose | shadcn/ui design system — 42 components + tokens |
| Dependencies | radix-ui, cva, tailwind-merge, clsx, sonner, recharts, next-themes, react-day-picker, date-fns, @tanstack/react-table |
| Key dirs | `src/components/` (42 components), `src/tokens/` (TypeScript token exports), `src/styles/globals.css` (CSS variables) |
| Rules | No raw color/spacing utilities. All components use `cn()`. Dialog/Sheet need accessible titles. Density variants on form components. |

### `@saptm/observability` (packages/observability)

| Property | Value |
|---|---|
| Purpose | OpenTelemetry types, trace context helpers, Prometheus registry |
| Dependencies | None (standalone — types only) |
| Key files | `src/index.ts` (TraceContext, headers), `src/prometheus.ts` |
| Rules | Trace context propagated through all RPC operations. Correlation ID required. |

### `@saptm/testing` (packages/testing)

| Property | Value |
|---|---|
| Purpose | Test fixtures — auth, RPC, trace contexts |
| Dependencies | `@playwright/test`, `@saptm/auth` |
| Rules | No production-like data. Tenant-scoped fixtures. Time-dependent tests use controlled clocks. |

### `@saptm/types` (packages/types)

| Property | Value |
|---|---|
| Purpose | Cross-context TypeScript types (not runtime contracts) |
| Dependencies | None |
| Rules | Only shared types that are NOT Zod schemas. Domain-specific types go in `@saptm/rpc`. |

### `@saptm/email` (packages/email)

| Property | Value |
|---|---|
| Purpose | Resend email client with templates |
| Templates | Portuguese only (PT-BR) |
| Rules | No production emails without tenant context. Templates need i18n before internationalization. |

### `@saptm/tsconfig` (packages/tsconfig)

| Property | Value |
|---|---|
| Purpose | Shared TypeScript presets (base, next, nest) |
| Dependencies | None |
| Key files | `base.json`, `next.json`, `nest.json` |
