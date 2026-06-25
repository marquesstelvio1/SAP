# CODING STANDARDS — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Source:** `tsconfig.base.json`, `biome.json`, codebase conventions

---

## 1. TYPESCRIPT CONFIGURATION

Base configuration (`tsconfig.base.json`) applies to all packages and apps:

### Strict Mode Rules
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,   // All indexed access must handle undefined
    "exactOptionalPropertyTypes": true,  // undefined ≠ optional
    "noImplicitOverride": true,         // All overrides must use `override` keyword
    "verbatimModuleSyntax": true,       // import/export as-is (no elision)
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,             // No dead code
    "noUnusedParameters": true,         // Prefix unused params with `_`
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Module Settings
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### Enforcement
- Every package extends `tsconfig.base.json` via `"extends": "../../tsconfig.base.json"`
- CI runs `turbo run typecheck` to validate across all packages
- `noUncheckedIndexedAccess` must be respected with proper narrowing or null checks

---

## 2. FILE NAMING CONVENTIONS

### General Rules
- **Files:** kebab-case with dot separators for type/role
- **Directories:** kebab-case

### File Patterns by Type
| Type | Pattern | Examples |
|---|---|---|
| NestJS module | `*.module.ts` | `cargo.module.ts`, `auth.module.ts` |
| NestJS controller | `*.controller.ts` | `health.controller.ts`, `billing-webhook.controller.ts` |
| NestJS service | `*.service.ts` | `cargo.service.ts`, `tracking.service.ts` |
| RPC contract | `*.ts` | `cargo.ts`, `tracking.ts`, `capacity.ts` |
| RPC router | `*-rpc.router.ts` | `cargo-rpc.router.ts`, `tracking-rpc.router.ts` |
| Domain entity | `*.entity.ts` | `cargo.entity.ts`, `capacity.entity.ts` |
| Domain events | `*.events.ts` | `cargo.events.ts`, `tracking.events.ts` |
| Domain business rules | `business-rules.ts` | `cargo/domain/business-rules.ts` |
| Domain repository | `*.repository.ts` | `cargo.repository.ts`, `tracking.repository.ts` |
| Domain DTO | `dto.ts` or `*.dto.ts` | `cargo/domain/dto.ts`, `tracking/domain/tracking.dto.ts` |
| Domain audit trail | `*.audit-trail.ts` | `cargo/domain/audit-trail.ts` |
| Value objects | `value-objects.ts` | `capacity/domain/value-objects.ts`, `planning/domain/value-objects.ts` |
| Types | `types.ts` or `*-types.ts` | `capacity/domain/capacity-types.ts` |
| Infrastructure module | `*-rpc.router.ts`, `*-module.ts` | infrastructure subdirectories |
| Guard | `*.guard.ts` | `session-required.guard.ts`, `authorization.guard.ts` |
| Middleware | `*.middleware.ts` | `csrf.middleware.ts`, `auth-context.middleware.ts` |
| Decorator | `*.decorator.ts` | `authorization.decorator.ts` |
| Filter | `*.filter.ts` | `exception.filter.ts` |
| Test | `*.test.mjs` | `cargo.test.mjs`, `foundation.test.mjs` |
| Configuration | `*.json`, `*.config.ts` | `next.config.ts`, `playwright.config.ts` |

### Index Files
- Every package exports via `index.ts` barrel file
- Domain modules may have `domain/index.ts`

---

## 3. MODULE STRUCTURE

### API Domain Module Template
Every NestJS domain module follows this structure:

```
apps/api/src/<domain>/
  ├── <domain>.module.ts          # NestJS module (imports, providers, exports)
  ├── <domain>.service.ts         # Service orchestrating domain operations
  ├── <domain>-rpc.router.ts      # oRPC router wiring contracts to service
  ├── domain/
  │   ├── index.ts                # (optional) barrel exports
  │   ├── <domain>.entity.ts      # Domain entity interfaces/classes
  │   ├── <domain>.events.ts      # Domain event factory functions
  │   ├── business-rules.ts       # Business rules enforcement
  │   ├── <domain>.repository.ts  # Repository interface
  │   ├── dto.ts                  # Data transfer object interfaces
  │   └── audit-trail.ts          # Audit trail helpers
  └── infrastructure/
      ├── <domain>.repository.ts  # Repository implementation (Prisma)
      └── (other implementations)
```

### Exceptions
- `auth/` module includes guards, middleware, decorators alongside the module
- `health/` module has no domain/ (simple controller + service)
- `cache/`, `event-bus/`, `rate-limit/`, `security/` are infrastructure modules without domain/

### RPC Contract File Template
```
packages/rpc/src/<domain>.ts
  ├── Enum/constant definitions (statuses, types)
  ├── Zod schemas (input, output, summary)
  ├── Type exports (z.infer)
  ├── Operation metadata exports (createRpcOperationMetadata)
```

---

## 4. IMPORT CONVENTIONS

### Order
1. External npm packages (e.g., `zod`, `@nestjs/common`, `react`)
2. Workspace packages (e.g., `@saptm/rpc`, `@saptm/auth`)
3. Relative imports (e.g., `./cargo.entity.js`, `../auth/auth-context.js`)

### Rules
- All imports must include `.js` extension (ESM + `verbatimModuleSyntax`)
- Type-only imports use `import type` syntax when only types are needed
- Barrel imports from `index.ts` are preferred over deep module imports
- Workspace imports must use workspace protocol (`@saptm/*`) — never `../../packages/*/src/`

### Examples
```typescript
// External
import { z } from "zod";
import { Module } from "@nestjs/common";

// Workspace
import type { RpcOperationMetadata } from "@saptm/rpc";
import { getConfig } from "@saptm/config";

// Relative
import { CargoEntity } from "./cargo.entity.js";
import { createCargoRegisteredEvent } from "./cargo.events.js";
```

---

## 5. EXPORT PATTERNS

### Barrel Exports
- Every package has a root `index.ts` that re-exports all public types and values
- Domain modules may have `domain/index.ts` for internal exports
- RPC contracts export via `packages/rpc/src/index.ts`

### Package Subpath Exports
Defined in each package's `package.json`:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./client": {
      "types": "./dist/client.d.ts",
      "import": "./dist/client.js"
    }
  }
}
```

### Export Style
- Named exports only — no default exports
- Types and values are co-located in the same module
- Interfaces use `I` prefix only when disambiguation is needed (rare)
- Types are preferred over interfaces for objects when using `z.infer`

---

## 6. ERROR HANDLING

### RpcErrorEnvelope
All API errors are returned as `RpcErrorEnvelope`:
```typescript
type RpcErrorEnvelope = {
  code: RpcErrorCode;       // UNAUTHENTICATED | FORBIDDEN | VALIDATION_ERROR | CONFLICT | NOT_FOUND | RATE_LIMITED | INTEGRATION_ERROR | INTERNAL_ERROR
  message: string;          // Human-readable description
  traceId?: string;         // OpenTelemetry trace ID
  requestId?: string;       // Request correlation ID
  details?: unknown;        // Additional context (validation errors, etc.)
};
```

### Error Catalog
| Code | HTTP Status | Retryable |
|---|---|---|
| UNAUTHENTICATED | 401 | no |
| FORBIDDEN | 403 | no |
| VALIDATION_ERROR | 400 | no |
| CONFLICT | 409 | no |
| NOT_FOUND | 404 | no |
| RATE_LIMITED | 429 | yes |
| INTEGRATION_ERROR | 502 | yes |
| INTERNAL_ERROR | 500 | yes |

### Error Handling Patterns
- Services throw domain-specific errors (plain strings or typed errors)
- RPC exception filter catches and maps to `RpcErrorEnvelope`
- Validation errors include `details` array with field-level issues
- Integration errors must not leak external system details

---

## 7. TESTING CONVENTIONS

### File Naming
- Unit/integration tests: `*.test.mjs` (ESM)
- E2E tests: `*.spec.ts` (Playwright convention)

### Test Runner
- All API/RPC tests use Node.js built-in `node --test` runner
- E2E tests use Playwright

### Test Structure
```typescript
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

describe("Domain / Operation", () => {
  before(async () => {
    // Setup: create test data, initialize dependencies
  });

  after(async () => {
    // Teardown: clean up resources
  });

  it("should successfully complete operation", async () => {
    const result = await operation();
    assert.equal(result.status, "success");
  });

  it("should reject invalid input", async () => {
    await assert.rejects(
      () => operation(invalidInput),
      (err: Error) => err.message.includes("VALIDATION_ERROR"),
    );
  });
});
```

### Testing Standards
- Tests must be deterministic — no shared mutable state between tests
- Mock external services — never hit production APIs
- Test files are ESM (`.test.mjs` extension)
- Use `node --test` not Jest/Vitest
- E2E tests use Playwright with chromium only, serial execution

### Test Locations
| Test Type | Location | Runner |
|---|---|---|
| RPC contract tests | `packages/rpc/tests/` | `node --test` |
| API integration tests | `apps/api/tests/` | `node --test` |
| UI component tests | `packages/ui/src/components/__tests__/` | `node --test` |
| E2E tests | `tests/e2e/` | Playwright |

---

## 8. BIOME CONFIGURATION

Linting and formatting are enforced by Biome (not Prettier or ESLint):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

---

## 9. GIT CONVENTIONS

### Commit Messages
- Conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `ci`
- Scopes: package names without `@saptm/` prefix (e.g., `rpc`, `auth`, `api`, `web`)

### Branch Naming
- `feat/<description>`
- `fix/<description>`
- `chore/<description>`

### PR Standards
- Every PR requires CI passing (lint → typecheck → test → build)
- Changesets for version management (`pnpm changeset`)
- Documentation drift must be corrected within the same PR

---

## 10. CODE REVIEW STANDARDS

### Mandatory Reviews By
| Change Type | Reviewer |
|---|---|
| Architectural changes | Architect agent |
| Auth/permission changes | Security agent |
| Feature implementation | QA agent |
| UI changes | Design System agent |

### Checklist
- [ ] TypeScript strict mode violations introduced?
- [ ] Package boundaries respected?
- [ ] RPC contract metadata complete (auth, permissions, audit, criticality)?
- [ ] No secrets in code?
- [ ] Tenant isolation maintained (organizationId scoping)?
- [ ] Error handling uses RpcErrorEnvelope?
- [ ] Loading/error states for new UI routes?
- [ ] Tests added for new RPC contracts?
- [ ] Documentation updated (ADR, API_CONTRACTS.md)?
- [ ] Changeset added if public package?
