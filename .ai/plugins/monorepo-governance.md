# Monorepo Governance Plugin

**ID:** `monorepo-governance`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 40
**Mandatory:** true
**Runs On:** pre-implementation, post-implementation
**Blocking:** true

## Mission

Enforce monorepo governance rules, validate package boundaries, prevent unauthorized cross-package imports, and maintain dependency graph integrity.

## Validation Areas

### 1. Package Boundary Validation

Validate that package dependencies follow the defined rules:

```
@saptm/web → @saptm/auth, @saptm/config, @saptm/form, @saptm/rpc, @saptm/types, @saptm/ui
@saptm/api → @saptm/auth, @saptm/config, @saptm/database, @saptm/observability, @saptm/rpc, @saptm/types
Packages → Other packages only (never apps)
```

- [ ] No `apps/` package imports from another `apps/` package
- [ ] No `packages/` imports from `apps/` packages
- [ ] Cross-package imports use `@saptm/*` aliases
- [ ] No relative imports across package boundaries

### 2. Import Cross-Directory Detection

- [ ] `apps/web` only imports from allowed packages
- [ ] `apps/api` only imports from allowed packages
- [ ] `packages/*` only import from other `packages/*`
- [ ] No imports from `node_modules` directly (use package exports)

### 3. Dependency Graph Analysis

- [ ] Graph is acyclic (no circular dependencies)
- [ ] Build order in turbo.json is correct
- [ ] No unnecessary dependencies between packages
- [ ] No dependency duplication across packages

### 4. Workspace Configuration

- [ ] `pnpm-workspace.yaml` includes all packages
- [ ] All `package.json` files have correct `name` fields
- [ ] All `package.json` files reference workspace packages correctly
- [ ] No missing `"private": true` on packages

### 5. Build Pipeline

- [ ] `turbo.json` task graph is correct
- [ ] `dependsOn` chains are correct
- [ ] Output patterns include all build artifacts
- [ ] Cache configurations are valid

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| MG01 | critical | Circular dependency between packages |
| MG02 | error | Cross-app import |
| MG03 | error | Package importing from app |
| MG04 | error | Relative import across package boundary |
| MG05 | warning | Missing package in workspace |
| MG06 | warning | Unnecessary dependency |
| MG07 | error | Invalid turbo.json task dependency |
| MG08 | warning | Missing build output pattern |

## Output

Generate `monorepo-report.md` in `.ai/reports/`:

```markdown
# Monorepo Governance Report
**Date:** {date}

## Summary
- Status: PASS | FAIL | WARNING
- Total Packages: {n}
- Boundary Violations: {n}
- Circular Dependencies: {n}
- Workspace Issues: {n}

## Dependency Graph
{visual-graph}

## Violations
1. {rule-id} — {file} → {import} — {issue}

## Recommendations
1. {recommendation}
```

## Success Criteria

- No circular dependencies
- No cross-boundary import violations
- Build pipeline is correct
- Package boundaries respected
