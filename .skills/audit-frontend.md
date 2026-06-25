# Audit: Frontend — Pages, Data Fetching, Components, Hooks, API Client

## Purpose
Verify `@saptm/web` frontend code follows the SAPTM architecture: page structure (loading/error boundaries), data fetching patterns, component organization, hook usage, and API client patterns.

## Inputs
- `apps/web/app/`
- `apps/web/components/`
- `apps/web/hooks/`
- `apps/web/lib/`
- `apps/web/package.json`

## Execution Steps

1. **Page structure audit**:
   - Walk every route directory in `apps/web/app/` and verify presence of:
     - `page.tsx` — main page component
     - `loading.tsx` — loading/suspense boundary (Article IV §4.1.1)
     - `error.tsx` — error boundary (Article IV §4.1.2)
   - Flag any route missing `loading.tsx` or `error.tsx`.
   - Verify `not-found.tsx` exists for catch-all or dynamic route segments.
   - Confirm `layout.tsx` exists for route groups that share UI.

2. **Data fetching pattern audit**:
   - Verify server components use direct async data fetching (no `useEffect` for initial data).
   - Check that client components use TanStack Query (`@tanstack/react-query`) for client-side data fetching.
   - Ensure no `fetch` calls exist in client components without TanStack Query wrapping.
   - Validate that all data fetching functions are typed (input and output).
   - Verify that RPC calls use the generated RPC client (not raw HTTP fetch).
   - Check for proper error handling in data fetching (try/catch or TanStack Query `onError`).

3. **Component organization audit**:
   - Verify `apps/web/components/` is organized into subdirectories: `ui/`, `forms/`, `layout/`, `domain/`.
   - Check that components in `ui/` use `cva()` for variants and `tailwind-merge` for class merging (Article V §5.6).
   - Ensure design tokens are imported from `@saptm/ui/tokens`, not hardcoded values.
   - Verify that `"use client"` is only on interactive components (forms, buttons, dialogs, etc.).
   - Check that page-specific components live alongside their page (co-location), not in a shared directory.

4. **Hook usage audit**:
   - Walk `apps/web/hooks/` — every hook must be a custom React hook (`use<Name>`).
   - Verify hooks do not contain business logic (business logic belongs in RPC operations or services).
   - Ensure hooks that fetch data use TanStack Query `useQuery`/`useMutation` internally.
   - Check that hooks that manage form state use `react-hook-form` with Zod resolver.
   - Validate that auth-related hooks (`useSession`, `useUser`) come from `@saptm/auth/client`.

5. **API client pattern audit**:
   - Verify `apps/web/lib/api-client.ts` (or equivalent) wraps the generated RPC client.
   - Check that the API client automatically attaches auth tokens (via `auth()` from `@saptm/auth`).
   - Ensure the API client has request/response interceptors for error handling.
   - Validate that the base URL is read from environment (`NEXT_PUBLIC_API_URL`) with a fallback.
   - Verify that all API errors are normalized to a standard shape before reaching components.

6. **Accessibility audit**:
   - Verify every page has a skip-to-content link as the first focusable element (Article IV §4.2.2).
   - Check that all icon-only buttons have `aria-label` attributes.
   - Validate color contrast ratios meet WCAG AA standards (4.5:1 normal, 3:1 large).
   - Ensure form inputs have associated `<label>` elements or `aria-label`.

7. **Performance audit**:
   - Verify pages use `force-dynamic` for real-time logistics data (Article IV §4.3.1).
   - Check that client components are minimized and leaf-positioned in the tree.
   - Ensure images use the Next.js `Image` component with `width` and `height` or `fill`.
   - Validate that no large libraries are imported on the client side unnecessarily.

## Validation Steps
- `turbo run build --filter=@saptm/web` passes.
- `turbo run lint --filter=@saptm/web` passes (Biome).
- `turbo run typecheck --filter=@saptm/web` passes.
- Each route renders loading state, error state, and success state.
- Accessibility scan (axe-core) passes on all pages with zero violations.
- Lighthouse performance score ≥ 90 for all pages.

## Definition Of Done
- Every route has `loading.tsx` and `error.tsx` boundaries.
- Server components fetch data directly; client components use TanStack Query.
- Components are organized into `ui/`, `forms/`, `layout/`, `domain/`.
- Hooks follow `use<Name>` naming; data-fetching hooks use TanStack Query internally.
- API client is a thin wrapper around the generated RPC client with auth attachment.
- Accessibility: skip-to-content link, aria-labels, WCAG AA contrast ratios.
- Performance: `force-dynamic` on logistics routes, minimized client bundle, optimized images.

## Failure Conditions
- A route is missing `loading.tsx` or `error.tsx`.
- A client component uses raw `fetch` instead of TanStack Query.
- A component in `ui/` uses hardcoded color/spacing values instead of design tokens.
- A hook contains business logic beyond data fetching or UI state management.
- The API client does not auto-attach auth tokens or normalize errors.
- Any page has an accessibility violation (axe-core).
- `turbo run build` fails for `@saptm/web`.

## Required Reports
- `reports/audit-frontend/page-structure.json` — per-route inventory of `page.tsx`, `loading.tsx`, `error.tsx`, `layout.tsx`, `not-found.tsx`.
- `reports/audit-frontend/data-fetching.json` — categorization of data fetching per component (server direct vs TanStack Query vs raw fetch).
- `reports/audit-frontend/component-organization.json` — directory structure audit with `"use client"` justification.
- `reports/audit-frontend/hook-inventory.json` — list of hooks with purpose, data-fetching patterns, and business logic detection.
- `reports/audit-frontend/api-client.json` — API client configuration, auth attachment, error normalization.
- `reports/audit-frontend/accessibility.json` — a11y violations per page (axe-core output).
- `reports/audit-frontend/summary.json` — pass/fail per step, total violations, remediation priority.
