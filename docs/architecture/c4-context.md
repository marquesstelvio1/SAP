# C4 Context Diagram — SAPTM

> **Level 1**: System Context Diagram
> **Date**: 2026-07-02
> **Scope**: Enterprise logistics platform for rail/port cargo operations

```mermaid
C4Context
  title System Context diagram for SAPTM — Enterprise Logistics Platform

  Person(carlos, "Carlos Silva", "Operador Logístico — regista cargas, monitoriza tracking, gere excepções")
  Person(maria, "Maria Santos", "Gestora de Operações — aprova reservas, planeia transporte, supervisiona capacidade")
  Person(joao, "João Pereira", "Administrador — gere organizações, utilizadores, permissões e facturação")
  Person(ana, "Ana Costa", "Engenheira de Integração — configura webhooks, integra sistemas externos (TMS, WMS, GPS)")

  System(saptm, "SAPTM", "Enterprise logistics platform for rail/port cargo operations — gestão de cargas, tracking, capacidade, tarifário, facturação")

  System_Ext(stripe, "Stripe", "Payment processing, subscriptions, invoices, usage metering")
  System_Ext(resend, "Resend", "Email delivery — notificações, relatórios, alerts")
  System_Ext(posthog, "PostHog", "Product analytics — eventos, dashboards, feature flags")
  System_Ext(otel, "OpenTelemetry Collector", "Observabilidade — tracing, métricas, logs")
  System_Ext(redis, "Redis", "Caching, rate limiting, session store")
  System_Ext(postgres, "PostgreSQL", "Primary database (via Prisma ORM)")

  Rel(carlos, saptm, "Regista cargas, consulta tracking, regista eventos, gere excepções e entregas", "HTTPS")
  Rel(maria, saptm, "Aprova reservas, planeia transporte, revê capacidade, consulta tarifário", "HTTPS")
  Rel(joao, saptm, "Configura organizações, gere equipas, roles, permissões e facturação", "HTTPS")
  Rel(ana, saptm, "Configura webhooks, integra sistemas externos, gere tokens de API", "HTTPS")

  Rel(saptm, stripe, "Cobra subscrições, processa facturas, regista uso", "HTTPS")
  Rel(saptm, resend, "Envia emails transactionais e notificações", "HTTPS")
  Rel(saptm, posthog, "Regista eventos de produto e métricas de uso", "HTTPS")
  Rel(saptm, otel, "Exporta traces, métricas e logs", "gRPC")
  Rel(saptm, redis, "Cache distribuída, rate limiting, sessões", "TCP")
  Rel(saptm, postgres, "Persistência relacional", "TCP")

  UpdateLayoutConfig()
```

## External Systems

| System | Purpose | Integration |
|--------|---------|-------------|
| Stripe | Payment processing, subscriptions, invoices | REST API via `stripe` npm package |
| Resend | Transactional email delivery | REST API via `resend` npm package |
| PostHog | Product analytics, feature flags | REST API via `posthog-node` |
| OpenTelemetry | Distributed tracing, metrics, logs | gRPC OTLP exporter |
| Redis | Caching, rate limiting, sessions | `ioredis` via `@nestjs/bull` |
| PostgreSQL | Primary data store | Prisma ORM with `@prisma/adapter-pg` |

## Actors

| Persona | Role | Key Tasks |
|---------|------|-----------|
| Carlos Silva | Operador Logístico | Registar cargas, monitorizar tracking, gerir excepções, registar entregas |
| Maria Santos | Gestora de Operações | Aprovar reservas, planear transporte, gerir capacidade, consultar tarifário |
| João Pereira | Administrador | Gerir organizações, utilizadores, permissões, faturação e configurações |
| Ana Costa | Engenheira de Integração | Configurar webhooks, integrar TMS/WMS/GPS, gerir tokens de API |
