# fix-typescript.md

## Purpose
Resolve TypeScript compilation errors in the SAPTM monorepo by systematically diagnosing and fixing type issues across `apps/` and `packages/`.

## Inputs
- `tsc` compilation output (from `turbo run typecheck` or direct `tsc --noEmit`)
- Affected file paths and line numbers
- `tsconfig.json` hierarchy (root, apps/*, packages/*)
- Package `tsconfig.json` project references

## Execution Steps

1. **Capture tsc output**
   ```bash
   turbo run typecheck 2>&1 | tee .tsc-errors.txt
   ```
   If turbo is unavailable, run per-package:
   ```bash
   pnpm -r exec tsc --noEmit 2>&1 | tee .tsc-errors.txt
   ```

2. **Classify error patterns**
   Parse `.tsc-errors.txt` and categorize each error:
   - **Strict mode violations**: excess property checks, null/undefined assignments, implicit `any`
   - **verbatimModuleSyntax**: type imports must use `import type` or inline `type` keyword
   - **noUncheckedIndexedAccess**: indexed access requires `undefined` check
   - **exactOptionalPropertyTypes**: `?:` properties cannot be assigned `undefined` explicitly
   - **Project reference mismatches**: referenced package not built or out of date
   - **Missing exports**: symbol not exported from source package
   - **Generic constraint violations**: type argument does not satisfy constraint

3. **Verify tsconfig.json hierarchy**
   - Check root `tsconfig.json` extends/references
   - Check app/package `tsconfig.json` extends root correctly
   - Ensure `composite: true` on all referenced projects
   - Verify `outDir` and `rootDir` correctness
   - Confirm `verbatimModuleSyntax` consistent across packages
   - Confirm `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` match ARTICLE I rules

4. **Check type imports**
   ```typescript
   // WRONG (violates verbatimModuleSyntax):
   import { SomeType } from './types';
   // RIGHT:
   import { type SomeType } from './types';
   // or:
   import type { SomeType } from './types';
   ```
   - Scripts and config files in `.ts` may need `.mts` or separate tsconfig

5. **Verify generic constraints**
   - Check that generics satisfy their `extends` constraints
   - For RPC contracts, verify Zod schemas match inferred types
   - For React components, verify props satisfy component prop types

6. **Apply fixes**
   - Add/remove type annotations
   - Fix import styles
   - Add null checks for indexed access
   - Update generics to satisfy constraints
   - Rebuild referenced packages with `turbo run build --filter=<package>`

7. **Run typecheck**
   ```bash
   turbo run typecheck 2>&1
   ```
   Repeat steps 2–7 until zero errors.

## Validation Steps
- [ ] `turbo run typecheck` exits with code 0
- [ ] Biome lint passes (`turbo run lint`)
- [ ] No `// @ts-ignore` or `// @ts-expect-error` comments added (unless documented ADR exception)
- [ ] Changed files pass `git diff --check` (no whitespace errors)

## Definition Of Done
- All `tsc` errors resolved to zero
- Typecheck is clean across the entire monorepo
- No new `any` types introduced without explicit ADR
- CI typecheck gate passes

## Failure Conditions
- Fix introduces new type errors elsewhere in the monorepo
- Fix requires disabling type checking (`@ts-nocheck`, `@ts-ignore`)
- Fix relies on widening types beyond what ARTICLE I boundaries permit
- Cross-package type dependency not rebuilt after fix

## Required Reports
- `.tsc-errors.txt` — full compilation output before fix
- `typecheck-summary.md` — categorized errors found and resolution per file
- `tsconfig-audit.md` — any tsconfig.json changes made during fix
