# Standard: Next.js 16

**Phase:** 4 — Engineering Standards

---

## Required

- App Router only — no Pages Router
- Server components by default; client components only when interactivity needed
- `loading.tsx` and `error.tsx` for every route segment
- `not-found.tsx` for dynamic routes
- `generateMetadata` for all pages with dynamic content
- `typedRoutes: true` in next.config
- `output: "standalone"` for Docker builds
- Security headers via `async headers()` in next.config

## Recommended

- Use `force-dynamic` for real-time data pages
- Use `next/image` for all images with explicit dimensions
- Use `next/link` for client-side navigation
- Leverage React Server Components for data fetching
- Use `server-only` and `client-only` packages explicitly
- Use `use cache` for heavy server computations

## Forbidden

- `getServerSideProps`, `getStaticProps` — App Router patterns only
- Direct database access from client components
- Importing server code in client components
- `useEffect` for data fetching — Use TanStack Query
- Fetching in client components when server components suffice

## Validation

- Build must succeed (`pnpm build`)
- TypeScript typecheck on all pages
- E2E tests for all critical user journeys

## Migration

- When upgrading Next.js, run codemods first
- Test bundle size with `ANALYZE=true next build`
- Verify all security headers with a header checker
