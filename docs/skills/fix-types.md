# Skill: fix-types

**Mission:** Diagnose and fix TypeScript type errors.

**Inputs:**
- TypeScript error output
- Source files with errors
- Type definitions

**Outputs:**
- Type fix implementation
- Verification

**Workflow:**
1. Review TypeScript errors
2. Understand the type contracts
3. Fix type definitions or usage
4. Verify with `pnpm typecheck`

**Validation:**
- TypeScript typecheck passes
- No `any` used in fix
- Proper type narrowing instead of assertions

**Deliverables:**
- Type fixes
- Verification
