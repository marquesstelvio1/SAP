# Root Cause Analysis — Environment Variable Propagation

## Symptom

```
ZodError: [
  { "path": ["DATABASE_URL"], "message": "Invalid input: expected string, received undefined" },
  { "path": ["BETTER_AUTH_SECRET"], "message": "Invalid input: expected string, received undefined" },
  { "path": ["BETTER_AUTH_URL"], "message": "Invalid input: expected string, received undefined" }
]
```

Both `@saptm/api` and `@saptm/web` crashed at startup because `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` were `undefined` in `process.env` when `getServerEnv()` was called.

## Investigation

### The env chain (broken)

```
pnpm dev (root)
  → dotenvx run -- turbo run dev --parallel    ← loads .env (17 vars)
    → turbo spawns:
        → tsx watch src/main.ts  (api)   ← NO dotenvx → vars MISSING
        → next dev                (web)   ← NO dotenvx → vars MISSING
```

The root `dotenvx` loaded 17 vars from `.env` and injected them into `process.env`, then spawned `turbo`. Turbo should inherit and pass these vars to child processes.

**However**, turbo (v2.9.16 on Windows) did NOT reliably propagate the env vars to child processes. The `tsx watch` process did not see `DATABASE_URL`, `BETTER_AUTH_SECRET`, or `BETTER_AUTH_URL`.

### Diagnosis

1. **`apps/api/package.json`** — `"dev": "tsx watch src/main.ts"` had NO `dotenvx` wrapper. The process relied entirely on turbo propagating env vars from the parent.
2. **`apps/web/package.json`** — `"dev": "next dev"` had NO `dotenvx` wrapper. Same issue.
3. **`turbo.json`** — No `globalEnv` or `globalDependencies` configuration. Turbo had no explicit instructions about which env vars to forward or watch.
4. **`packages/config/src/index.ts`** — The `parseServerEnv()` function threw raw `ZodError` with a confusing stack trace instead of a clear message about missing env vars.

### Why turbo didn't propagate

Turbo passes environment variables from the parent shell to child processes by default, but in certain environments (Windows, certain shell configurations, or when using `pnpm exec` with specific `node_modules` layouts), the inheritance can break. The env vars were present in the root `dotenvx` process but never reached `tsx watch`.

The fix is to **not rely on turbo for env propagation**. Each service should load its own `.env` file explicitly using `dotenvx`.

## Affected files

| File | Issue | Severity |
|---|---|---|
| `apps/api/package.json` | Missing `dotenvx` in dev script | **Critical** |
| `apps/web/package.json` | Missing `dotenvx` in dev script (was fixed, still needed) | **Critical** |
| `turbo.json` | Missing `globalEnv` and `globalDependencies` | **Medium** |
| `packages/config/src/index.ts` | Raw `ZodError` on missing vars (bad DX) | **Low** |
| `apps/api/src/cache/cache.service.ts` | Circular ESM import causing `REDIS_CLIENT` TDZ error | **High** |
