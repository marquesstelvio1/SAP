---
name: implementation-ui
description: UI implementation skill focused on frontend component and page creation for @saptm/web (Next.js). Covers design tokens, server components, accessibility, dark mode, and structural tests.
metadata:
  origin: SAPTM CONSTITUTION — Article IV, V
---

# Implementation: UI

Frontend component and page creation workflow for the SAPTM monorepo's Next.js web application.

## Purpose

Build accessible, performant, and visually consistent UI components and pages using the SAPTM design system. Ensures every route has loading/error states, keyboard navigation, dark mode support, and proper data fetching patterns.

## Inputs

- Design mockup, component spec, or feature requirement
- Existing page/component to reference in `apps/web/src/app/` or `packages/ui/src/components/`
- Design tokens from `@saptm/ui/tokens`
- AGENTS.md constitutional rules (Articles IV, V)

## Execution Steps

### Step 1 — Review Design Tokens
1. Read semantic color tokens: `--primary`, `--muted`, `--destructive`, etc. (5.3).
2. Read spacing tokens: `--space-{0-32}` (5.2).
3. Read density tokens: comfortable (default), compact, operational (5.4).
4. Read elevation tokens: `--shadow-{panel,overlay,command,sticky}` (5.5).
5. Never hardcode values — always use token references (5.1).

### Step 2 — Check Existing Components
1. Browse `packages/ui/src/components/` for existing components that can be reused or extended.
2. Check shadcn/ui registry if a base component exists (5.6).
3. Review `packages/ui/src/components/__tests__/` for test patterns.
4. If extracting a new component, verify it doesn't duplicate existing functionality.

### Step 3 — Create or Extract Component
1. Use `cva()` for variant-based styling (5.6).
2. Use `tailwind-merge` for class merging (5.6).
3. Use `clsx` or `cn` utility for conditional classes.
4. Follow shadcn/ui composition patterns.
5. If the component is reusable, place it in `packages/ui/src/components/`.
6. If page-specific, colocate in `apps/web/src/app/<feature>/_components/`.

### Step 4 — Add Loading and Error Boundaries
1. Create `apps/web/src/app/<feature>/loading.tsx` — must exist per 4.1.1.
   - Use Suspense boundaries for granular loading states.
   - Show skeleton UI matching the page layout.
2. Create `apps/web/src/app/<feature>/error.tsx` — must exist per 4.1.2.
   - Show error message with retry action.
   - Log error details for debugging.
3. Empty states must be informative with actionable next steps (4.1.3).
4. Success/failure feedback via sonner toasts (4.1.5).

### Step 5 — Implement Data Fetching
1. Create data access layer in `apps/web/lib/<feature>.ts`.
2. Server components fetch data directly — no `useEffect` for initial load (4.3.2, 4.3.3).
3. Use `force-dynamic` on pages with real-time logistics data (4.3.1).
4. Client components use TanStack Query for caching and refetching (4.3.3).
5. Forms show inline validation and server error feedback (4.1.4).

### Step 6 — Add Keyboard Navigation
1. All interactive elements must be keyboard accessible (4.2.3).
2. Add skip-to-content link at the top of every page (4.2.2).
3. Use proper `tabIndex` order.
4. Support Enter and Space keys for custom interactive elements.
5. Use `role` and `aria-*` attributes correctly.

### Step 7 — Verify Dark Mode
1. Test component in both light and `.dark` class mode (5.7).
2. Use `next-themes` for theme toggling.
3. Verify color contrast meets WCAG AA ratios: 4.5:1 normal text, 3:1 large text (4.2.4).
4. Verify all token references resolve correctly in dark mode.

### Step 8 — Write Structural Tests
1. Create `packages/ui/src/components/__tests__/<component>.test.mjs`.
2. Use `node --test` runner (3.2.1).
3. Test:
   - Component renders without errors
   - Variants render correctly
   - Keyboard interactions work
   - ARIA attributes are present on icon-only buttons (4.2.5)
   - Dark mode class does not break layout
4. Run `node --test packages/ui/src/components/__tests__/<component>.test.mjs`.

### Step 9 — Run Linter and Typecheck
1. `turbo run lint` (Biome — per 8.5).
2. `turbo run typecheck --filter=@saptm/web`.
3. `turbo run typecheck --filter=@saptm/ui`.

## Validation Steps

- [ ] Design tokens referenced, not hardcoded (Step 1)
- [ ] Component does not duplicate existing functionality (Step 2)
- [ ] Component uses `cva()` and `tailwind-merge` (Step 3)
- [ ] `loading.tsx` and `error.tsx` boundaries present (Step 4)
- [ ] Data fetching follows server component + TanStack Query pattern (Step 5)
- [ ] Keyboard navigation verified (Step 6)
- [ ] Dark mode verified with WCAG AA contrast (Step 7)
- [ ] Structural tests exist and pass (Step 8)
- [ ] Lint and typecheck pass (Step 9)

## Definition of Done

- All validation steps checked.
- Design System agent reviews UI changes (Article X, 10.5).
- Component renders correctly in light and dark mode.
- All interactive elements are keyboard accessible.
- Page passes axe-core accessibility audit.
- PR validation gates pass.

## Failure Conditions

- Hardcoded color/spacing/elevation values found → replace with design tokens.
- Component fails accessibility checks → fix before proceeding.
- Missing `loading.tsx` or `error.tsx` → block.
- Dark mode breaks component layout or contrast → fix before proceeding.
- Client component used where server component suffices (4.3.2 violation) → refactor.
- Lint or typecheck errors → fix before merging.

## Required Reports

- Accessibility audit results (axe-core or similar).
- Dark mode verification notes (screenshots or test results).
- Component API documentation if a new reusable component was added to `@saptm/ui`.
- Test results for structural rendering tests.
