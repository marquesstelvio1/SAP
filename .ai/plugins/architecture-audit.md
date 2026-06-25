# Architecture Audit Plugin

**ID:** `architecture-audit`
**Version:** 1.0.0
**Kind:** governance
**Execution Order:** 20
**Mandatory:** true
**Runs On:** pre-implementation, post-implementation
**Blocking:** true

## Mission

Analyze project structure, identify anti-patterns, validate architectural boundaries, and enforce architectural rules defined in the AGENTS.md and project ADRs.

## Audit Checklist

### 1. Project Structure Analysis

- [ ] `apps/` and `packages/` structure follows monorepo conventions
- [ ] No direct `src/` imports across packages
- [ ] All imports use `@saptm/*` workspace names
- [ ] No circular dependencies between packages
- [ ] Package dependency rules are respected

### 2. Anti-pattern Detection

- [ ] No god objects / monolithic services (max 500 lines per service)
- [ ] No business logic in controllers/handlers
- [ ] No Prisma access from controllers
- [ ] No bypass of Services layer
- [ ] No bypass of Guards layer
- [ ] No bypass of Validation Pipes
- [ ] No REST endpoints if RPC exists
- [ ] No duplicate contracts
- [ ] No parallel DTO systems

### 3. Layer Boundaries

- [ ] Controller → Service → Repository → Prisma
- [ ] RPC handlers call services (not Prisma directly)
- [ ] Services contain business logic
- [ ] Repositories handle data access only
- [ ] Guards handle authorization
- [ ] Pipes handle validation

### 4. DDD Validation

- [ ] Bounded contexts respected
- [ ] Domain logic isolated in domain modules
- [ ] Ubiquitous language used consistently
- [ ] Aggregates defined where appropriate
- [ ] Domain events used for cross-context communication

### 5. Clean Architecture Validation

- [ ] Dependency rule: outer layers depend on inner layers
- [ ] Entities/domain models are independent of frameworks
- [ ] Use case / application layer orchestrates flows
- [ ] Interface adapters convert between layers
- [ ] Frameworks and drivers are outermost

### 6. Monorepo Architecture

- [ ] Package dependency graph is acyclic
- [ ] Apps depend only on packages
- [ ] Packages depend only on other packages
- [ ] `turbo.json` task dependencies are correct
- [ ] Build order is correct

## Detection Rules

| Rule | Severity | Check |
|---|---|---|
| A01 | critical | Circular package dependency |
| A02 | error | Prisma access from controller/handler |
| A03 | error | Business logic in controller |
| A04 | error | Layer boundary violation |
| A05 | warning | Service > 500 lines |
| A06 | warning | Missing interface for service |
| A07 | error | REST endpoint when RPC exists |
| A08 | error | Missing RPC operation metadata |
| A09 | warning | Missing error handling in service |
| A10 | error | Direct database access outside repository |

## Output

Generate `architecture-report.md` in `.ai/reports/`:

```markdown
# Architecture Audit Report
**Date:** {date}
**Audited By:** {plugin}

## Summary
- Status: PASS | FAIL | WARNING
- Total Rules Checked: {n}
- Violations: {n}
- Critical: {n}
- Errors: {n}
- Warnings: {n}

## Violations

### {rule-id} — {severity}
**File:** {file}:{line}
**Issue:** {description}
**Recommendation:** {fix}

## Recommendations
1. {recommendation}
```

## Success Criteria

- No critical violations
- All layer boundaries respected
- Package dependency graph is acyclic
- Architecture matches documented design

## Blocking Rules

If any critical (A01) or error (A02-A04, A07-A08, A10) violation is found:
- BLOCK implementation
- Require fixes before proceeding
