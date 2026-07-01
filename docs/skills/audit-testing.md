# Skill: audit-testing

**Mission:** Audit testing coverage and quality across the entire monorepo.

**Inputs:**
- All test files in apps/, packages/, tests/
- Test configuration files

**Outputs:**
- Testing gap analysis
- Coverage metrics
- Test improvement plan

**Workflow:**
1. Count test files per package/app
2. Identify packages/modules without tests
3. Review test quality (assertions, edge cases)
4. Measure coverage (if c8 reports available)
5. Generate testing roadmap

**Validation:**
- Every package and app audited
- Specific gaps identified with file paths
- Prioritized improvement plan

**Deliverables:**
- Testing diagnostic section in docs/diagnostics/
- Test improvement tasks in roadmap
