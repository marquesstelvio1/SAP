# Feature Delivery Workflow

**ID:** `feature-delivery`
**Version:** 1.0.0
**Trigger:** new-feature-task

## Pipeline Stages

### Stage 0: Context Load
**Plugin:** context-loader
**Input:** Task description
**Output:** Loaded context

Load all project context, AGENTS.md, AI config, memory, and past decisions.

### Stage 1: Product Design
**Plugin:** product-design
**Input:** Feature requirements
**Output:** `docs/product/vision.md`, `docs/product/personas.md`, `docs/product/user-flows.md`, `docs/product/sitemap.md`, `docs/product/wireframes.md`, `docs/product/requirements.md`
**Blocking:** Yes
**Agent:** Product Manager, Product Designer

### Stage 2: Architecture Audit
**Plugin:** architecture-audit
**Input:** Feature requirements + product docs
**Output:** `architecture-report.md`
**Blocking:** Yes
**Agent:** Architect

### Stage 3: Design System Audit
**Plugin:** design-system-audit, shadcn-inspector, ui-consistency
**Input:** Wireframes + UI requirements
**Output:** `design-system-report.md`, `shadcn-report.md`, `ui-consistency-report.md`
**Blocking:** No
**Agent:** Design System Architect, Frontend Architect

### Stage 4: Backend Implementation
**Plugin:** (execution)
**Input:** Approved contracts + architecture
**Output:** Backend code
**Agent:** Backend

### Stage 5: Frontend Implementation
**Plugin:** (execution)
**Input:** Approved contracts + design system
**Output:** Frontend code
**Agent:** Frontend

### Stage 6: API Contract Validation
**Plugin:** api-contract-validator
**Input:** Backend implementation
**Output:** `contract-report.md`
**Blocking:** Yes
**Agent:** Backend Architect, Frontend Architect

### Stage 7: Frontend-Backend Validation
**Plugin:** frontend-backend-validator
**Input:** Frontend + backend implementation
**Output:** `integration-report.md`
**Blocking:** Yes
**Agent:** QA Architect

### Stage 8: Testing Audit
**Plugin:** testing-audit
**Input:** All code
**Output:** `testing-report.md`
**Blocking:** Yes
**Agent:** QA Architect

### Stage 9: Security Audit
**Plugin:** security-audit
**Input:** All code
**Output:** `security-report.md`
**Blocking:** Yes
**Agent:** Security Architect

### Stage 10: Performance Audit
**Plugin:** performance-audit
**Input:** All code
**Output:** `performance-report.md`
**Blocking:** No
**Agent:** Performance Architect

### Stage 11: Accessibility Audit
**Plugin:** accessibility-audit
**Input:** Frontend code
**Output:** `accessibility-report.md`
**Blocking:** No
**Agent:** Accessibility Architect

### Stage 12: Enterprise Checklist
**Plugin:** enterprise-checklist
**Input:** All reports
**Output:** `enterprise-report.md`
**Blocking:** Yes
**Agent:** Architect, QA Architect, Security Architect

### Stage 13: Documentation
**Plugin:** documentation-generator
**Input:** All changes
**Output:** Updated docs
**Blocking:** No
**Agent:** Documentation Architect

### Stage 14: Release Readiness
**Plugin:** release-readiness
**Input:** All reports + docs
**Output:** `release-report.md`
**Blocking:** Yes
**Agent:** Architect

### Stage 15: Workflow Enforce
**Plugin:** workflow-enforcer
**Input:** Pipeline state
**Output:** `workflow-status.md`
**Blocking:** Yes

## Rollback Plan

If any stage fails:
1. Report failure with full context
2. List all gaps found
3. Propose corrections
4. Implement fixes
5. Re-run from failed stage
6. Continue pipeline

## Exit Criteria

- [x] All blocking stages pass
- [x] Reports generated for all stages
- [x] Documentation updated
- [x] Release readiness approved
- [x] Pipeline status: COMPLETED
