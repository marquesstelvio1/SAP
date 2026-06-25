# Audit: Performance

## Purpose
Audit the performance posture of the SAPTM web application. Verify server/client component boundaries, data fetching patterns, TanStack Query configuration, loading/error states, image optimization, and Core Web Vitals compliance.

## Inputs
- `apps/web/src/app/` — all page components and layouts
- `apps/web/src/components/` — React components
- `packages/ui/src/components/` — shared UI components
- `turbo.json` — build pipeline configuration
- `next.config.ts` — Next.js configuration
- Bundle analysis output (if available)

## Execution Steps
1. **Server/Client Component Boundaries** (Rule 4.3.2)
   - Scan all page files for `'use client'` directives.
   - Verify pages are server components by default — `'use client'` only where necessary (event handlers, browser APIs, state).
   - Check that data fetching is done in server components and passed as props to client components.
   - Confirm context providers are wrapped in a separate client component and placed high in the tree (not in every page).
   - Flag pages that use `'use client'` unnecessarily.

2. **Dynamic Rendering** (Rule 4.3.1)
   - Verify pages handling real-time logistics data use `export const dynamic = 'force-dynamic'`.
   - Check that static pages do not use `force-dynamic`.
   - Confirm `revalidate` or `fetchCache` is set appropriately for ISR pages.

3. **Data Fetching with TanStack Query** (Rule 4.3.3)
   - Open TanStack Query configuration (likely in `apps/web/src/lib/query-client.ts` or equivalent).
   - Verify `staleTime` and `gcTime` are configured with reasonable defaults:
     - `staleTime`: minimum 30s for non-critical data, 5min for reference data.
     - `gcTime`: at least 5min.
   - Check that `refetchOnWindowFocus` is enabled (default) for data that changes frequently.
   - Verify query keys follow a consistent pattern (e.g., `['resource', id]`).
   - Confirm error boundaries are set per query or per component.
   - Flag missing `staleTime` as a performance concern.

4. **Optimistic Updates & Mutations**
   - For mutation-heavy pages, verify TanStack Query mutations use `onMutate` for optimistic updates.
   - Check that rollback logic is present in `onError`.
   - Confirm `invalidateQueries` is called in `onSettled` or `onSuccess`.

5. **Loading States** (Rule 4.1.1, Rule 3.1.5)
   - Verify every page segment directory contains `loading.tsx`.
   - Check that `loading.tsx` has meaningful content (skeleton, spinner) — not empty or just "Loading...".
   - Verify `error.tsx` exists for every route segment.
   - Confirm `error.tsx` provides a retry action.
   - Check that Suspense boundaries wrap data-fetching components with fallback UI.

6. **Image Optimization** (Rule 4.3.4)
   - Scan for `<img>` tags (should use `next/image` instead).
   - Verify all `next/image` usage has:
     - Proper `width` and `height` or `fill` prop.
     - `sizes` attribute for responsive images.
     - `priority` on above-the-fold images.
     - `loading="lazy"` (default) on below-the-fold images.
   - Check `next.config.ts` has `images.formats` including `image/avif` and `image/webp`.
   - Verify remote image domains are configured in `next.config.ts`.
   - Flag bare `<img>` tags as a performance concern.

7. **Bundle Size**
   - If bundle analysis output is available, check:
     - Largest bundles and their composition.
     - Duplicate dependencies.
     - Large libraries that could be code-split.
   - Verify dynamic imports for heavy components (e.g., charts, rich text editors).
   - Check that `next/dynamic` is used instead of eager imports for client components not needed on first paint.

8. **Core Web Vitals Targets**
   - Verify the application targets:
     - **LCP**: ≤ 2.5s
     - **FID/INP**: ≤ 200ms (INP for v2)
     - **CLS**: ≤ 0.1
   - Check that fonts are preloaded with `preconnect` and `display=swap`.
   - Verify CSS is not render-blocking (critical CSS inlined).
   - Check for large layout shifts caused by missing width/height on images or embeds.

## Validation Steps
- [ ] Pages are server components by default
- [ ] `force-dynamic` only on pages that need it
- [ ] TanStack Query configured with `staleTime` and `gcTime`
- [ ] Optimistic updates implemented for mutations
- [ ] All route segments have `loading.tsx` and `error.tsx`
- [ ] Images use `next/image` with proper attributes
- [ ] Dynamic imports for heavy components
- [ ] Core Web Vitals targets documented
- [ ] Font preloading configured
- [ ] No render-blocking CSS issues

## Definition of Done
- Server/client component boundaries are correct.
- TanStack Query configuration is optimal.
- All loading and error states are implemented.
- Image optimization best practices followed.
- Bundle size is within acceptable thresholds.
- Core Web Vitals targets are achievable.
- Performance issues documented with recommendations.

## Failure Conditions
- Page uses `'use client'` unnecessarily — **P2**
- Missing `loading.tsx` or `error.tsx` on a route — **P1**
- TanStack Query missing `staleTime` globally — **P2**
- Bare `<img>` tag used instead of `next/image` — **P1**
- No font preloading — **P2**
- Core Web Vitals targets exceed recommended thresholds — **P1**
- No error boundary on data-fetching components — **P2**

## Required Reports
- `audit-performance-components.md` — server/client component analysis
- `audit-performance-data-fetching.md` — TanStack Query configuration audit
- `audit-performance-images.md` — image optimization findings
- `audit-performance-bundle.md` — bundle analysis (if available)
- `audit-performance-summary.md` — pass/fail per section
