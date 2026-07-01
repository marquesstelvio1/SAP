# FASE 2 — TypeScript Gate Report

**Status:** ✅ PASS
**Date:** 2026-06-23
**Command:** `pnpm typecheck`

## Result
- **Total packages:** 13
- **Successful:** 21/21 tasks
- **Exit code:** 0

## Issues Fixed

### P5 — `@storybook/react` missing from `@saptm/ui` (CRITICAL)
- **Root cause:** `@storybook/react` was not installed as a dependency; 11 story files could not resolve the module
- **Fix:** Added `@storybook/react@^8.6.18` as devDependency in `packages/ui/package.json`
- **Bonus fix:** Removed unused `Fragment` import in `breadcrumb.stories.tsx`

### P1 — `@saptm/rpc` billing exports broken (CRITICAL)
- **Root cause:** `packages/rpc/src/billing.ts` had names that didn't match `packages/rpc/src/index.ts` re-exports
- **Fix:** Rewrote `billing.ts` to export all required names:
  - Added type aliases: `BillingInvoice`, `BillingSubscription`, `BillingUsage`, `BillingPlan`, `BillingPlansOutput`, `CreateCheckoutSessionInput`, `CreateCheckoutSessionOutput`, `CreatePortalSessionInput`, `CreatePortalSessionOutput`
  - Added schema aliases: `createCheckoutSessionInputSchema`, `createCheckoutSessionOutputSchema`, `createPortalSessionInputSchema`, `createPortalSessionOutputSchema`, `billingPlansOutputSchema`, `planSchema`, `invoiceSchema`, `subscriptionSchema`, `usageSchema`
  - Added metadata aliases: `billingCreateCheckoutSessionMetadata`, `billingCreatePortalSessionMetadata`
  - Added `billingPlansMetadata` (was missing)
  - Added missing schemas: `planSchema`, `billingPlansOutputSchema`

### P2 — `@saptm/form` not resolvable from `@saptm/web` (CRITICAL)
- **Root cause:** `packages/form` had no `build` or `typecheck` scripts, wrong `exports` pointing to `src/`, and missing `pnpm install` (workspace links not created)
- **Fix:**
  - Added `build` and `typecheck` scripts to `packages/form/package.json`
  - Updated exports from `./src/index.ts` to proper `dist/` output format
  - Fixed tsconfig `extends` from `@saptm/tsconfig/base.json` to `../tsconfig/base.json`
  - Ran `pnpm install` to create workspace links

### P3 — `zod` not resolvable from `@saptm/web` (CRITICAL)
- **Root cause:** Same as P2 — `pnpm install` hadn't been run after workspace changes
- **Fix:** Resolved by `pnpm install`

### Web billing page type errors
- Fixed null handling: `periodStart`/`periodEnd`/`currentPeriodStart`/`currentPeriodEnd` are `string | null`; added null guards before `new Date()`
- Fixed usage iteration: `BillingUsage` has nested `.metrics` array; flattened with `flatMap` and computed `percentage` inline

## Summary of Changes
| Package | Changes |
|---|---|
| `packages/ui` | Added `@storybook/react` devDependency; removed unused `Fragment` import |
| `packages/rpc/src/billing.ts` | Rewrote with all required exports, aliases, and missing schemas/metadata |
| `packages/form` | Added build/typecheck scripts, fixed exports format, fixed tsconfig extends |
| `apps/web` | Fixed billing page null date handling and usage iteration |

## Gate Criteria
- `pnpm typecheck` returns exit code 0 → ✅
- No `any`, no `@ts-ignore`, no `@ts-nocheck` → ✅
- All packages passing typecheck independently → ✅
