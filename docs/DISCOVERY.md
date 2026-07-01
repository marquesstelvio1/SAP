# DISCOVERY — SAPTM Monorepo Audit

> **FASE 0** — Apenas análise. Nada foi alterado.

---

## Estrutura do Monorepo

```
saptm/
├── apps/
│   ├── api/          (NestJS 11, Express, oRPC v1)
│   └── web/          (Next.js 16, React 19.2, App Router)
├── packages/
│   ├── auth/         (Better Auth v1, RBAC, permissões)
│   ├── config/       (Zod-validated env schemas)
│   ├── database/     (Prisma v7, 1261-lines schema, audit, outbox)
│   ├── email/        (Resend)
│   ├── form/         (React Hook Form + Zod)
│   ├── observability/ (OpenTelemetry)
│   ├── rpc/          (oRPC contracts, 21 domain files)
│   ├── testing/      (Test utilities)
│   ├── tsconfig/     (Shared TS config base)
│   ├── types/        (Shared TS types)
│   └── ui/           (shadcn/ui, Tailwind v4, 45+ components)
└── tests/            (E2E + load tests)
```

**Package manager:** pnpm v10.12.1 (lockfile v9)
**Monorepo tool:** Turborepo v2.9.16
**Node:** >=22

---

## Arquitetura Atual

```
@saptm/web (Next.js 16)
  └── @saptm/rpc (oRPC contracts) ──► @saptm/api (NestJS 11)
                                         ├── @saptm/auth (Better Auth)
                                         ├── @saptm/database (Prisma v7)
                                         │     └── PostgreSQL 17
                                         ├── @saptm/observability (OTEL)
                                         └── @saptm/config (env)
```

### Camadas

| Layer | Package | Tech | Responsabilidade |
|---|---|---|---|
| Contracts | `@saptm/rpc` | oRPC + Zod | Schemas I/O, metadata operacional, catálogo de erros |
| API | `@saptm/api` | NestJS 11 | Módulos, handlers RPC, middleware pipeline |
| Auth | `@saptm/auth` | Better Auth v1 | Sessões, RBAC, 41 permissões flat |
| Data | `@saptm/database` | Prisma v7 | Schema, migrações, audit trail, outbox |
| UI | `@saptm/ui` | shadcn/ui | 45+ componentes, blocks, charts, layouts |
| Config | `@saptm/config` | Zod | Schemas env validados |

### API Modules (26 diretórios em `apps/api/src/`)

admin, audit, auth, billing, cache, capacity, cargo, documents, event-bus, health, integrations, notifications, observability, organizations, planning, rate-limit, reports, rpc, security, settings, tariff, teams, tracking, webhooks

### RPC Contracts (21 ficheiros em `packages/rpc/src/`)

admin, audit, authorization, billing, capacity, cargo, documents, errors, foundation, integrations, metadata, notifications, organizations, planning, reports, settings, tariff, teams, tracking, webhooks

---

## Problemas Encontrados

### 🔴 CRÍTICOS

| # | Problema | Local | Impacto |
|---|---|---|---|
| **P1** | `@saptm/rpc` billing exports quebrados | `packages/rpc/src/index.ts` + `billing.ts` | Bloqueia BUILD e TEST de `@saptm/api` e `@saptm/rpc` (20+ erros TS) |
| **P2** | `@saptm/form` não resolvido no typecheck | `apps/web` | `sign-in-form.tsx` não compila |
| **P3** | `zod` não resolvido no typecheck | `apps/web` | `sign-in-form.tsx` importa `zod` diretamente sem dep em `package.json` |

### 🟡 ALTOS

| # | Problema | Local | Impacto |
|---|---|---|---|
| **P4** | Nenhum teste em 6 packages | `auth`, `config`, `database`, `email`, `form`, `rpc` | Sem safety net para refactoring |
| **P5** | Storybook dep não instalada | `packages/ui` | 11 story files bloqueiam `tsc --noEmit` no UI package |
| **P6** | Session ID no CSRF usa hash não criptográfico | `csrf.middleware.ts` | `deriveSessionId` usa djb2 em vez de SHA-256 (MINOR) |

### 🟢 BAIXOS

| # | Problema | Local | Impacto |
|---|---|---|---|
| **P7** | Sem testes para blocks/charts/layouts | `packages/ui/src/components/blocks/`, `charts/`, `layouts/` | Novos componentes sem cobertura |
| **P8** | RPC endpoints tinham CSRF desativado | `main.ts`, `security.module.ts` | **JÁ CORRIGIDO** (Fixes Applied) |

---

## Score Atual

| Gate | Status | Detalhes |
|---|---|---|
| **LINT** | ❌ FALHA | 108 erros (pré-existentes, maioria organiseImports/format) |
| **TYPECHECK** | ❌ FALHA | 3 packages falham (rpc, ui, web) |
| **DATABASE** | ⏳ POR VERIFICAR | Prisma generate/validate não executado |
| **MIGRATION** | ⏳ POR VERIFICAR | Migrations não verificadas |
| **SEED** | ⏳ POR VERIFICAR | Seed não executado |
| **UNIT TESTS** | ❌ FALHA | 0/14 passam (bloqueado por P1) |
| **INTEGRATION** | ❌ FALHA | Bloqueado por P1 |
| **API** | ❌ FALHA | Bloqueado por P1 |
| **WEB** | ⏳ POR VERIFICAR | Build não executado |
| **E2E** | ⏳ POR VERIFICAR | Não executado |
| **BUILD** | ❌ FALHA | `@saptm/rpc` build falha (P1) |
| **SECURITY** | ⚠️ PARCIAL | CSRF corrigido, session hash fraco |
| **PRODUCTION** | ❌ **BLOCKED** | **12/13 gates vermelhos** |

---

## Riscos

1. **P1 bloqueia toda a pipeline** — Enquanto `@saptm/rpc` não compilar, nenhum teste da API passa e o build total falha
2. **Sem testes em 6/11 packages** — Alterações na auth, database ou config podem quebrar sem deteção
3. **Storybook blocking UI typecheck** — `tsc --noEmit` no `@saptm/ui` falha, mascarando potenciais erros reais

## Ordem de Correção Recomendada

```
P1 (rpc billing) → P2/P3 (web imports) → P5 (storybook) → FASE 1 Lint → FASE 2 Typecheck → ...
```
