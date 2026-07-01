# DEPENDENCY MAP — SAPTM

**Version:** 1.0.0
**Last Updated:** 2026-06-22
**Source:** `packages/*/package.json`, `apps/*/package.json`

---

## 1. PACKAGE DEPENDENCY GRAPH

```
@prisma/client ─┐
dotenv ─────────┤
                ▼
         @saptm/config ─── zod
                │
                ├──────────────┐
                ▼              ▼
         @saptm/email    @saptm/observability
         resend           (no workspace deps)
                │              │
                └──────┬───────┘
                       ▼
                @saptm/database
                @prisma/adapter-pg
                @prisma/client
                       │
                       ▼
                @saptm/auth
                better-auth
                       │
                       ├──────────────────────┐
                       ▼                      ▼
                @saptm/rpc              @saptm/testing
                @orpc/server            @playwright/test
                zod
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
         @saptm/api  @saptm/web  @saptm/testing
         NestJS      Next.js     (test utilities)
         @orpc/server            @saptm/auth
         stripe                  @saptm/rpc
         redis
         csrf-csrf

         @saptm/ui ──── radix-ui, lucide-react, tailwind-merge,
                        class-variance-authority, sonner, recharts,
                        date-fns, cmdk, next-themes, clsx,
                        @tanstack/react-table, react-day-picker
              │
              ▼
         @saptm/web (peer: react, react-dom)
```

---

## 2. DIRECT DEPENDENCIES (workspace:*)

### @saptm/web → @saptm/auth, @saptm/config, @saptm/rpc, @saptm/types, @saptm/ui
- **Type:** Application → Package
- **Direction:** Frontend app consuming packages
- **Compliance:** OK — packages never consume apps

### @saptm/api → @saptm/auth, @saptm/config, @saptm/database, @saptm/observability, @saptm/rpc, @saptm/types
- **Type:** Application → Package
- **Direction:** Backend app consuming packages
- **Compliance:** OK — packages never consume apps

### @saptm/auth → @saptm/config, @saptm/database, @saptm/email, @saptm/observability
- **Type:** Package → Package
- **Direction:** Auth → infrastructure packages
- **Compliance:** OK

### @saptm/database → @saptm/config, @saptm/email, @saptm/observability
- **Type:** Package → Package
- **Direction:** Database → infrastructure packages
- **Compliance:** OK

### @saptm/rpc → @saptm/auth, @saptm/observability, @saptm/types
- **Type:** Package → Package
- **Direction:** Contracts → auth, observability, types
- **Note:** RPC imports auth types for permission declarations. This creates a dependency from "contracts" to "auth" which is acceptable because RPC references auth's type definitions, not runtime logic. The alternative (duplicating types) would cause drift.

### @saptm/email → @saptm/config, @saptm/observability
- **Type:** Package → Package
- **Compliance:** OK

### @saptm/testing → @saptm/auth, @saptm/observability, @saptm/rpc
- **Type:** Package → Package
- **Compliance:** OK

### @saptm/config → (none workspace)
- **Type:** Leaf package
- **External only:** zod
- **Compliance:** OK

### @saptm/observability → (none workspace)
- **Type:** Leaf package
- **Compliance:** OK

### @saptm/types → (none workspace)
- **Type:** Leaf package
- **Compliance:** OK

### @saptm/ui → (none workspace)
- **Type:** UI component leaf
- **External only:** react, react-dom (peer)
- **Compliance:** OK

### @saptm/tsconfig → (none workspace)
- **Type:** Config only
- **Compliance:** OK

---

## 3. TRANSITIVE DEPENDENCIES

| Package | Depends On (transitive) |
|---|---|
| @saptm/api | auth → database → {config, email, observability}; rpc → {auth, observability, types} |
| @saptm/web | auth → database → {config, email, observability}; rpc → {auth, observability, types} |
| @saptm/auth | database → {config, email, observability} |
| @saptm/database | {config, email, observability} |
| @saptm/rpc | auth → database → {config, email, observability}; observability |
| @saptm/testing | auth → database → {config, email, observability}; rpc → {auth, observability} |

---

## 4. CIRCULAR DEPENDENCY ANALYSIS

**No circular dependencies detected.** The dependency graph is a directed acyclic graph (DAG):

```
Layer 0: config, observability, types, tsconfig (leaf packages)
Layer 1: email, ui
Layer 2: database
Layer 3: auth
Layer 4: rpc, testing
Layer 5: api, web (applications)
```

---

## 5. BOUNDARY VIOLATION AUDIT

### Rule: No package imports from another package's `src/` directly
**Status:** All packages use workspace protocol (`workspace:*`) with proper `package.json` exports. No direct `src/` imports found.

### Rule: No circular dependencies between packages
**Status:** Pass. All edges flow from higher layers to lower layers.

### Rule: Packages never consume applications
**Status:** Pass. `api` and `web` are the only packages that import from other packages; no package imports from `apps/`.

### Rule: Domain modules follow strict layer boundaries
**Status:** All API modules follow the pattern: `module.ts`, `*-rpc.router.ts`, `*.service.ts`, `domain/`, `infrastructure/`. Controllers are not used directly — RPC routers handle contract-based communication.

---

## 6. EXPLICIT IMPORT VIOLATIONS

All workspace imports use proper subpath exports from `package.json`:

| Package | Subpath Exports |
|---|---|
| @saptm/auth | `.`, `./client`, `./server` |
| @saptm/database | `.` |
| @saptm/rpc | `.` |
| @saptm/ui | `.`, `./components`, `./components/*`, `./hooks`, `./lib/utils`, `./styles.css`, `./tokens` |
| @saptm/config | `.` |
| @saptm/email | `.` |
| @saptm/observability | `.` |
| @saptm/types | `.` |
| @saptm/testing | `.` |

No raw `../../packages/*/src/` imports detected across the codebase.

---

## 7. DEPENDENCY DIAGRAM (textual)

```
                    ┌──────────────┐
                    │ @saptm/config │ (zod)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌───────────────┐ ┌──────────┐ ┌────────────────┐
    │ @saptm/email  │ │@saptm/   │ │ @saptm/types   │
    │ (resend)      │ │observabil│ │ (no deps)      │
    └───────┬───────┘ │ity       │ └────────────────┘
            │         └──────────┘
            │              │
            └──────┬───────┘
                   ▼
          ┌─────────────────┐
          │ @saptm/database │── @prisma/adapter-pg, @prisma/client
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ @saptm/auth     │── better-auth
          └────────┬────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
  ┌──────────┐ ┌──────────┐ ┌────────────┐
  │@saptm/rpc│ │@saptm/   │ │ @saptm/web │
  │(@orpc,   │ │testing   │ │ (Next.js)  │
  │ zod)     │ │(pw, rpc, │ └────────────┘
  └────┬─────┘ │ auth)    │
       │       └──────────┘
       ▼
  ┌──────────┐
  │@saptm/api│
  │(NestJS)  │
  └──────────┘

  ┌──────────┐
  │@saptm/ui │── radix-ui, lucide-react, cva, tailwind-merge, etc.
  └────┬─────┘
       │ (peer: react, react-dom)
       ▼
  ┌──────────┐
  │@saptm/web│
  └──────────┘

  ┌──────────┐
  │@saptm/   │ (typescript config)
  │tsconfig  │
  └──────────┘ (used by all packages as devDep)
```
