# Fixes Applied

## 1. API dev script — add dotenvx

**File:** `apps/api/package.json`

```diff
- "dev": "tsx watch src/main.ts",
+ "dev": "dotenvx run -f ../../.env -- tsx watch src/main.ts",
```

Each service now loads the root `.env` file independently. This eliminates dependence on turbo for env propagation.

## 2. Web dev script — add dotenvx (confirmed working)

**File:** `apps/web/package.json`

```diff
- "dev": "next dev",
+ "dev": "dotenvx run -f ../../.env -- next dev",
```

Same rationale as the API fix.

## 3. turbo.json — explicit env configuration

**File:** `turbo.json`

```diff
+ "globalDependencies": [".env"],
+ "globalEnv": [
+   "NODE_ENV", "API_PORT", "API_CORS_ORIGINS",
+   "DATABASE_URL", "DATABASE_POOL_SIZE", "REDIS_URL",
+   "BETTER_AUTH_SECRET", "BETTER_AUTH_URL",
+   "SAPTM_INVITATION_TOKEN_TTL_HOURS",
+   "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_API_URL",
+   "OTEL_SERVICE_NAME", "OTEL_EXPORTER_OTLP_ENDPOINT",
+   "LOG_LEVEL", "RESEND_API_KEY", "EMAIL_FROM"
+ ],
```

This:
- Adds `.env` to `globalDependencies` so turbo watches it for cache invalidation
- Declares all env vars in `globalEnv` so turbo explicitly forwards them and knows they affect task outputs

## 4. Config package — friendly error messages

**File:** `packages/config/src/index.ts`

`parseServerEnv()` now catches `ZodError` and produces a human-readable message instead of a raw Zod stack trace:

```
Missing environment variables: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
Check that your .env file (at the repository root) has these values set.
→ DATABASE_URL: postgresql://postgres:postgres@localhost:25432/saptm
→ BETTER_AUTH_SECRET: generate with: openssl rand -hex 32
→ BETTER_AUTH_URL: http://localhost:3000
```

## 5. Cache module — circular ESM dependency fixed

**Files:** `apps/api/src/cache/cache.constants.ts` (new), `apps/api/src/cache/cache.module.ts`, `apps/api/src/cache/cache.service.ts`

Extracted `REDIS_CLIENT` symbol to a dedicated `cache.constants.ts` file to break the circular import between `cache.module.ts` and `cache.service.ts`.

## 6. Diagnostic script

**File:** `scripts/diagnose-env.mjs`

A standalone script that validates all required env vars are present in `process.env`. Run with:

```bash
pnpm dotenvx run -- node scripts/diagnose-env.mjs
```

## Verification

After all fixes:

```bash
pnpm dev
```

Expected outcome:
- `@saptm/api` starts on port 4000 without ZodError
- `@saptm/web` starts on port 3000 without ZodError
- Both services can read `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
