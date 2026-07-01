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

`apps/web` applies headers through `next.config.ts` `async headers()`.

### Content-Security-Policy (Web)

```
default-src 'self'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
object-src 'none'
img-src 'self' data: blob:
font-src 'self' data:
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
connect-src 'self'
worker-src 'self' blob:
frame-src 'none'
upgrade-insecure-requests
```

> **Tailwind v4 note:** `style-src 'unsafe-inline'` is required because Tailwind v4 injects
> CSS custom properties at runtime for animations, transitions, and JIT utilities.
> The nonce-based upgrade path is available in `apps/web/src/proxy.ts` for environments that
> enforce strict CSP (script nonce + `strict-dynamic`). When adopting the nonce approach,
> `style-src 'unsafe-inline'` must still be retained unless every inline style is hashed.

### Other Web Headers

| Header | Value |
| --- | --- |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

## Rules

- No page, API route, or business endpoint may remove these headers without security approval.
- New external asset, analytics, or integration domains must update CSP intentionally.
- `style-src 'unsafe-inline'` must not be removed while Tailwind v4 is in use.
- HSTS is valid only when TLS is enabled for the environment.
- Security headers are validated in CI by `pnpm validate:security-runtime`.

## Acceptance Criteria

- API bootstrap applies headers before handlers.
- Web runtime defines headers through Next.js config.
- CI fails if baseline headers are removed.
