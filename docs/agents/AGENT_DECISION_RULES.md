# AGENT DECISION RULES — SAPTM

> Every agent must answer these questions before any implementation.

---

## Pre-Implementation Checklist

Before writing code, agents MUST answer:

### 1. What documentation applies?

```
☐ docs/architecture/*          — Architecture constraints
☐ docs/database/*              — Schema and persistence rules
☐ docs/design-system/*         — Token and component rules
☐ docs/security/*              — Auth and authorization rules
☐ docs/testing/*               — Test requirements
☐ docs/rules/global.md         — Global execution rules
☐ docs/enterprise/*            — Audit findings and architecture targets
☐ packages/rpc/src/*.ts        — API contract (if touching API)
☐ AGENTS.md                    — Project context
```

### 2. What architecture rule applies?

- Monorepo modular architecture (defer microservices)
- oRPC contract-first (no REST endpoints for new features)
- Multi-tenancy via `organizationId` on all tenant-owned entities
- Audit trail on all critical mutations
- Idempotency on all external-facing mutations

### 3. What existing pattern should be reused?

- For new NestJS modules → copy structure from `apps/api/src/cargo/`
- For new RPC schemas → copy pattern from `packages/rpc/src/cargo.ts`
- For new UI components → use shadcn add command, export from `@saptm/ui`
- For new pages → use existing layout/loading/error pattern

### 4. What can break?

```
☐ Auth/permission checks     → Does the change affect authorization?
☐ API contracts              → Does the change modify input/output schemas?
☐ Database schema            → Does the change require a migration?
☐ Design tokens              → Does the change introduce new visual styles?
☐ Existing tests             → Will existing tests pass?
☐ Build pipeline             → Does the change affect build output?
☐ TypeScript strict checks   → Does the change pass noUnusedLocals/Parameters?
```

### 5. How will we validate?

```
☐ pnpm typecheck             — TypeScript compilation check
☐ pnpm lint                  — Biome lint + format check
☐ pnpm build                 — Full build pipeline
☐ pnpm test                  — API + RPC tests
☐ pnpm test:e2e              — E2E tests (if applicable)
☐ pnpm validate:foundation   — Foundation validation
```

---

## Decision Matrix

| Scenario | Action | Reference |
|---|---|---|
| New NestJS module needed | Copy `cargo/` structure, rename | `apps/api/src/cargo/` |
| New RPC operation needed | Add to existing domain file | `packages/rpc/src/{domain}.ts` |
| New UI component needed | `pnpm dlx shadcn@latest add <component>` | `docs/design-system/` |
| New database model needed | Add to `schema.prisma`, run migration | `packages/database/prisma/` |
| New permission needed | Add to `permissions.ts`, create migration | `packages/auth/src/permissions.ts` |
| New environment variable needed | Add to `@saptm/config` Zod schema | `packages/config/src/index.ts` |
| API contract breaking change | Create new contract version, update router | `packages/rpc/src/`, `apps/api/src/rpc/` |
| Design token change | Update `globals.css` + `tokens/index.ts` | `packages/ui/src/` |

---

## Prohibited Patterns

| Pattern | Why | Alternative |
|---|---|---|
| Direct `prisma.outboxEvent.create()` in services | Couples to DB table | `eventBus.publish(domainEvent)` |
| Inline `div className="rounded-xl border bg-card p-4"` | Violates design system | Use `MetricTile` or `Card` component |
| `await prisma.cargo.findUnique(...)` in services | Couples business logic to Prisma | Repository interface + implementation |
| Pages without `loading.tsx` + `error.tsx` | Bad UX, no recovery | Always add both files |
| `any` type assertions | Type safety violation | Use branded types or proper generics |
| `ts-expect-error` / `ts-ignore` | Silent type violations | Fix the underlying type issue |
| Client-side permission check as sole gate | Security bypass | Server-side auth + client conditional render |
| Raw CSS color values (`#fff`, `rgb(...)`) | Inconsistent with design system | Use semantic CSS variables |

---

## Governance Gates

The following require EXPLICIT approval before implementation:

```
GATE-1: New database migration     → Requires rollback plan
GATE-2: Permission model change    → Requires security review
GATE-3: API contract breaking      → Requires versioning strategy
GATE-4: New external dependency    → Requires dependency audit
GATE-5: Auth flow change           → Requires security review
GATE-6: Infrastructure change      → Requires deployment plan
```

---

## Post-Implementation Checklist

After writing code, agents MUST verify:

```
☐ TypeScript compiles (pnpm typecheck)
☐ Biome passes (pnpm lint)
☐ Tests pass (pnpm test)
☐ Loading/error states present (if frontend)
☐ Auth/permissions correct (if backend)
☐ Documentation updated (if behavioral change)
☐ No console errors (if frontend)
☐ No ts-ignore/ts-expect-error
☐ No hardcoded values that should use tokens
```
