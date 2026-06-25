# Standard: React 19

**Phase:** 4 — Engineering Standards

---

## Required

- Functional components with hooks (no class components)
- Custom hooks for reusable logic
- Proper dependency arrays in `useEffect`, `useMemo`, `useCallback`
- `use server` and `use client` directives explicitly declared
- Server actions for form mutations
- `useActionState` for form pending states

## Recommended

- Use React Server Components for data fetching
- Use `Suspense` for async component boundaries
- Use `useOptimistic` for optimistic updates
- Use `use` for reading context and promises
- Compose small, focused components over large monolithic ones

## Forbidden

- Class components
- `UNSAFE_componentWillMount` (and similar lifecycle methods)
- Direct DOM manipulation via `document`/`window` in server components
- `useEffect` without cleanup when subscribing to events
- Mutating props or state directly

## Validation

- React strict mode in development
- No console errors in tests
- Proper cleanup in `useEffect` return functions
- TypeScript strict mode

## Migration

- React 19 codemods for breaking changes
- Test with Strict Mode before production
- Verify all third-party libraries are React 19 compatible
