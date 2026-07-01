# DEPENDENCY GOVERNANCE — SAPTM

> Version-aware implementation rules for all agents.

---

## Package: Next.js

| Property | Value |
|---|---|
| Version | ^16.0.0 |
| Installed | 16.x |
| Allowed patterns | App Router, Server Components, Server Actions, Turbopack |
| Forbidden patterns | Pages Router patterns, `getServerSideProps`, `getStaticProps`, `pages/` directory |
| Migration notes | Standalone output required for Docker deployment |
| CSP note | Tailwind v4 requires `style-src 'unsafe-inline'` or hash-based CSP |

---

## Package: React

| Property | Value |
|---|---|
| Version | 19.2.7 (pinned in catalog) |
| Allowed patterns | Server Components (default), Client Components ("use client"), `useActionState`, `cache()` |
| Forbidden patterns | `useEffect` for data fetching, class components, legacy context |
| Migration notes | React Compiler eligible (code is memo-safe) |

---

## Package: Prisma

| Property | Value |
|---|---|
| Version | ^7.0.0 |
| Adapter | `@prisma/adapter-pg` (driver adapter pattern) |
| Allowed patterns | Schema-first, Prisma Client via adapter, migrations via `prisma migrate` |
| Forbidden patterns | Raw SQL without documented exception, Prisma middleware for global audit |
| Migration notes | v7 uses driver adapter pattern (not direct client). Rollback plan required for every migration. |
| Location | `packages/database/prisma/schema.prisma` |

---

## Package: better-auth

| Property | Value |
|---|---|
| Version | ^1.0.0 |
| Allowed patterns | Email/password, 2FA (TOTP), session management, organization plugin |
| Forbidden patterns | Direct user table manipulation outside Better Auth |
| Notes | Custom RBAC/ABAC is `@saptm/auth` — not Better Auth's built-in RBAC |

---

## Package: @orpc (client/contract/server)

| Property | Value |
|---|---|
| Version | ^1.0.0 |
| Allowed patterns | Contract-first design, Zod schemas, typed clients, middleware pipes |
| Forbidden patterns | Raw REST endpoints for new features, skipping contract layer |
| Notes | API versioning must be contract-level, not path-based |

---

## Package: Zod

| Property | Value |
|---|---|
| Version | ^4.0.0 |
| Migration notes | Zod v4 removed `received` property from `ZodInvalidTypeIssue`. Use `"received" in i` pattern. |
| Allowed patterns | Schema validation, input/output type inference, `.superRefine()` |
| Forbidden patterns | `any` casts to bypass type safety |

---

## Package: Tailwind CSS

| Property | Value |
|---|---|
| Version | ^4.0.0 |
| Allowed patterns | `@theme inline` for token mapping, semantic class names, `gap-*` over `space-*` |
| Forbidden patterns | Arbitrary values without token backing (`p-[13px]`), raw color utilities |
| Migration notes | v4 uses CSS-first config, no `tailwind.config.ts` |

---

## Package: TanStack React Query

| Property | Value |
|---|---|
| Version | ^5.0.0 |
| Status | **Installed but unused** — available for mutation/refetch patterns |
| Allowed patterns | `useMutation` + `invalidateQueries` for form updates, `useQuery` for cacheable client data |
| Forbidden patterns | Replacing RSC data fetching with client-side queries |

---

## Package: @sentry/nextjs

| Property | Value |
|---|---|
| Version | ^8.0.0 |
| Status | Configured (DSN-based), conditional on env presence |
| Allowed patterns | Error tracking, performance monitoring, tunnel route |
| Notes | `instrumentation.ts` handles conditional initialization |

---

## Package: stripe

| Property | Value |
|---|---|
| Version | ^18.0.0 |
| Status | Catalog dep, used in `apps/api/src/billing/` |
| Allowed patterns | Checkout sessions, customer portal |
| Notes | Subscription management is partial — charge/invoice lifecycle not implemented |
