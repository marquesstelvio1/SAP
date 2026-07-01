# Standard: TypeScript

**Phase:** 4 — Engineering Standards

---

## Required

- `strict: true` in tsconfig
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `verbatimModuleSyntax: true`
- Explicit return types on all functions
- `type` imports for type-only imports
- `readonly` on array/object props that shouldn't mutate
- Discriminated unions for state machines

## Recommended

- Use `satisfies` operator for type validation without widening
- Use `as const` for literal types and tuples
- Use `Record<K,V>` over index signatures when keys are known
- Prefer `interface` for public API contracts, `type` for unions/computed types

## Forbidden

- `any` — Use `unknown` and narrow with type guards
- `as` type assertions (use type narrowing instead)
- `// @ts-ignore` — Use `// @ts-expect-error` with justification
- `namespace` — Use ES modules
- `Function` type — Use specific function signatures
- Non-null assertion (`!`) — Use proper type narrowing
- `undefined` as a sentinel value — Use `Option` or explicit null

## Validation

- `pnpm typecheck` must pass before commit
- Biome linter catches forbidden patterns
- TypeScript strict mode in CI

## Migration

- When upgrading TS version, fix all new strict checks in one PR
- Document breaking type changes in changelog
