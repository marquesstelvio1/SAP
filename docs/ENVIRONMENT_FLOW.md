# Environment Variable Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        .env (repository root)                       │
│  NODE_ENV, DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, ...  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
                pnpm dev (root package.json)
        ┌──────────────────────────────────────┐
        │  dotenvx run -- turbo run dev        │
        │  → loads .env (17 vars)              │
        │  → spawns turbo                      │
        └──────────────────┬───────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       turbo.json    turbo (2.9.16)   globalEnv[]
       globalEnv[]   ──────────────   globalDependencies[]
       globalDep[]   passes through
                     env vars
              │            │
              ▼            ▼
   ┌──────────────────┐   ┌──────────────────┐
   │  @saptm/api      │   │  @saptm/web      │
   │  ─────────────   │   │  ─────────────   │
   │  dotenvx run     │   │  dotenvx run     │
   │  -f ../../.env   │   │  -f ../../.env   │
   │  ─────────────   │   │  ─────────────   │
   │  tsx watch       │   │  next dev        │
   │  src/main.ts     │   │                  │
   └────────┬─────────┘   └────────┬─────────┘
            │                      │
            ▼                      ▼
   packages/config          packages/config
   getServerEnv()           getServerEnv()
        │                        │
        ▼                        ▼
   Zod validated! ✅         Zod validated! ✅
   DATABASE_URL ✓            DATABASE_URL ✓
   BETTER_AUTH_SECRET ✓      BETTER_AUTH_SECRET ✓
   BETTER_AUTH_URL ✓         BETTER_AUTH_URL ✓
```

## Key design decisions

| Decision | Rationale |
|---|---|
| **Single `.env` at root** | Single source of truth, no duplication across apps |
| **Each app loads its own `.env`** | Eliminates dependence on turbo for env propagation |
| **`dotenvx -f ../../.env`** | Relative path from `apps/*/` to root `.env` |
| **`turbo.json globalEnv`** | Explicit env declaration for cache correctness and documentation |
| **`turbo.json globalDependencies`** | `.env` changes bust turbo cache |
| **Zod validation in `@saptm/config`** | Centralized schema, shared across all packages |
| **Friendly error messages** | Better DX than raw ZodError stack traces |

## Running individual services

```bash
# API (works from any directory)
pnpm --filter @saptm/api dev

# Web (works from any directory)
pnpm --filter @saptm/web dev

# Both (recommended)
pnpm dev
```

Each service loads env vars independently via `dotenvx run -f ../../.env`, so they work regardless of how they're started.
