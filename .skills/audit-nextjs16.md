# Audit: Next.js 16

## Purpose
Verify `@saptm/web` complies with Next.js 16 conventions, App Router patterns, server/client component architecture, Turbopack compatibility, metadata API usage, and standalone output configuration.

## Inputs
- `apps/web/next.config.ts`
- `apps/web/app/`
- `apps/web/components/`
- `apps/web/tsconfig.json`
- `apps/web/package.json`

## Execution Steps

1. **App Router compliance**: Walk `apps/web/app/` — verify all routes use `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` naming. Flag any `pages/` directory or `_app.tsx`/`_document.tsx` vestiges.

2. **Server/client component architecture**:
   - Check every component file for `"use client"` directive — ensure it only appears when absolutely required (hooks, event handlers, browser APIs, context providers).
   - Validate that data fetching components are server components (no `"use client"`).
   - Ensure client components are leaves in the component tree, never ancestors of server components.

3. **Turbopack compatibility audit**:
   - Review `next.config.ts` — ensure `output: "standalone"` is set for production builds.
   - Check for any webpack-only loaders or plugins incompatible with Turbopack.
   - Verify `experimental` flags align with Next.js 16 stable APIs (remove any flagged as removed in v16).
   - Audit middleware (`middleware.ts`) for Edge Runtime compatibility.

4. **Metadata API audit**:
   - Verify all pages use the `generateMetadata` export or exported `metadata` object (not `next/head` or `<Head>`).
   - Ensure `generateMetadata` is async when metadata depends on `params` or `searchParams`.
   - Check `metadataBase` is configured in the root layout.
   - Validate `openGraph` and `twitter` images use absolute URLs (resolved from `metadataBase`).

5. **Standalone output configuration**:
   - Confirm `output: "standalone"` is set in `next.config.ts`.
   - Verify `.env` files are not bundled into the standalone output.
   - Ensure `public/` directory has a health-check marker file for deployment probes.

6. **Image and font optimization**:
   - Check all `<img>` tags use the Next.js `Image` component from `next/image`.
   - Verify `next/font` is used (no external font CSS imports).
   - Ensure remote images have `remotePatterns` configured in `next.config.ts`.

7. **TypeScript project references**:
   - Verify `apps/web/tsconfig.json` references `packages/*` correctly via project references.
   - Ensure path aliases (`@saptm/*`) resolve to workspace packages, not relative paths.

## Validation Steps
- `turbo run build --filter=@saptm/web` passes.
- `turbo run lint --filter=@saptm/web` passes.
- `turbo run typecheck --filter=@saptm/web` passes.
- No deprecated Next.js APIs in build output warnings.
- Build output produces `.next/standalone/` directory.
- All routes render in production build without hydration errors.

## Definition Of Done
- All files use App Router conventions (`page.tsx`, `layout.tsx`, etc.).
- `"use client"` directives are minimal and justified.
- `next.config.ts` has `output: "standalone"` and no deprecated flags.
- Metadata API is used consistently across all pages.
- Turbopack compiles the dev server without warnings.
- All images use `next/image` with proper configuration.
- `next/font` is used exclusively for font loading.

## Failure Conditions
- Any `pages/` directory or legacy page file found.
- A server component contains browser-only code without a client boundary.
- `output: "standalone"` is missing from `next.config.ts`.
- `metadataBase` is unset or uses a relative URL.
- Turbopack build emits incompatibility warnings.
- Remote image domains are missing from `remotePatterns`.
- `turbo run build` fails for `@saptm/web`.

## Required Reports
- `reports/audit-nextjs16/violations.json` — structured list of files/patterns that fail audit.
- `reports/audit-nextjs16/metadata-coverage.json` — per-route metadata export status (present, missing, invalid).
- `reports/audit-nextjs16/component-architecture.json` — categorized list of server vs client components with justification for client directives.
- `reports/audit-nextjs16/summary.json` — pass/fail status per execution step, total violation count, remediation priority (critical/high/medium/low).
