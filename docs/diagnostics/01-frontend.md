# Diagnostic: Frontend

**Phase:** 1 — Enterprise Diagnostics
**Dimension:** Frontend Architecture & Implementation
**Date:** 2026-06-23

---

## Current State

Next.js 16 App Router with React 19, Tailwind CSS v4, and shadcn/ui components. Server components by default. TanStack Query for client-side data fetching. Portuguese locale. Sentry + PostHog for monitoring.

## Problems

1. **No unit tests for components** — Only E2E tests exist; individual components lack rendering and interaction tests.
2. **Loading/error boundaries** — Root layout has loading.tsx and error.tsx, but not all nested routes verify these exist.
3. **Bundle splitting** — No evidence of dynamic imports or lazy loading for route segments.
4. **No Storybook stories** — Storybook is configured in @saptm/ui but component stories appear incomplete.
5. **Client component boundaries** — Some pages may have excessive client component usage, defeating server component benefits.
6. **Form validation gaps** — Not all forms use react-hook-form + Zod resolver consistently.

## Technical Debt

- `apps/web/components/` has 14 directories but no barrel exports, forcing deep imports.
- Turbopack resolve aliases duplicate webpack aliases — maintenance burden.
- CSS may have unused Tailwind classes (no automated purge validation beyond build).

## Risks

- **Medium:** Missing component tests increase regression risk during UI changes.
- **Low:** Portuguese locale limits market reach without i18n expansion strategy.

## Impact

Developer velocity slows as components grow without test coverage. UI regressions may reach production undetected.

## Priority

High — Testing gap affects all frontend work.

## Recommended Actions

1. Add component rendering tests for all components in `apps/web/components/`.
2. Verify loading.tsx and error.tsx exist for all route groups.
3. Implement dynamic imports for heavy components (charts, tables, forms).
4. Create Storybook stories for all UI components.
5. Audit client/server component split and minimize client boundaries.

## Estimated Effort

5-7 days for full coverage.

## Owner Agent

frontend
