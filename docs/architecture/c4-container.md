# C4 Container Diagram — SAPTM

> **Level 2**: Container Diagram
> **Date**: 2026-07-02
> **Scope**: Enterprise logistics platform for rail/port cargo operations
> **Technology Stack**: TypeScript monorepo, NestJS 11, Next.js 16, Prisma 7, PostgreSQL, Redis, oRPC, Better Auth

```mermaid
C4Container
  title Container diagram for SAPTM — Enterprise Logistics Platform

  Person(carlos, "Carlos Silva", "Operador Logístico")
  Person(maria, "Maria Santos", "Gestora de Operações")
  Person(joao, "João Pereira", "Administrador")
  Person(ana, "Ana Costa", "Engenheira de Integração")

  System_Boundary(saptm, "SAPTM") {
    Container(web, "Web Application", "Next.js 16, TypeScript, shadcn/ui, Tailwind v4", "Server-rendered React SPA with App Router — dashboard, formulários, tracking, gestão")
    Container(api, "API Application", "NestJS 11, TypeScript, oRPC", "RPC-based backend com 20+ domain modules, validação Zod, auth, event bus")
    ContainerDb(db, "Database", "PostgreSQL 16, Prisma 7", "Primary relational data store — domain entities, audit, outbox, migrations")
    ContainerDb(cache, "Cache", "Redis 7", "Distributed cache, rate limiting via @nestjs/throttler, session store, Bull queue broker")
    Container(worker, "Outbox Worker", "Node.js, TypeScript", "Transactional outbox processor — publica eventos de domínio para handlers (notificações, webhooks, integrações)")
    Container(auth, "Better Auth", "TypeScript, JWT, OAuth 2.0", "Authentication & authorization — RBAC, 2FA, session management, OAuth providers")
  }

  System_Ext(stripe, "Stripe", "Payment processing, subscriptions, invoices")
  System_Ext(resend, "Resend", "Email delivery")
  System_Ext(posthog, "PostHog", "Product analytics")

  Rel(carlos, web, "Navega e interage com a plataforma", "HTTPS")
  Rel(maria, web, "Navega e interage com a plataforma", "HTTPS")
  Rel(joao, web, "Navega e interage com a plataforma", "HTTPS")
  Rel(ana, web, "Navega e interage com a plataforma", "HTTPS")

  Rel(web, api, "Chamadas RPC via @saptm/rpc contracts", "oRPC / HTTPS")
  Rel(api, auth, "Verifica sessões, valida permissões, gera tokens", "TypeScript")
  Rel(auth, db, "Persiste utilizadores, roles, sessions, OAuth accounts", "Prisma ORM")
  Rel(api, db, "CRUD de domínio, audit trail, outbox events", "Prisma ORM")
  Rel(api, cache, "Rate limiting, caching de consultas frequentes", "ioredis")
  Rel(worker, db, "Lê outbox events não processados", "Prisma ORM")
  Rel(worker, cache, "Publica eventos para filas Bull", "ioredis")
  Rel(api, stripe, "Cobra subscrições, processa invoices", "HTTPS / stripe npm")
  Rel(api, resend, "Envia emails transaccionais", "HTTPS / resend npm")
  Rel(api, posthog, "Regista eventos analíticos", "HTTPS / posthog-node")

  UpdateLayoutConfig()
```

## Container Descriptions

| Container | Technology | Responsibility |
|-----------|-----------|----------------|
| Web Application | Next.js 16, Tailwind v4, shadcn/ui | Server Components by default; TanStack Query for remote state; App Router with domain routes |
| API Application | NestJS 11, oRPC, Zod | 20+ domain modules; Controller → Service → Repository pattern; EventBus abstraction |
| Database | PostgreSQL 16, Prisma 7 | Domain entities, audit trail, transactional outbox, idempotency keys, migrations |
| Cache | Redis 7 | Rate limiting (3 tiers), session store, Bull job queues, distributed caching |
| Outbox Worker | Node.js, TypeScript | Polls outbox table, publishes domain events, triggers notifications/webhooks |
| Better Auth | TypeScript, JWT, OAuth 2.0 | Session management, RBAC, 2FA, OAuth providers, service accounts |

## Communication

| Source | Target | Protocol | Purpose |
|--------|--------|----------|---------|
| Web App | API | oRPC (HTTPS) | All data operations via `@saptm/rpc` contracts — no REST endpoints |
| API | Database | Prisma ORM | Domain CRUD, audit, outbox via `@prisma/adapter-pg` |
| API | Auth | TypeScript | Session validation, permission checks via Better Auth server client |
| API | Redis | ioredis | Rate limiting with `RedisThrottlerStorage`; cache queries |
| Outbox Worker | Database | Prisma ORM | Transactional outbox polling (UNIX timestamps) |
| Outbox Worker | Redis | ioredis | Bull queue for async job processing |

## Deployment Model

```
                         ┌──────────────┐
                         │   CDN/Proxy  │
                         │  (Cloudflare)│
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │   Web App (Next.js)    │
                    │   apps/web/.next/      │
                    └───────────┬───────────┘
                                │ oRPC
                    ┌───────────┴───────────┐
                    │   API (NestJS 11)      │
                    │   apps/api/dist/       │
                    ├───────────┬───────────┤
                    │  Outbox   │    Auth    │
                    │  Worker   │  (embedded)│
                    └─────┬─────┴─────┬─────┘
                          │           │
                     ┌────┴────┐ ┌───┴────┐
                     │PostgreSQL│ │  Redis  │
                     └─────────┘ └────────┘
```
