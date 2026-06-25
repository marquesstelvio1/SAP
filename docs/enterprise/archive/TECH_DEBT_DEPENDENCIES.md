# TECHNICAL DEBT & DEPRECATED CODE — SAPTM

> Scan results for deprecated APIs, old patterns, and incompatible versions.

---

## Detected Issues

| # | Issue | Location | Risk | Fix |
|---|---|---|---|---|
| TD-01 | `cmdk` root dependency is redundant | `package.json` line 87 | Low | Remove, use radix-ui catalog version |
| TD-02 | `zod` v4 `received` property access | `packages/config/src/index.ts` | Medium | Use `"received" in i` guard (already fixed per FINAL-ENTERPRISE-REPORT.md) |
| TD-03 | CSP `unsafe-inline` for styles | `apps/web/src/middleware.ts` | Medium | Use nonce or hash-based CSP for Tailwind v4 |
| TD-04 | PowerShell scripts for CI workflows | `scripts/*.ps1` (7 files) | High | Rewrite in Node.js for cross-platform |
| TD-05 | Turbopack resolveAlias hardcoded paths | `apps/web/next.config.ts` lines 40-50 | High | Use proper module resolution |
| TD-06 | `force-dynamic` on all pages | `apps/web/app/(platform)/` | Low | Re-evaluate caching strategy per page |
| TD-07 | Empty `packages/ui/hooks/` directory | `packages/ui/src/hooks/` | Low | Remove or implement hooks |

---

## Deprecated Patterns (No Occurrences Found)

| Pattern | Status | Notes |
|---|---|---|
| `ts-ignore` / `ts-expect-error` | ✅ Zero occurrences | Strict TypeScript enforced |
| Pages Router (`pages/`) | ✅ Zero occurrences | Full App Router adoption |
| `any` type assertions | ⚠️ 7 occurrences (capacity Prisma repo) | Documented with biome-ignore |
| `class-validator` / `class-transformer` | ✅ Zero occurrences | Zod used instead |
| Jest/Vitest configuration | ✅ Zero occurrences | Node `--test` runner used |
| ESLint/Prettier config | ✅ Zero occurrences | Biome used instead |
| `useEffect` for data fetching | ✅ Zero occurrences | RSC pattern used |

---

## Abandoned/Unused Dependencies

| Package | Status | Installed In | Action |
|---|---|---|---|
| `@tanstack/react-query` | ✅ In use (7 hooks, QueryProvider) | Workspace root (catalog) | Keep — used for client-side queries |
| `cmdk` | ✅ Root dep, unused directly | `package.json` root | Keep — used by shadcn Command component |
| `@sentry/nextjs` | ✅ Catalog dep, conditionally used | Workspace catalog | Keep — instrumentation.ts handles init |

---

## Recommended Tech Investments

| Investment | Reason | Effort |
|---|---|---|
| Vitest + @testing-library/react | Frontend component tests missing | Medium |
| React Compiler | Auto-optimize re-renders | Low |
| style-dictionary | Design token management | Low |
| Lighthouse CI | Performance baseline | Medium |
| Storybook | Component documentation | Medium |
| Terraform/Pulumi | Infrastructure-as-Code | High |
