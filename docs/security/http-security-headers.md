# HTTP Security Headers

## Purpose

HTTP security headers define the minimum browser and API response hardening required before any
business feature is exposed.

## API Headers

`apps/api` applies headers in the NestJS bootstrap before CORS and route handlers.

| Header | Purpose |
| --- | --- |
| `Content-Security-Policy` | API responses do not load browser resources |
| `Strict-Transport-Security` | Enforce HTTPS after first secure request |
| `X-Content-Type-Options` | Prevent MIME sniffing |
| `X-Frame-Options` | Block clickjacking |
| `Referrer-Policy` | Reduce referrer leakage |
| `Permissions-Policy` | Disable unnecessary browser capabilities |
| `Cross-Origin-Opener-Policy` | Isolate browsing context |
| `Cross-Origin-Resource-Policy` | Restrict cross-origin resource usage |

## Web Headers

`apps/web` applies the same baseline through `next.config.ts`. The CSP allows only the minimum
Next.js runtime needs until product screens and asset domains are explicitly reviewed.

## Rules

- No page, API route, or business endpoint may remove these headers without security approval.
- New external asset, analytics, or integration domains must update CSP intentionally.
- HSTS is valid only when TLS is enabled for the environment.
- Security headers are validated in CI by `pnpm validate:security-runtime`.

## Acceptance Criteria

- API bootstrap applies headers before handlers.
- Web runtime defines headers through Next.js config.
- CI fails if baseline headers are removed.
