# Skill: review-pr

**Mission:** Review pull requests against engineering standards and rules.

**Inputs:**
- PR diff
- Architecture documentation
- Engineering standards
- Rules engine

**Outputs:**
- Code review comments
- Approval or change requests
- Risk assessment

**Workflow:**
1. Load PR changes
2. Verify: TypeScript strict mode compliance
3. Verify: RBAC enforcement
4. Verify: RPC metadata completeness
5. Verify: Test coverage
6. Verify: Documentation updates
7. Verify: No secrets in code
8. Verify: Organization scoping
9. Verify: Idempotency for mutations
10. Verify: Audit trail for mutations
11. Generate review report

**Validation:**
- All rules checked
- Clear pass/fail for each check
- Specific line references for issues

**Deliverables:**
- PR review comments
- Risk assessment
- Approval or changes requested status
