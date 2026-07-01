# Detailed Layer Boundaries

## 1. Layer Architecture

SAPTM enforces a strict three-layer architecture that governs all internal package dependencies:

```
┌───────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                               │
│                                                                   │
│  @saptm/api (NestJS)    @saptm/web (Next.js)                     │
│  @saptm/ui (UI kit)     @saptm/testing (test utilities)          │
│                                                                   │
│  Can import: Domain + Infrastructure packages                     │
│  Cannot import: Other Application packages (except web→ui)        │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                                 │
│                                                                   │
│  @saptm/auth (authz/authn)  @saptm/rpc (contracts, errors)       │
│  @saptm/types (shared types)                                      │
│                                                                   │
│  Can import: Infrastructure packages ONLY                          │
│  Cannot import: Application packages                               │
│  Cannot import: Other Domain packages in a way that creates       │
│                 cross-domain coupling (rpc→auth→rpc is impossible)│
└───────────────────────────┬───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                             │
│                                                                   │
│  @saptm/database (Prisma, outbox, audit)                          │
│  @saptm/config (env vars, Zod validation)                         │
│  @saptm/observability (telemetry, logging, metrics)               │
│  @saptm/email (Resend mailer)                                     │
│                                                                   │
│  Cannot import: Any @saptm/* package (leaf layer)                 │
│  Can import: External dependencies only                           │
└───────────────────────────────────────────────────────────────────┘
```

### Layer Definitions

| Layer | Packages | Purpose |
|---|---|---|
| **Infrastructure** | `@saptm/config`, `@saptm/database`, `@saptm/observability`, `@saptm/email` | Foundation services: configuration, data persistence, telemetry, external communication |
| **Domain** | `@saptm/auth`, `@saptm/rpc`, `@saptm/types` | Business logic, authorization, contract definitions, shared types |
| **Application** | `@saptm/api`, `@saptm/web`, `@saptm/ui`, `@saptm/testing` | User-facing applications, UI components, test utilities |

## 2. Cross-Layer Communication Rules

### Rule 1: Dependencies Flow Down Only

```
Application → Domain → Infrastructure
```

Dependencies must always point downward. A package can only depend on packages in the same layer or lower layers.

### Rule 2: No Skip-Layer Restrictions

An Application package may directly import an Infrastructure package without going through Domain.

```
Allowed:  @saptm/api → @saptm/database   (App → Infra, direct)
Allowed:  @saptm/api → @saptm/auth       (App → Domain)
Allowed:  @saptm/auth → @saptm/database  (Domain → Infra)
Allowed:  @saptm/auth → @saptm/config    (Domain → Infra)
```

### Rule 3: No Upward Dependencies

```
Forbidden: @saptm/database → @saptm/auth    (Infra → Domain)
Forbidden: @saptm/config → @saptm/rpc       (Infra → Domain)
Forbidden: @saptm/auth → @saptm/api         (Domain → App)
Forbidden: @saptm/rpc → @saptm/web          (Domain → App)
Forbidden: @saptm/types → @saptm/ui         (Domain → App)
```

### Rule 4: Horizontal Intra-Layer Dependencies

**Infrastructure Layer** — horizontal dependencies are permitted only when justified:

| Dependency | Justification |
|---|---|
| `@saptm/database → @saptm/config` | DB needs connection string from env config |
| `@saptm/database → @saptm/email` | Seed scripts send invitation emails |
| `@saptm/database → @saptm/observability` | Audit trail traces require observability types |
| `@saptm/email → @saptm/config` | Email needs RESEND_API_KEY from env config |
| `@saptm/email → @saptm/observability` | Email sends may need telemetry |

**Domain Layer** — horizontal dependencies:

| Dependency | Justification |
|---|---|
| `@saptm/rpc → @saptm/auth` | RPC authorization evaluation needs auth types |
| `@saptm/rpc → @saptm/types` | RPC contracts reference health types |

**Application Layer** — horizontal dependencies:

| Dependency | Justification |
|---|---|
| `@saptm/web → @saptm/ui` | Web consumes UI components |

## 3. Enforcement Mechanisms

### 3.1 TypeScript Project References (NOT used — Bundler module resolution)

SAPTM does not use TypeScript project references for layer enforcement. Instead, it relies on:

1. **pnpm workspace protocol** (`workspace:*`): packages must explicitly declare their internal dependencies in their `package.json`. If a package tries to import another package it hasn't declared, the import will fail at runtime/build time.

2. **Build order via turbo.json**: The `turbo.json` pipeline enforces `^build` dependency:
   - `infrastructure` packages build first (no internal deps)
   - `domain` packages build after their infrastructure deps complete
   - `application` packages build last

3. **tsconfig strictness**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax` — these prevent accidental imports through loose type checking.

4. **next.config.ts resolve aliases**: Webpack/Turbopack aliases in `apps/web/next.config.ts` explicitly map allowed `@saptm/*` imports — any package not in the alias list would fail to resolve.

### 3.2 Layer Compliance Matrix

| Importer \ Importee | config | database | observability | email | auth | rpc | types | api | web | ui | testing | tsconfig |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **config** | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | dev |
| **database** | ✅ | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | dev |
| **observability** | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | dev |
| **email** | ✅ | ❌ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | dev |
| **auth** | ✅ | ✅ | ✅ | ✅ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | dev |
| **rpc** | ❌ | ❌ | ✅ | ❌ | ✅ | — | ✅ | ❌ | ❌ | ❌ | ❌ | dev |
| **types** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | dev |
| **api** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | — | ❌ | ❌ | ❌ | dev |
| **web** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | — | ✅ | ❌ | dev |
| **ui** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ | dev |
| **testing** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | — | dev |

Key: ✅ = Allowed, ❌ = Forbidden, dev = devDependency only (tsconfig files), — = self

### 3.3 Circular Dependency Prevention

The layer architecture plus the explicit dependency declarations prevent circular dependencies:

```
First, infrastructure packages build:
  @saptm/config      (no internal deps)
  @saptm/observability (no internal deps)
  @saptm/email       (depends on: config, observability)
  @saptm/database    (depends on: config, email, observability)

Then, domain packages build (after their infra deps):
  @saptm/types       (no internal deps)
  @saptm/auth        (depends on: config, database, email, observability)
  @saptm/rpc         (depends on: auth, observability, types)

Finally, application packages build:
  @saptm/ui          (no internal deps)
  @saptm/testing     (depends on: auth, observability, rpc)
  @saptm/api         (depends on: auth, config, database, observability, rpc, types)
  @saptm/web         (depends on: auth, config, rpc, types, ui)
```

The directed graph is acyclic at every level.

## 4. Violation Detection

### 4.1 Automated Detection Mechanisms

| Mechanism | What It Detects |
|---|---|
| **`turbo build`** | If a package imports something not in its `dependsOn` chain, the build will fail due to missing dist output |
| **TypeScript compilation** | If a package imports a type from a package not listed in its `dependencies`, compilation fails |
| **`biome check`** | Linting can be configured to flag disallowed imports using Biome's `no-restricted-imports` rule |
| **CI validation** | PR pipeline runs `lint → typecheck → test → build` sequentially — any layer violation causes failure |
| **pnpm workspace resolution** | If a package is not listed in the importing package's `package.json`, pnpm will fail to resolve it |

### 4.2 Manual Review Checklist

During code review, check:

1. **Does the import violate the layer boundary?** (e.g., `@saptm/database` importing `@saptm/auth`)
2. **Is the import declared in `package.json`?** All internal imports must be explicitly listed as `dependencies` with `workspace:*` protocol
3. **Does the import create a cycle?** Trace the full dependency chain — if `A → B → C → A`, reject
4. **Does the import belong in this package?** Domain package should not import Application package
5. **Is the import used at the correct layer?** UI imports from `@saptm/ui` are appropriate for `@saptm/web` but not for `@saptm/api`

### 4.3 Known Exceptions and Technical Debt

| Exception | Reason | Expiry |
|---|---|---|
| `@saptm/database → @saptm/email` | Seed scripts need email templates for sending invitation emails | Ongoing (intentional) |
| `@saptm/database` has barrel import re-exports from audit, rbac-bootstrap, etc. | Convenience re-exports, not circular (no reverse dependency) | Ongoing (intentional) |

## 5. Dependency Graph (Textual)

```
@sa␊tm/config (infra)
  └── zod

@sa␊tm/observability (infra)
  └── (none)

@sa␊tm/email (infra)
  ├── @saptm/config
  ├── @saptm/observability
  └── resend

@sa␊tm/database (infra)
  ├── @saptm/config
  ├── @saptm/email
  ├── @saptm/observability
  └── @prisma/client, @prisma/adapter-pg, dotenv

@sa␊tm/types (domain)
  └── (none)

@sa␊tm/auth (domain)
  ├── @saptm/config
  ├── @saptm/database
  ├── @saptm/email
  ├── @saptm/observability
  └── better-auth

@sa␊tm/rpc (domain)
  ├── @saptm/auth
  ├── @saptm/observability
  ├── @saptm/types
  ├── @orpc/server
  └── zod

@sa␊tm/ui (app)
  ├── react, react-dom
  ├── radix-ui, lucide-react, recharts, cmdk
  ├── sonner, @tanstack/react-table
  ├── next-themes, date-fns, react-day-picker
  ├── class-variance-authority, clsx, tailwind-merge
  └── (no @saptm/* imports)

@sa␊tm/testing (app)
  ├── @saptm/auth
  ├── @saptm/observability
  ├── @saptm/rpc
  └── @playwright/test

@sa␊tm/api (app)
  ├── @saptm/auth
  ├── @saptm/config
  ├── @saptm/database
  ├── @saptm/observability
  ├── @saptm/rpc
  ├── @saptm/types
  ├── @nestjs/common, @nestjs/core, @nestjs/platform-express
  ├── @nestjs/cache-manager, @nestjs/throttler
  ├── @orpc/server
  ├── zod, stripe, cookie-parser, csrf-csrf, ioredis
  ├── cache-manager, cache-manager-redis-yet
  └── reflect-metadata, rxjs

@sa␊tm/web (app)
  ├── @saptm/auth, @saptm/auth/client, @saptm/auth/server
  ├── @saptm/config
  ├── @saptm/rpc
  ├── @saptm/types
  ├── @saptm/ui, @saptm/ui/components, @saptm/ui/tokens, @saptm/ui/styles.css
  ├── next, react, react-dom
  ├── @sentry/nextjs
  ├── @tanstack/react-query
  └── better-auth, next-themes
```

## 6. Layer Boundary Enforcement in CI

The `turbo.json` task pipeline enforces layer boundaries through build ordering:

```json
{
  "build": {
    "dependsOn": ["^build"]
  }
}
```

When a PR introduces a layer violation (e.g., `@saptm/database` importing `@saptm/auth`):

1. **TypeScript check** fails — `@saptm/database` does not have `@saptm/auth` in its `dependencies`
2. **Build order fails** — `@saptm/auth` builds after `@saptm/database` in the pipeline, so `@saptm/database` cannot resolve `@saptm/auth/dist` during its build
3. **CI gate** blocks the PR

This ensures all layer boundaries are enforced at compile time, not just at review time.
