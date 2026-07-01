# Pipeline Definitions

**ID:** `pipeline-definitions`
**Version:** 1.0.0

## Complete Pipeline

```
[Context Load]
     │
[Product Design] ──► docs/product/*
     │ (blocking)
[Architecture Audit] ──► architecture-report.md
     │ (blocking)
[Design System Audit] ──► design-system-report.md
[shadcn Inspector] ──► shadcn-report.md
[UI Consistency] ──► ui-consistency-report.md
     │ (non-blocking)
[Backend Implementation]
     │
[Frontend Implementation]
     │
[API Contract Validator] ──► contract-report.md
     │ (blocking)
[Frontend-Backend Validator] ──► integration-report.md
     │ (blocking)
[Testing Audit] ──► testing-report.md
     │ (blocking)
[Security Audit] ──► security-report.md
     │ (blocking)
[Performance Audit] ──► performance-report.md
     │ (non-blocking)
[Accessibility Audit] ──► accessibility-report.md
     │ (non-blocking)
[Enterprise Checklist] ──► enterprise-report.md
     │ (blocking)
[Documentation Generator] ──► docs updated
     │ (non-blocking)
[Release Readiness] ──► release-report.md
     │ (blocking)
[Workflow Enforcer] ──► workflow-status.md
     │
[RELEASE]
```

## Simplified Pipelines

### Quick Fix (not for features)
```
Context Load → Verify Bug → Fix → Test → Security Check → Doc → Deploy
```

### Documentation Update
```
Context Load → Generate Docs → Validate → Deploy
```

### Refactoring
```
Context Load → Architecture Audit → Implement → Test → Architecture Re-Audit → Doc → Deploy
```

## Agent-to-Plugins Mapping

| Execution Agent | Required Plugins |
|---|---|
| Orchestrator | context-loader, orchestrator, workflow-enforcer |
| Architect | architecture-audit, codebase-analysis, monorepo-governance, enterprise-checklist |
| Planner | product-design (initial) |
| Backend | api-contract-validator |
| Frontend | design-system-audit, shadcn-inspector, ui-consistency, frontend-backend-validator |
| Mobile | design-system-audit, ui-consistency |
| QA | testing-audit, frontend-backend-validator, enterprise-checklist |
| Git Manager | documentation-generator, release-readiness |

| Governance Agent | Responsible Plugin |
|---|---|
| Product Manager | product-design |
| Product Designer | product-design |
| Design System Architect | design-system-audit, shadcn-inspector, ui-consistency |
| Frontend Architect | design-system-audit, ui-consistency, frontend-backend-validator |
| Backend Architect | architecture-audit, api-contract-validator |
| Mobile Architect | architecture-audit |
| Security Architect | security-audit, enterprise-checklist |
| DevOps Architect | monorepo-governance, dependency-inspector, release-readiness |
| QA Architect | testing-audit, frontend-backend-validator, enterprise-checklist |
| Performance Architect | performance-audit |
| Accessibility Architect | accessibility-audit |
| Documentation Architect | documentation-generator |
