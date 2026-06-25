# Skill: fix-build

**Mission:** Diagnose and fix build failures.

**Inputs:**
- Build error output
- Package.json and tsconfig files
- Turbo.json configuration

**Outputs:**
- Root cause analysis
- Fix implementation
- Verification

**Workflow:**
1. Reproduce build failure
2. Analyze error output
3. Check dependency graph
4. Check TypeScript configuration
5. Fix identified issues
6. Verify with `pnpm build`

**Validation:**
- Build succeeds
- No new errors introduced
- Root cause documented

**Deliverables:**
- Build fix
- Root cause documentation
