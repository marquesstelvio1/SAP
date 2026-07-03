# Deployment Runbook

> **Versão:** 1.0.0 | **Última actualização:** 2026-07-03 | **Departamento:** Documentação / DevOps

## Visão Geral

Este runbook cobre o processo completo de deployment do SAPTM — desde o build até à verificação pós-deployment. A plataforma consiste em duas aplicações (`@saptm/api` e `@saptm/web`) e vários pacotes partilhados, orquestrados via Turborepo.

## Stack

```
@saptm/api     → NestJS 11 (Express) → Docker → Kubernetes
@saptm/web     → Next.js 16 (App Router) → Docker → Kubernetes
@saptm/rpc     → oRPC contracts (TypeScript, compilado)
@saptm/database→ Prisma v7 + PostgreSQL 17 + Redis 7
```

## Pré-requisitos

### Ferramentas
- Node.js 22+
- pnpm 10+
- Docker + Docker Compose
- kubectl (para Kubernetes)
- Stripe CLI (para testes de webhook)

### Acesso
- Acesso ao registry de contentores (Docker Hub / GitHub Container Registry)
- Acesso ao cluster Kubernetes (`KUBE_CONFIG_B64` no GitHub Secrets)
- Chave API Stripe para testes

## Build Process

### 1. Build Local

```bash
# Limpar builds anteriores
pnpm clean

# Instalar dependências
pnpm install

# Build de todos os pacotes
pnpm build

# Verificar tipos
pnpm typecheck

# Executar lint
pnpm lint
```

O comando `pnpm build` executa Turborepo que:
1. Compila `packages/` (config, database, rpc, ui, form, etc.)
2. Compila `apps/api` → `apps/api/dist/`
3. Compila `apps/web` → `apps/web/.next/` (standalone output)

### 2. ESM Patching (Database)

Após o build do `@saptm/database`, o step `build` corre dois patches:

```bash
node scripts/patch-esm-dist-extensions.mjs
node scripts/patch-prisma-esm-imports.mjs
```

Isto é necessário porque o Prisma v7 requer `@prisma/adapter-pg` com suporte ESM.

### 3. Docker Build

```bash
# API
docker build -t saptm/api:latest -f apps/api/Dockerfile .

# Web
docker build -t saptm/web:latest -f apps/web/Dockerfile .
```

Ambos os Dockerfiles usam multi-stage build (deps → build → production) com base `node:22-alpine`.

## Variáveis de Ambiente

### Todas as Variáveis

| Variável | Obrigatória | App | Descrição |
|----------|-------------|-----|-----------|
| `NODE_ENV` | ✅ | Ambas | Ambiente (`development`, `production`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Web | URL público da app (ex: `https://saptm.app`) |
| `NEXT_PUBLIC_API_URL` | ✅ | Web | URL da API (ex: `https://api.saptm.app`) |
| `API_PORT` | | API | Porta do servidor NestJS (default: `4000`) |
| `API_CORS_ORIGINS` | ✅ | API | Origens CORS permitidas (separadas por vírgula) |
| `DATABASE_URL` | ✅ | API | URL da PostgreSQL (`postgresql://user:pass@host:5432/saptm`) |
| `REDIS_URL` | ✅ | API | URL do Redis (`redis://host:6379`) |
| `BETTER_AUTH_SECRET` | ✅ | Ambas | Segredo para encriptar sessões Better Auth |
| `BETTER_AUTH_URL` | ✅ | Ambas | URL base para auth (mesmo que `NEXT_PUBLIC_APP_URL`) |
| `SAPTM_INVITATION_TOKEN_TTL_HOURS` | | API | TTL do token de convite (default: `48`) |
| `RESEND_API_KEY` | | API | Chave API Resend para emails |
| `EMAIL_FROM` | | API | Endereço de email do remetente |
| `NEXT_PUBLIC_POSTHOG_KEY` | | Web | Chave pública PostHog |
| `NEXT_PUBLIC_POSTHOG_HOST` | | Web | Host PostHog |
| `OTEL_SERVICE_NAME` | | API | Nome do serviço para tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | | API | Endpoint OTLP para métricas |
| `LOG_LEVEL` | | API | Nível de log (`info`, `debug`, `warn`, `error`) |
| `STRIPE_SECRET_KEY` | | API | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | | API | Segredo do webhook Stripe |
| `STRIPE_PRICE_FREE` | | API | Price ID do plano Free |
| `STRIPE_PRICE_PRO` | | API | Price ID do plano Pro |
| `STRIPE_PRICE_ENTERPRISE` | | API | Price ID do plano Enterprise |
| `GRAFANA_ADMIN_USER` | | API | Utilizador admin Grafana |
| `GRAFANA_ADMIN_PASSWORD` | | API | Password admin Grafana |

### Validação

Todas as variáveis são validadas via Zod em `packages/config/src/`. Erros de validação resultam em mensagens amigáveis durante o startup.

## Ordem de Startup (Local)

```mermaid
graph LR
    A[PostgreSQL] --> C[API]
    B[Redis] --> C
    C --> D[Web]
    C --> E[Outbox Worker]
```

### Passos

```bash
# 1. Base de dados e cache
pnpm infra:up                    # docker compose up -d postgres redis

# 2. Migrações da base de dados
pnpm db:migrate:dev              # prisma migrate dev
pnpm db:generate                 # prisma generate
pnpm db:seed                     # opcional: dados de seed

# 3. API (porta 4000)
pnpm --filter @saptm/api dev

# 4. Web (porta 3000)
pnpm --filter @saptm/web dev

# 5. Outbox Worker (processa eventos)
pnpm worker:outbox

# Alternativa: tudo ao mesmo tempo
pnpm dev                         # dotenvx run -- turbo run dev --parallel
```

## Ordem de Startup (Production/Kubernetes)

```mermaid
graph LR
    A[PostgreSQL 17] --> B[Migration Job]
    B --> C[API Deployment]
    D[Redis 7] --> C
    C --> E[Web Deployment]
    C --> F[Outbox Worker]
    E --> G[Ingress/CDN]
```

### Passos

1. **Migrações** — O init container ou job separado corre `pnpm db:migrate:deploy`
2. **API** — Deployment começa após migrações bem-sucedidas
3. **Web** — Deployment começa após API health check passar
4. **Outbox Worker** — Deployment paralelo ao Web (não bloqueante)
5. **Health checks** — Kubernetes liveness/readiness probes nos deployments

### Health Check Pipeline

```
API Startup:
  1. ─ Database connection (blocking)
  2. ─ Redis connection (blocking)
  3. ─ Ready: /health/live (always 200) + /health/ready (200 when connected)

Web Startup:
  1. ─ Next.js server ready
  2. ─ Ready: /api/health (200 when API reachable)
```

## Deploy via GitHub Actions

### Workflows

| Workflow | Trigger | Acção |
|----------|---------|-------|
| **Platform CI** | PR/push a main | 30+ validações (lint, typecheck, test, build) |
| **Container CI** | Push a main + CI passa | Build, scan (Trivy), sign (Cosign) imagens |
| **Environment Deploy** | Tag semântico | Deploy para staging/production |
| **Environment Rollback** | Manual trigger | Rollback para revisão anterior |

### Release Process

1. PR merged to `main` → Platform CI corre
2. Se CI passa → Container CI constrói imagens
3. Tag semântico (`v1.2.3`) criado → Environment Deploy
4. Deploy corre migrações + rollout API + rollout Web
5. Health checks pós-deploy validam
6. Se health checks falham → rollback automático

## Health Check Endpoints

### API

| Endpoint | Tipo | Resposta |
|----------|------|----------|
| `GET /health/live` | Liveness | `{ "status": "ok" }` (sempre 200) |
| `GET /health/ready` | Readiness | `{ "status": "ok", "database": "connected", "redis": "connected" }` |
| `GET /api/health` | App health | `{ "status": "ok", "version": "1.0.0", "uptime": 3600 }` |
| `GET /metrics` | Prometheus | Métricas OpenTelemetry |

### Web

| Endpoint | Tipo | Resposta |
|----------|------|----------|
| `GET /api/health` | App health | `{ "status": "ok", "api": "reachable" }` |

## Rollback Procedure

Ver o [Runbook de Rollback](rollback-runbook.md) para procedimento detalhado.

### Resumo

```bash
# Ver histórico de rollout
kubectl rollout history deployment/saptm-api -n saptm-production

# Rollback para revisão anterior
kubectl rollout undo deployment/saptm-api -n saptm-production

# Verificar status
kubectl rollout status deployment/saptm-api -n saptm-production --timeout=180s

# Smoke test
node scripts/smoke-runtime.mjs
```

### Regras de Rollback

- **Não** reverter migrações de base de dados sem um plano específico
- **Não** fazer rollback para image tags mutáveis
- **Não** fechar o incidente até smoke checks passarem

## Database Migrations

### Local

```bash
pnpm db:migrate:dev              # Criar migração
pnpm db:validate                 # Validar schema
pnpm db:generate                 # Gerar Prisma Client
```

### CI

```bash
pnpm validate:migrations
pnpm db:validate
pnpm db:generate
```

### Production

```bash
pnpm db:migrate:deploy           # Aplicar migrações
pnpm db:migrate:status           # Verificar estado
```

### Proibições

- ❌ Editar uma migração já aplicada
- ❌ Deploy de schema changes sem migration SQL
- ❌ `db:migrate:dev` em produção
- ❌ Seed data via RBAC bootstrap em produção

## Pós-Deploy

### Checklist

- [ ] `/health/live` responde 200
- [ ] `/health/ready` responde 200 com `database: "connected"`
- [ ] `/api/health` responde 200
- [ ] `/metrics` expõe métricas Prometheus
- [ ] Web carrega sem erros de API
- [ ] Login funciona (Better Auth)
- [ ] RPC calls funcionam
- [ ] Stripe webhooks são processados
- [ ] Outbox worker processa eventos
- [ ] Alertas não estão a disparar

### Monitorização Pós-Deploy (30 min)

- [ ] Latência API P95 < 500ms
- [ ] Taxa de erro API < 0.1%
- [ ] Redis cache hit ratio ≥ 80%
- [ ] CPU/Memória dos pods estável
- [ ] Logs sem erros inesperados

## Troubleshooting

### Build Falha

```bash
# Limpar cache do Turborepo
pnpm clean
rm -rf node_modules/.cache/turbo

# Verificar erros de tipo
pnpm typecheck

# Verificar erros de lint
pnpm lint
```

### API Não Inicia

```bash
# Verificar variáveis de ambiente
pnpm --filter @saptm/api dev    # Ver erros de validação Zod

# Verificar conexão BD
psql $DATABASE_URL              # Testar conexão manual

# Verificar conexão Redis
redis-cli -u $REDIS_URL ping    # Deve responder PONG
```

### Migrations Falham

```bash
# Verificar estado
pnpm db:migrate:status

# Reverter última migração (se possível)
pnpm db:migrate:rollback

# Forçar resolução (último recurso)
pnpm db:migrate:resolve
```

---

**Departamento de Documentação** — `@enterprise-documentation`
