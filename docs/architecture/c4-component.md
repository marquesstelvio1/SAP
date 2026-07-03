# C4 Component Diagram — SAPTM

> **Level 3**: Component Diagram — Bounded Contexts within the API
> **Date**: 2026-07-02
> **Scope**: API Application internal architecture — 13 bounded contexts, cross-cutting infrastructure, event-driven & sync relationships

```mermaid
C4Component
  title Component diagram for SAPTM API — Bounded Contexts & Relationships

  Boundary(api, "API Application (NestJS 11)") {

    Component(rpc, "RPC Layer", "@orpc/server, Zod v4", "Contract-based RPC transport — todos os endpoints passam por aqui com validação, metadata e versionamento")
    Component(eventbus, "EventBus", "Transactional Outbox Pattern", "Publica DomainEvents para a tabela outbox; OutboxWorker consome e roteia para handlers assíncronos")
    Component(prisma, "Prisma ORM", "@prisma/adapter-pg v7", "Data access layer — tenant scoping via Prisma Client Extension, conexão PostgreSQL")
    Component(auth, "Better Auth Server", "TypeScript, JWT, OAuth 2.0", "Identity, sessões, RBAC, 2FA, OAuth providers, service accounts")

    Component(cargo, "Cargo", "NestJS Module", "Registo, libertação, transporte, entrega, excepções, claims, compliance — aggregate root do domínio")
    Component(tracking, "Tracking", "NestJS Module", "Eventos de tracking em tempo real, excepções, advisories, next-action card")
    Component(capacity, "Capacity", "NestJS Module", "Gestão de slots, reservas, decisões de advisory, disponibilidade de recursos")
    Component(planning, "Planning", "NestJS Module", "Ordens de transporte, revisão de schedule, dispatch, planeamento de recursos")
    Component(tariff, "Tariff", "NestJS Module", "Rate cards, regras de tarifário, cotações")
    Component(identity, "Identity & Access", "NestJS Module + Better Auth", "Utilizadores, roles, permissões, políticas — governança de acesso")
    Component(organizations, "Organizations", "NestJS Module", "Multi-tenancy — organizações, membros, equipas, estados (active/suspended/archived)")
    Component(billing, "Billing", "NestJS Module + Stripe", "Subscrições, facturas, usage metering, webhooks Stripe")
    Component(integrations, "Integrations", "NestJS Module", "Webhooks inbound de sistemas externos (TMS, WMS, GPS, Customs) — validação, transformação")
    Component(notifications, "Notifications", "NestJS Module", "Notificações in-app e email — geradas a partir de outbox events")
    Component(documents, "Documents", "NestJS Module", "Gestão de documentos de compliance — upload, verificação, evidência")
    Component(audit, "Audit", "NestJS Module", "Immutable audit trail — before/after de todas as mutações, consulta histórica")
    Component(webhooks, "Webhooks", "NestJS Module", "Outbound webhook delivery — retry com backoff, assinaturas HMAC, logs de entrega")
  }

  System_Ext(stripe, "Stripe", "Payment processor")
  System_Ext(resend, "Resend", "Email service")
  System_Ext(posthog, "PostHog", "Product analytics")
  System_Ext(postgres, "PostgreSQL", "Primary database")
  System_Ext(redis, "Redis", "Cache & queues")

  Cross-cutting — RPC Layer expõe todos os módulos
  Rel(rpc, cargo, "Expõe operações Cargo", "oRPC contract")
  Rel(rpc, tracking, "Expõe operações Tracking", "oRPC contract")
  Rel(rpc, capacity, "Expõe operações Capacity", "oRPC contract")
  Rel(rpc, planning, "Expõe operações Planning", "oRPC contract")
  Rel(rpc, tariff, "Expõe operações Tariff", "oRPC contract")
  Rel(rpc, identity, "Expõe operações Identity", "oRPC contract")
  Rel(rpc, organizations, "Expõe operações Organizations", "oRPC contract")
  Rel(rpc, billing, "Expõe operações Billing", "oRPC contract")
  Rel(rpc, documents, "Expõe operações Documents", "oRPC contract")

  Todos os módulos de domínio usam Prisma e Auth
  Rel(cargo, prisma, "Persiste agregados, outbox events", "Prisma ORM")
  Rel(tracking, prisma, "Persiste eventos, excepções", "Prisma ORM")
  Rel(capacity, prisma, "Persiste slots, reservas", "Prisma ORM")
  Rel(planning, prisma, "Persiste ordens, schedules", "Prisma ORM")
  Rel(tariff, prisma, "Persiste rate cards, regras", "Prisma ORM")
  Rel(billing, prisma, "Persiste subscrições, invoices", "Prisma ORM")
  Rel(documents, prisma, "Persiste metadados de documentos", "Prisma ORM")
  Rel(notifications, prisma, "Persiste notificações", "Prisma ORM")
  Rel(audit, prisma, "Persiste audit trail imutável", "Prisma ORM")
  Rel(webhooks, prisma, "Persiste configurações e logs", "Prisma ORM")
  Rel(integrations, prisma, "Persiste configurações de integração", "Prisma ORM")
  Rel(identity, prisma, "Persiste roles, policies", "Prisma ORM")
  Rel(organizations, prisma, "Persiste organizações, membros", "Prisma ORM")

  Rel(cargo, auth, "Verifica permissões (cargo.register, etc)", "TypeScript")
  Rel(tracking, auth, "Verifica permissões", "TypeScript")
  Rel(capacity, auth, "Verifica permissões", "TypeScript")
  Rel(planning, auth, "Verifica permissões", "TypeScript")
  Rel(tariff, auth, "Verifica permissões", "TypeScript")
  Rel(billing, auth, "Verifica permissões", "TypeScript")
  Rel(documents, auth, "Verifica permissões", "TypeScript")
  Rel(notifications, auth, "Verifica permissões", "TypeScript")
  Rel(organizations, auth, "Verifica permissões", "TypeScript")

  Domain sync dependencies (direct RPC calls between modules)
  Rel(cargo, capacity, "Verifica disponibilidade de slot", "sync RPC")
  Rel(cargo, planning, "Cria ordem de transporte", "sync RPC")
  Rel(cargo, tariff, "Obtém tarifa aplicável", "sync RPC")
  Rel(cargo, documents, "Associa documento de compliance", "sync RPC")
  Rel(planning, capacity, "Aloca slot para transporte", "sync RPC")
  Rel(tariff, billing, "Fornece dados para facturação", "sync RPC")
  Rel(billing, organizations, "Verifica plano e limites", "sync RPC")
  Rel(webhooks, audit, "Regista log de entrega", "sync RPC")

  Event-driven dependencies (via EventBus / outbox)
  Rel(cargo, eventbus, "Publica CargoRegistered, CargoReleased, CargoDelivered", "DomainEvent")
  Rel(tracking, eventbus, "Publica TrackingEventRecorded, ExceptionOpened", "DomainEvent")
  Rel(capacity, eventbus, "Publica SlotAllocated, SlotReleased", "DomainEvent")
  Rel(planning, eventbus, "Publica TransportOrderCreated, ScheduleRevised", "DomainEvent")
  Rel(billing, eventbus, "Publica UsageRecorded, InvoiceGenerated", "DomainEvent")
  Rel(integrations, eventbus, "Publica WebhookReceived, IntegrationFailed", "DomainEvent")

  Async consumers (EventBus handlers)
  Rel(eventbus, tracking, "[Async] Cargo lifecycle → actualiza tracking", "EventHandler")
  Rel(eventbus, notifications, "[Async] Domain events → gera notificações", "EventHandler")
  Rel(eventbus, webhooks, "[Async] Domain events → deliver outbound", "EventHandler")
  Rel(eventbus, documents, "[Async] Cargo events → associa evidência", "EventHandler")
  Rel(eventbus, audit, "[Async] Domain events → regista audit trail", "EventHandler")
  Rel(eventbus, integrations, "[Async] Domain events → forward to external systems", "EventHandler")

  External system connections
  Rel(billing, stripe, "Cobra subscrições, processa invoices, sincroniza planos", "HTTPS")
  Rel(notifications, resend, "Envia emails transaccionais", "HTTPS")
  Rel(notifications, posthog, "Regista eventos de notificação", "HTTPS")
  Rel(prisma, postgres, "Conexão directa, pool de conexões", "TCP")
  Rel(eventbus, redis, "Bull job queues para outbox processing", "ioredis")

  UpdateLayoutConfig()
```

## Legend

| Line | Meaning |
|------|---------|
| `Rel(A, B, ...)` | Solid line — synchronous dependency (direct RPC call or TypeScript import) |
| `Rel(A, eventbus, ...)` | Publication — domain module publishes events to EventBus |
| `Rel(eventbus, B, ...)` | Consumption — EventBus delivers events to async handlers |

## Bounded Context Overview

| # | Context | Type | Key Events Published | Key Sync Dependencies |
|---|---------|------|---------------------|----------------------|
| 1 | Cargo | Domain Core | CargoRegistered, CargoReleased, CargoDelivered, CargoExceptionRecorded | Capacity, Planning, Tariff, Documents, Auth |
| 2 | Tracking | Domain Core | TrackingEventRecorded, ExceptionOpened, ExceptionResolved, AdvisoryIssued | Cargo (via event), Auth |
| 3 | Capacity | Domain Core | SlotAllocated, SlotReleased, CapacityWarning | Planning, Auth |
| 4 | Planning | Domain Core | TransportOrderCreated, ScheduleRevised, Dispatched | Capacity, Auth |
| 5 | Tariff | Domain Core | RateCardUpdated, QuoteGenerated | Billing, Auth |
| 6 | Identity & Access | Foundation | RoleAssigned, PermissionRevoked, UserInvited | Auth (embedded) |
| 7 | Organizations | Foundation | OrganizationCreated, MemberJoined, OrganizationSuspended | Auth |
| 8 | Billing | Supporting | UsageRecorded, InvoiceGenerated, SubscriptionChanged | Organizations, Auth, Stripe |
| 9 | Integrations | Integration | WebhookReceived, IntegrationConfigured, IntegrationFailed | Auth |
| 10 | Notifications | Supporting | NotificationSent, NotificationDelivered | Resend, PostHog, Auth |
| 11 | Documents | Supporting | DocumentUploaded, EvidenceVerified, ComplianceApproved | Auth |
| 12 | Audit | Cross-cutting | (consome todos os eventos) | Prisma |
| 13 | Webhooks | Integration | WebhookDelivered, WebhookFailed, WebhookRetried | Audit, Auth |

## Key Architectural Decisions

- **Sync vs Async**: Mutações críticas (registar carga, alocar slot) usam sync RPC entre módulos para consistência imediata. Eventos de domínio (cargo registered, delivery completed) propagam-se via outbox pattern para handlers assíncronos.
- **Transaction Outbox**: O EventBus escreve DomainEvents na tabela `outbox_event` dentro da mesma transação SQL. O OutboxWorker lê eventos não processados e roteia para handlers registados.
- **Tenant Scoping**: Todas as queries Prisma passam pelo middleware de tenant scoping (`organizationId`) — isolamento multi-tenant automático.
- **Idempotency**: Todas as mutações usam idempotency keys (unique constraint) para garantir exactly-once processing.
