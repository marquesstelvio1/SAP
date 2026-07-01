# ADR 0006 — Infrastructure Dependency Exceptions

## Status

Accepted.

## Context

The monorepo uses a PNPM catalog (`pnpm-workspace.yaml`) to centralize shared dependency versions across all `apps/*` and `packages/*`. This ensures version alignment and reduces duplication.

However, certain dependencies are inherently scoped to a single application or package:

- **NestJS ecosystem packages** (`@nestjs/cache-manager`, `@nestjs/throttler`, `cache-manager`, `cache-manager-redis-yet`, `cookie-parser`, `csrf-csrf`, `ioredis`) — these are specific to `@saptm/api` (the NestJS backend) and have no use case in the frontend or shared packages. They depend on NestJS internals and HTTP transport layer details that only the API application owns.
- **Sentry** (`@saptm/nextjs`) — this is the Next.js SDK specifically designed for the `@saptm/web` frontend. It hooks into Next.js build pipeline and server components, making it inapplicable to other packages.
- **Resend** — this is the email-sending SDK used exclusively by `@saptm/email`. While the email package is a shared library, the Resend dependency itself is an implementation detail of the email transport layer.

These dependencies were originally declared with hardcoded versions in their respective `package.json` files, bypassing the catalog. This creates two problems:

1. **Version drift risk** — if another app or package ever needs the same dependency, versions may diverge.
2. **Discoverability** — developers cannot see all dependency versions in one place.

## Decision

**Move all app-specific infrastructure dependencies into the PNPM catalog** while keeping their usage scoped to the owning application or package.

This is a middle ground:

- The catalog remains the **single source of truth** for version declarations.
- Each `package.json` uses `"catalog:"` to reference the catalog version.
- Dependencies that are genuinely **shared** (e.g., `@nestjs/common`, `next`, `react`) will be used by multiple packages.
- Dependencies that are **app-specific** (NestJS ecosystem, Sentry, Resend) will be declared in the catalog but only consumed by the owning app/package.

This approach provides:
- **Centralized version management** — all dependency versions are visible in one file.
- **No version drift** — if a second consumer ever appears, versions are automatically aligned.
- **Clear ownership** — the catalog entry does not force a dependency on all packages; each package still chooses what to import.

The following dependencies are added to the catalog as infrastructure exceptions:

| Dependency | Version | Consumer |
|---|---|---|
| `@nestjs/cache-manager` | `^3.1.3` | `@saptm/api` |
| `@nestjs/throttler` | `^6.5.0` | `@saptm/api` |
| `cache-manager` | `^7.2.8` | `@saptm/api` |
| `cache-manager-redis-yet` | `^5.1.5` | `@saptm/api` |
| `cookie-parser` | `^1.4.7` | `@saptm/api` |
| `csrf-csrf` | `^4.0.3` | `@saptm/api` |
| `ioredis` | `^5.11.1` | `@saptm/api` |
| `@types/cache-manager` | `^5.0.0` | `@saptm/api` |
| `@types/cookie-parser` | `^1.4.10` | `@saptm/api` |
| `@types/express` | `^5.0.6` | `@saptm/api` |
| `@sentry/nextjs` | `^8.55.2` | `@saptm/web` |
| `resend` | `^4.8.0` | `@saptm/email` |

## Consequences

### Positive

- All dependency versions are centralized in the catalog for easy auditing and updates.
- No behavioral change — each package continues to only depend on what it needs.
- Future consumers of these dependencies (if any) will automatically align on the same version.

### Negative

- The catalog grows with entries that are only consumed by a single package, slightly reducing its signal-to-noise ratio for truly shared dependencies.
- Renovate/Dependabot catalog updates will touch `pnpm-workspace.yaml` even for app-specific deps.

### Mitigations

- A comment in the catalog can group infrastructure-specific entries separately.
- Package-level `package.json` files remain the authoritative list of what a package depends on; the catalog is purely a version resolution mechanism.
