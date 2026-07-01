# Skill: audit-enterprise

**Mission:** Perform complete enterprise-grade engineering audit across all dimensions.

**Inputs:**
- Repository analysis (docs/discovery/)
- Architecture docs (docs/architecture/)

**Outputs:**
- Diagnostic reports (docs/diagnostics/)
- Executive summary with prioritized findings

**Workflow:**
1. Load repository analysis
2. Analyze frontend, backend, database, auth, RBAC, multi-tenancy, security, performance, testing, observability, accessibility, design system, CI/CD, DX
3. Generate individual diagnostic reports
4. Generate executive summary with priority matrix

**Validation:**
- All 14 dimensions covered
- Each finding has: Current State, Problem, Technical Debt, Risk, Impact, Priority, Action, Effort, Owner
- Executive summary has: Critical/High/Medium prioritization

**Deliverables:**
- docs/diagnostics/01-frontend.md through 14-developer-experience.md
- docs/diagnostics/executive-summary.md
