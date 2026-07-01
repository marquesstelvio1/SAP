# System Overview

**Phase:** 2 — Architecture System
**Date:** 2026-06-23

---

## System Context

SAPTM is an enterprise logistics platform for rail-port cargo operations. It provides cargo tracking, capacity management, tariff calculation, transport planning, and integration with external logistics systems.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Users (Browser)                    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              @saptm/web (Next.js 16)                  │
│  ┌────────────┬─────────────┬────────────────────┐   │
│  │ Server     │ Client      │ API Routes         │   │
│  │ Components │ Components  │ (Better Auth)      │   │
│  └────────────┴─────────────┴────────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │ RPC (HTTP)
┌──────────────────────▼──────────────────────────────┐
│              @saptm/api (NestJS 11)                   │
│  ┌──────────────────────────────────────────────┐    │
│  │  @orpc/server  (Uniform RPC Handler)         │    │
│  ├──────────────────────────────────────────────┤    │
│  │  Middleware Pipeline                          │    │
│  │  Security → CSRF → CORS → Rate → Auth → RPC  │    │
│  ├──────────────────────────────────────────────┤    │
│  │  Domain Modules (22)                         │    │
│  │  Cargo | Tracking | Capacity | Tariff | ...  │    │
│  └──────────────────────────────────────────────┘    │
└───────┬────────────────────────────────┬────────────┘
        │                                │
┌───────▼────────┐             ┌─────────▼─────────┐
│  @saptm/rpc    │             │  @saptm/database   │
│  Contracts     │             │  Prisma ORM v7     │
│  Zod Schemas   │             │  PostgreSQL 17     │
│  Metadata      │             │  Redis 7           │
└────────────────┘             └───────────────────┘
```

## Architecture Principles

1. **RPC-first** — All API communication through defined contracts, not direct HTTP
2. **Multi-tenant** — Every data operation scoped to organization
3. **Immutability** — Audit trail never modified, only appended
4. **Idempotency** — All mutations support safe retries
5. **Defense in depth** — Multiple security layers
6. **Package isolation** — Strict dependency rules enforced

## Boundary Rules

- Apps never depend on other apps
- Packages never depend on apps
- RPC contracts are the single source of truth for API shape
- Database is only accessed through @saptm/database
- Auth logic only in @saptm/auth

## Module Responsibility Map

| Layer | Package | Responsibility |
|---|---|---|
| Contracts | `@saptm/rpc` | I/O schemas, operation metadata, error catalog |
| API | `@saptm/api` | NestJS modules, RPC handlers, middleware |
| Auth | `@saptm/auth` | Authentication, authorization, session management |
| Data | `@saptm/database` | Schema, migrations, client, outbox, audit |
| UI | `@saptm/ui` | Components, tokens, styles |
| Config | `@saptm/config` | Environment validation, trusted origins |
| Observability | `@saptm/observability` | Tracing, metrics, logging |
