# Audit: Monorepo Governance

## Purpose
Audit the SAPTM monorepo governance, build system, and dependency management. Verify catalog versioning, package dependency integrity, turborepo pipeline configuration, TypeScript project references, and monorepo structural rules.

## Inputs
- `pnpm-workspace.yaml` — workspace and catalog definitions
- `turbo.json` — task pipeline configuration
- `tsconfig.json` (root and all packages) — TypeScript project references
- `package.json` (root and all packages)
- `apps/` and `packages/` directory structure
- `.npmrc` — package manager configuration
- `packageManager` field in root `package.json`

## Execution Steps
1. **Catalog Versioning** (Rule 1.1.4)
   - Open `pnpm-workspace.yaml`.
   - Verify `catalog` or `catalogs` section exists and defines shared dependency versions.
   - Check that commonly shared dependencies are in the catalog (TypeScript, React, Next.js, NestJS, Zod, Biome, Tailwind, shadcn, TanStack Query, Playwright, etc.).
   - Scan all `package.json` files for hardcoded dependency versions that should use `catalog:` protocol.
   - Confirm no dependency is pinned to a version outside the catalog without explicit ADR approval.
   - Flag missing catalog entries as P2, hardcoded versions as P1.

2. **Package Dependency Rules** (Rule 1.1.2, 1.1.5, 8.2)
   - Verify no package imports from another package's `src/` directory directly.
   - Confirm all cross-package imports use `@saptm/*` workspace references.
   - Check that dependencies between packages follow the allowed hierarchy:
     - `@saptm/database` → `@saptm/config`
     - `@saptm/rpc` → `@saptm/auth`
     - `@saptm/api` → `@saptm/database`, `@saptm/rpc`, `@saptm/auth`, `@saptm/config`
     - `@saptm/web` → `@saptm/ui`, `@saptm/rpc`, `@saptm/config`
     - `@saptm/observability` → `@saptm/config`
   - Verify no dependency is added outside the catalog without explicit ADR approval (Rule 1.1.5).
   - Flag direct `src/` imports as P0.

3. **Circular Dependencies** (Rule 1.3.6)
   - Run `pnpm ls --depth=1` or equivalent to inspect dependency graph.
   - Check for circular dependencies between packages (e.g., `@saptm/auth` → `@saptm/rpc` → `@saptm/auth`).
   - Verify the import graph is a DAG.
   - Use Madge or similar tool to detect cycles if available.
   - Flag any circular dependency as P0.

4. **Turborepo Pipeline** (Rule 8.1)
   - Open `turbo.json`.
   - Verify `pipeline` defines the following tasks:
     - `build` — depends on `^build` (topological), outputs `dist/**`
     - `test` — depends on `build`, outputs nothing
     - `lint` — depends on nothing, outputs nothing
     - `typecheck` — depends on `^build`, outputs nothing
     - `dev` — depends on nothing, cache disabled
   - Check that `ui` package has `build` task with declared outputs.
   - Verify `@saptm/web` dev command is correct (Next.js dev server).
   - Confirm `@saptm/api` dev command is correct (NestJS watch mode).
   - Verify `outputs` are correctly specified for caching.
   - Check `inputs` for each task (e.g., `build` depends on `src/**`, `tsconfig.json`).
   - Flag missing pipeline tasks as P2.

5. **PR Validation Pipeline** (Rule 3.3.1)
   - Verify `turbo.json` defines the PR validation sequence: `lint` → `typecheck` → `test` → `build`.
   - Check that these tasks run in order (uses `dependsOn`).
   - Confirm `--filter` or `--affected` is used to scope CI runs.
   - Flag missing or out-of-order pipeline as P2.

6. **TypeScript Project References** (Rule 1.1.3)
   - Open root `tsconfig.json`.
   - Verify `references` array includes all packages.
   - For each package, open its `tsconfig.json` and verify:
     - `composite: true` is set.
     - `declaration: true` is set.
     - `declarationMap: true` is set.
     - `outDir` points to `dist` or similar.
     - `rootDir` points to `src`.
     - `paths` map `@saptm/*` correctly.
   - Check no package has `references` that would create a cycle.
   - Flag missing `composite: true` as P2.

7. **Package Configuration**
   - Verify every `package.json` has:
     - Correct `name` (`@saptm/*`).
     - `private: true` for unpublished packages (Rule 8.4).
     - `scripts` matching turbo pipeline tasks.
     - `exports` or `main`/`module`/`types` fields pointing to build output.
   - Check that unpublished apps (`@saptm/api`, `@saptm/web`) are ignored in changeset config (Rule 8.4).
   - Verify `packageManager` field is set in root `package.json`.

8. **Changesets** (Rule 8.3)
   - Verify `.changeset/config.json` exists and is properly configured.
   - Check that `commit: true` or appropriate commit message template is set.
   - Confirm `access: public` or `restricted` as appropriate.
   - Verify unpublished packages are ignored.

## Validation Steps
- [ ] Catalog defined in `pnpm-workspace.yaml`
- [ ] No hardcoded versions outside catalog without ADR
- [ ] No direct `src/` imports across packages
- [ ] No circular dependencies in package graph
- [ ] Turbo pipeline includes all required tasks with correct dependencies
- [ ] PR validation sequence: lint → typecheck → test → build
- [ ] All packages have `composite: true` in tsconfig
- [ ] Root tsconfig references all packages
- [ ] All package.json files have correct names and scripts
- [ ] Changesets configured correctly
- [ ] Unpublished apps excluded from changelogs

## Definition of Done
- Catalog versioning is complete and all packages use catalog references.
- Package dependency graph is acyclic and follows allowed hierarchy.
- Turborepo pipeline is correctly configured with all required tasks.
- TypeScript project references are correctly set up.
- Changeset configuration is production-ready.

## Failure Conditions
- Direct `src/` import between packages — **P0**
- Circular dependency detected — **P0**
- Hardcoded version outside catalog without ADR — **P1**
- Missing `composite: true` on a package tsconfig — **P2**
- Missing pipeline task in `turbo.json` — **P2**
- Package dependency violates allowed hierarchy — **P1**

## Required Reports
- `audit-monorepo-catalog.md` — catalog coverage and adherence
- `audit-monorepo-dependencies.md` — dependency graph analysis
- `audit-monorepo-turbo.md` — pipeline configuration audit
- `audit-monorepo-tsconfig.md` — TypeScript project references audit
- `audit-monorepo-summary.md` — pass/fail per section
