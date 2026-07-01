# Build & Start Commands

## Build

```sh
# API (requer database generate primeiro)
pnpm install --frozen-lockfile && pnpm --filter @saptm/database db:generate && pnpm turbo build --filter @saptm/api

# Web
pnpm install --frozen-lockfile && pnpm turbo build --filter @saptm/web

# Tudo (mais simples, resolve dependências automaticamente)
pnpm build
```

## Start

```sh
# API
pnpm --filter @saptm/api start

# Web
pnpm --filter @saptm/web start
```

## Dev (hot reload)

```sh
# Ambos em paralelo
pnpm dev
```

## Package names

| App     | package name   | pasta       |
|---------|----------------|-------------|
| API     | `@saptm/api`   | `apps/api`  |
| Web     | `@saptm/web`   | `apps/web`  |
| Database| `@saptm/database` | `packages/database` |
