# Rule R00: Never Use `any`

**Purpose:** Prevent type safety violations that lead to runtime errors.

**Allowed:**
- `unknown` with proper type narrowing
- `never` for exhaustive checks
- `Record<string, unknown>` for dynamic objects with validation

**Forbidden:**
- `any` in function parameters, return types, or variable declarations
- `as any` type assertions
- `// @ts-ignore` to bypass type checking

**Validation:**
- Biome linter rule: `noExplicitAny`
- `pnpm lint` must pass
- TypeScript strict mode catches `any` usage

**Failure Consequences:**
- PR rejection
- Automatic CI failure

**Severity:** error
