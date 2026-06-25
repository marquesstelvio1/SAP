# Dependency Inspector Plugin

**ID:** `dependency-inspector`
**Version:** 1.0.0
**Kind:** analysis
**Execution Order:** 35
**Mandatory:** false
**Runs On:** pre-implementation, post-implementation
**Blocking:** false

## Mission

Inspect all dependencies in the monorepo, detect version conflicts, outdated packages, unused dependencies, and potential security issues.

## Inspection Areas

### 1. Root Dependencies (`package.json`)

- [ ] All dependencies audited
- [ ] No unused devDependencies
- [ ] No left-over dependencies from removed features
- [ ] Scripts are valid and documented

### 2. Workspace Dependencies (`pnpm-workspace.yaml`)

- [ ] All workspace packages referenced correctly
- [ ] No missing workspace references
- [ ] No packages outside catalog versioning
- [ ] Version catalog is source of truth

### 3. Version Conflicts

- [ ] No multiple versions of same package
- [ ] No peer dependency mismatches
- [ ] Engine requirements satisfied
- [ ] TypeScript version consistent across packages

### 4. Outdated Dependencies

- [ ] Major versions up-to-date (check against latest)
- [ ] Deprecated packages identified
- [ ] Unmaintained packages flagged
- [ ] Security advisories checked

### 5. Unused Dependencies

- [ ] Dependencies not imported anywhere
- [ ] DevDependencies not used in scripts/tests
- [ ] Type packages for unused dependencies

### 6. Bundle Impact

- [ ] Large dependencies identified (> 500KB)
- [ ] Tree-shakeable alternatives suggested
- [ ] Duplicate dependencies across packages

## Detection Rules

| Rule | Severity | Description |
|---|---|---|
| DI01 | error | Security vulnerability |
| DI02 | warning | Version conflict |
| DI03 | warning | Deprecated package |
| DI04 | info | Unused dependency |
| DI05 | info | Outdated major version |
| DI06 | warning | Large bundle impact |
| DI07 | error | Engine requirement mismatch |
| DI08 | info | Unused devDependency |

## Output

Generate `dependency-report.md` in `.ai/reports/`:

```markdown
# Dependency Inspector Report
**Date:** {date}

## Summary
- Total Dependencies: {n}
- Security Issues: {n}
- Version Conflicts: {n}
- Outdated: {n}
- Unused: {n}

## Security Issues
1. {package}@{version} — {advisory}

## Version Conflicts
1. {package}: {version} in {pkg-a} vs {version} in {pkg-b}

## Recommendations
1. {recommendation}
```

## Success Criteria

- No security vulnerabilities
- No version conflicts
- All unused dependencies identified
- Version catalog is consistent
