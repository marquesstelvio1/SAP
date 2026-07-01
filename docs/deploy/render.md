# Deploy SAPTM na Render

## Arquitectura

```
saptm-api (Docker, NestJS, Porta 4000)
  ├── saptm-postgres (PostgreSQL 16 gerido)
  ├── saptm-redis (Redis 7 gerido, via internal auth)
  └── saptm-web (Docker, Next.js, Porta 3000)
```

Todo o deploy é definido por `render.yaml` na raiz do repositório.

---

## Opção A — Blueprint Sync (recomendado)

Usa o `render.yaml` para criar todos os recursos de uma vez.

### 1. Ligar o repositório

1. [Render Dashboard → Blueprint](https://dashboard.render.com/blueprints)
2. **New Blueprint** → Connect repository `anomalyco/saptm`
3. Seleccionar branch `main` (ou `developer`)
3. Render detecta automaticamente o `render.yaml`

### 2. Rever recursos

O Blueprint cria:

| Recurso | Serviço | Plano |
|---------|---------|-------|
| saptm-api | Web Service (Docker) | Starter |
| saptm-web | Web Service (Docker) | Starter |
| saptm-postgres | PostgreSQL 16 | Basic 256MB |
| saptm-redis | Redis 7 | Starter |

### 3. Preencher secrets

O `render.yaml` já define a maioria das env vars automaticamente:

- **Geradas automaticamente**: `BETTER_AUTH_SECRET`
- **De postgres**: `DATABASE_URL`
- **De redis**: `REDIS_URL`
- **De `RENDER_EXTERNAL_URL`**: `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `API_CORS_ORIGINS`

Env vars que precisam de input manual (marcadas com `sync: false`, se existirem):
- `RESEND_API_KEY` — chave da API Resend para emails
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc. — se aplicável
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, etc. — se aplicável

### 4. Aplicar

**Sync Blueprint** → todos os recursos são criados em sequência.

---

## Opção B — Manual (sem Blueprint)

> ⚠️ **Atenção**: Se criares serviços manualmente, o `render.yaml` não é usado. Tens de replicar as configurações abaixo.

### Criação do Web Service saptm-api

| Campo | Valor |
|-------|-------|
| Runtime | **Docker** (não Node) |
| Branch | `main` |
| Region | Oregon |
| Dockerfile Path | `./apps/api/Dockerfile` |
| Docker Context | `.` (repo root) |
| Health Check Path | `/health/live` |

#### Env Vars

| Chave | Valor |
|-------|-------|
| `DATABASE_URL` | fromDatabase → saptm-postgres → connectionString |
| `REDIS_URL` | fromService → saptm-redis → connectionString |
| `BETTER_AUTH_SECRET` | generateValue |
| `BETTER_AUTH_URL` | fromService → saptm-web → `RENDER_EXTERNAL_URL` |
| `NEXT_PUBLIC_APP_URL` | fromService → saptm-web → `RENDER_EXTERNAL_URL` |
| `NEXT_PUBLIC_API_URL` | fromService → saptm-api → `RENDER_EXTERNAL_URL` |
| `API_CORS_ORIGINS` | fromService → saptm-web → `RENDER_EXTERNAL_URL` |

### Criação do Web Service saptm-web

| Campo | Valor |
|-------|-------|
| Runtime | **Docker** (não Node) |
| Dockerfile Path | `./apps/web/Dockerfile` |
| Docker Context | `.` |
| Health Check Path | `/api/health` |

#### Env Vars

| Chave | Valor |
|-------|-------|
| `BETTER_AUTH_SECRET` | fromService → saptm-api → `BETTER_AUTH_SECRET` |
| `BETTER_AUTH_URL` | fromService → saptm-web → `RENDER_EXTERNAL_URL` |
| `NEXT_PUBLIC_APP_URL` | fromService → saptm-web → `RENDER_EXTERNAL_URL` |
| `NEXT_PUBLIC_API_URL` | fromService → saptm-api → `RENDER_EXTERNAL_URL` |
| `DATABASE_URL` | fromService → saptm-api → `DATABASE_URL` |
| `REDIS_URL` | fromService → saptm-api → `REDIS_URL` |

### Criação do Redis

Novo → Key Value → `saptm-redis`, plan Starter, IP Allow `0.0.0.0/0`.

### Criação do PostgreSQL

Novo → PostgreSQL → `saptm-postgres`, plan Basic 256MB, PostgreSQL 16.

> Se criares manualmente, o `fromService` não funciona durante a criação. Cria primeiro a API, depois o web, e verifica se as env vars se ligaram automaticamente ou precisam de atualização manual.

---

## Após o primeiro deploy

### 1. Migrations e seed

Connecta-te à API via Render Shell ou executa localmente com `DATABASE_URL` de produção:

```sh
pnpm db:migrate:deploy
pnpm db:seed
pnpm auth:seed-local-admin
```

Ou via Render Shell do serviço `saptm-api`:
```sh
npx prisma migrate deploy
npx prisma db seed
```

### 2. Verificar health checks

```sh
# API
curl https://saptm-api.onrender.com/health/live

# Web
curl https://saptm-web.onrender.com/api/health
```

### 3. (Opcional) Domínio customizado

Settings → Domains em cada web service. Depois actualiza `CORS_ORIGINS` e `BETTER_AUTH_URL` no Dashboard.

---

## Notas técnicas

### Docker + Monorepo

Ambos os Dockerfiles sobem `pnpm fetch` com cache, copiam o `.docker/prisma-client/` para engines custom, e fazem build com Turbo. O `render.yaml` usa `dockerContext: .` para que o Docker tenha acesso a todos os ficheiros do monorepo.

### Prisma custom engines

O projecto usa engines Prisma para `linux-musl` armazenadas em `.docker/prisma-client/`. Este directório precisa de estar commitado para o build Docker funcionar.

### Build args do Next.js

O web Dockerfile aceita `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_API_URL` como ARG (herdados das env vars injectadas pelo Render durante o build).

### Variáveis Render automáticas

- `RENDER_EXTERNAL_URL` — `https://<service>.onrender.com`
- `RENDER_EXTERNAL_HOSTNAME` — `<service>.onrender.com`
- `RENDER` — `true`
- `NODE_ENV` — `production` (runtime, não build)

### Health checks

| Serviço | Path | Docker HEALTHCHECK |
|---------|------|--------------------|
| API | `/health/live` | Sim (30s interval, 20s start period) |
| Web | `/api/health` | Sim (30s interval, 20s start period) |

### Env vars obrigatórias (validadas por Zod)

Todas as env vars são validadas pelo schema em `packages/config/src/index.ts`:

- `DATABASE_URL` — obrigatória
- `BETTER_AUTH_SECRET` — obrigatória, min 32 chars
- `BETTER_AUTH_URL` — obrigatória, URL completo
- `NEXT_PUBLIC_APP_URL` — obrigatória, URL completo (inlined pelo Next.js)
- `NEXT_PUBLIC_API_URL` — obrigatória, URL completo (inlined pelo Next.js)
- `API_CORS_ORIGINS` — opcional, URLs separadas por vírgula
