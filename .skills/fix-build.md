---
name: fix-build
description: Build fix skill for resolving compilation and bundling failures in the SAPTM monorepo. Covers TypeScript errors, dependency resolution, Turbopack/Webpack issues, and validation gates.
metadata:
  origin: SAPTM CONSTITUTION — Article III, VIII
---

# Fix: Build

Systematic approach to diagnose and resolve build failures in the SAPTM monorepo.

## Purpose

Quickly identify the root cause of a build failure and apply a targeted fix, ensuring all validation gates pass before proceeding.

## Inputs

- Build error output from `turbo run build` or CI logs
- `turbo.json` task pipeline configuration
- `tsconfig.json` files for affected packages
- `pnpm-lock.yaml` for dependency resolution issues
- CI validation gate logs (if applicable)

## Execution Steps

### Step 1 — Read Error Output
1. Capture the full build output. Never rely on truncated logs.
2. Identify the first error in the output — subsequent errors are often cascading.
3. Note the package where the failure occurred (`@saptm/api`, `@saptm/web`, `@saptm/rpc`, etc.).
4. Note the build tool that produced the error (TypeScript compiler, Turbopack, Webpack, NestJS, Next.js).

### Step 2 — Identify Failed Package
1. Run `turbo run build --filter=<package> --dry` to confirm the affected package and its dependencies.
2. Check if the failure is in the package itself or a dependency.
3. If a dependency failed, fix that first (build is bottom-up).

### Step 3 — Check TypeScript Errors
1. Run `turbo run typecheck --filter=<failed-package>` to isolate TypeScript errors.
2. Common issues:
   - Type mismatch between RPC contract inputs and controller types.
   - Missing export from a workspace package.
   - `strictNullChecks` violation.
   - Incorrect generic parameter.
   - Import from another package's `src/` instead of `@saptm/*` (1.1.2 violation).
3. Fix each error. Re-run `turbo run typecheck` until clean.

### Step 4 — Verify Dependency Resolution
1. Check if the error mentions missing modules or packages.
2. Verify the dependency is listed in the package's `package.json`.
3. Verify the dependency exists in `pnpm-workspace.yaml` catalog if shared (1.1.4).
4. Run `pnpm install` to ensure lockfile is up to date.
5. If using `@saptm/*` workspace reference, verify the package name matches `name` field in its `package.json`.
6. Check for circular dependency errors (1.3.6).

### Step 5 — Check Turbopack/Webpack Issues
1. If the error is from Next.js build:
   - Check `next.config.js` for misconfiguration.
   - Look for module resolution failures in Turbopack.
   - Verify `app/` directory structure follows Next.js conventions.
   - Check for invalid server/client component boundaries.
2. If the error is from NestJS build:
   - Check `nest-cli.json` for compiler options.
   - Verify `tsconfig.build.json` includes all source files.
   - Look for decorator-related compilation errors.

### Step 6 — Fix
1. Apply targeted fix based on root cause identified above.
2. Do not apply speculative fixes — confirm root cause first.
3. If the fix involves a workspace package change, rebuild all dependents:
   `turbo run build --filter=<package>...`

### Step 7 — Run Typecheck
1. `turbo run typecheck --filter=<affected-package>`
2. If multiple packages are affected: `turbo run typecheck`
3. Confirm zero TypeScript errors.

### Step 8 — Verify Build Passes
1. `turbo run build --filter=<affected-package>`
2. If the initial error was in a dependent package: `turbo run build --from=<failed-package>`
3. Run full build: `turbo run build`
4. Confirm exit code 0.

## Validation Steps

- [ ] Root cause identified from error output (Step 1)
- [ ] Failed package and dependency chain understood (Step 2)
- [ ] All TypeScript errors resolved (Step 3)
- [ ] Dependencies correctly resolved (Step 4)
- [ ] Bundler-specific issues fixed (Step 5)
- [ ] `turbo run typecheck` passes (Step 7)
- [ ] `turbo run build` passes (Step 8)

## Definition of Done

- Build completes successfully (`turbo run build` exits 0).
- No TypeScript errors in any package.
- All CI validation gates pass.
- If the build failure was caused by a code change, the fix commit references the original issue.
- If the fix involved a dependency change, `pnpm-lock.yaml` is updated.

## Failure Conditions

- Root cause not identified after reading full logs → escalate to human lead.
- TypeScript errors remain after 3 fix attempts → check for broader type misalignment.
- Dependency resolution failure persists → verify catalog entries in `pnpm-workspace.yaml`.
- Build succeeds locally but fails in CI → check environment differences (Node version, OS, env vars).
- Fix introduces new test failures → roll back fix and re-approach.
- Circular dependency detected → requires ADR for architectural change (1.1.5).

## Required Reports

- Root cause analysis summary (1–3 sentences identifying the failure).
- Packages affected and changes made.
- Build logs confirming successful build.
- CI validation gate status.
