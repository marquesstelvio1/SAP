# Adições ao Schema Prisma — SAPTM

Este documento descreve as adições propostas ao schema Prisma para suportar
planos de subscrição catalogados, configuração SSO/SAML, controlo de acesso
baseado em equipas (team-based access control) e feature flags por organização.

## Schema Actual (modelos relevantes)

Os modelos abaixo já existem e servem de base para as alterações propostas:

- **`Subscription`** — subscrição actual da org, com `plan` como string livre,
  `stripeCustomerId`, `stripeSubscriptionId`, `status`, `currentPeriodStart/End`,
  `cancelAtPeriodEnd`, `trialEndsAt`.
- **`Invoice`** — facturação por período, com `stripeInvoiceId`, `amount`,
  `currency`, `status`, `periodStart/End`, `paidAt`, `downloadUrl`.
- **`UsageRecord`** — métricas de consumo (`metric`, `current`, `limit`,
  `periodStart`, `periodEnd`), unique por `organizationId + metric`.
- **`Team`** — equipa operacional, com `name`, `slug`, `description`,
  `organizationId`, soft delete.
- **`TeamMember`** — membro de equipa, com `teamId`, `userId`, `role`.
- **`Organization`** — organização multi-inquilino, sem `featureFlags`.

---

## 1. Plan Model (catálogo de planos)

### Rationale

Actualmente o plano é armazenado como string livre no campo `Subscription.plan`
("free", "pro", "enterprise"). Isto impede:

- Validação centralizada de limites por plano (membros, cargas, tracking, API calls)
- Gating de funcionalidades por feature keys
- Evolução controlada do catálogo sem migrações de dados

Um modelo `Plan` dedicado funciona como catálogo oficial, referenciado por FK
a partir de `Subscription`.

### Prisma Model

```prisma
model Plan {
  id            String    @id @default(cuid())
  slug          String    @unique       // "free", "pro", "enterprise"
  name          String                  // "Free", "Pro", "Enterprise"
  description   String
  price         Int                     // preço em cêntimos (0 para free)
  features      String[]                // feature keys para gating
  memberLimit   Int       @default(5)
  cargoLimit    Int       @default(50)
  trackingLimit Int       @default(1000)
  apiCallLimit  Int       @default(1000)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  @@map("plans")
}
```

### Migration Considerations

1. **Criar tabela** `plans` com seed data antes de adicionar FK a `Subscription`.
2. **Populate** com os 3 planos base via seed script (ver secção 5).
3. **Adicionar** `planId String?` a `Subscription` com FK opcional → `Plan.id`.
4. **Script de backfill**: mapear `Subscription.plan` actual para o `Plan.slug`
   correspondente e preencher `planId`.
5. **Tornar** `planId` `@default` após backfill (opcional, pode ficar nullable
   para organizações sem subscrição atribuída).

### Rollback Plan

```sql
ALTER TABLE subscriptions DROP COLUMN plan_id;
DROP TABLE IF EXISTS plans;
```

---

## 2. SsoConfig Model (configuração SSO/SAML)

### Rationale

Para suportar autenticação SSO via SAML (Sprint B), cada organização precisa de
armazenar a configuração do seu Identity Provider (IdP). O modelo é 1:1 com
`Organization` (uma config por org).

### Prisma Model

```prisma
model SsoConfig {
  id                String        @id @default(cuid())
  organizationId    String        @unique
  organization      Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  domain            String?                 // domínio verificado para auto-association
  idpMetadataUrl    String?
  idpEntityId       String?
  idpSsoUrl         String?
  certificate       String?
  jitProvisioning   Boolean       @default(true)
  enabled           Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  @@map("sso_configs")
}
```

### Migration Considerations

1. **Tabela nova**, sem alterações a modelos existentes.
2. `organizationId` é único — cada org pode ter no máximo uma config SSO.
3. `domain` permite associar utilizadores automaticamente por domínio de email
   (auto-association / JIT provisioning).
4. Campos do IdP (`idpMetadataUrl`, `idpEntityId`, `idpSsoUrl`, `certificate`)
   são os mínimos para um fluxo SAML básico.
5. `jitProvisioning` controla se novos utilizadores do domínio são criados
   automaticamente como membros da organização.

### Rollback Plan

```sql
DROP TABLE IF EXISTS sso_configs;
```

---

## 3. teamId em Cargo e TrackingShipment

### Rationale

Para permitir controlo de acesso baseado em equipas (team-based access control),
as entidades de domínio `Cargo` e `TrackingShipment` precisam de referenciar
opcionalmente uma `Team`. Isto permite:

- Filtrar registos por equipa do utilizador logado
- Garantir que operadores só vêem cargas/encomendas da sua equipa
- Auditoria por equipa

As referências são **soft** (sem FK constraint) para evitar acoplamento entre
bounded contexts, seguindo o mesmo padrão existente de `trackingShipmentId`
em `Cargo` (linha 701 do schema actual: "Logical reference to TrackingShipment
(no FK constraint for bounded context decoupling)").

### Alterações Prisma

```prisma
// Em Cargo — adicionar após trackingShipmentId:
teamId    String?
@@index([organizationId, teamId])

// Em TrackingShipment — adicionar antes de createdAt:
teamId    String?
@@index([organizationId, teamId])
```

### Migration Considerations

1. **Colunas novas nullable** — sem impacto em registos existentes.
2. **Sem FK constraint** — a integridade referencial é garantida ao nível da
   aplicação (service layer).
3. O índice composto `[organizationId, teamId]` optimiza queries de filtragem
   por organização + equipa.
4. A app layer deve validar que `teamId` pertence à mesma `organizationId` antes
   de atribuir.

### Rollback Plan

```sql
ALTER TABLE cargo DROP COLUMN team_id;
DROP INDEX IF EXISTS idx_cargo_organization_team;

ALTER TABLE tracking_shipments DROP COLUMN team_id;
DROP INDEX IF EXISTS idx_tracking_shipments_organization_team;
```

---

## 4. Feature Flags em Organization

### Rationale

Para activar ou desactivar funcionalidades por organização sem depender do plano
de subscrição (ex.: beta features, pilotos, permissões especiais), a
`Organization` precisa de um campo JSON flexível para feature flags.

### Alteração Prisma

```prisma
// Em Organization — adicionar após deletedBy:
featureFlags  Json?   @default("[]")   // array de feature flag keys activas
```

### Migration Considerations

1. **Coluna nova nullable** com default `"[]"` — organizações existentes
   recebem array vazio automaticamente.
2. O tipo `Json` no Prisma mapeia para `JSONB` no PostgreSQL, permitindo
   queries nativas com `?` (exists), `@?` (path exists) se necessário.
3. A validação do conteúdo (array de strings) deve ser feita no service layer
   com Zod (ex.: `z.array(z.string())`).
4. Feature flags resolvem-se por união do plano (`Plan.features`) + flags
   específicas da org (`Organization.featureFlags`).

### Rollback Plan

```sql
ALTER TABLE organizations DROP COLUMN feature_flags;
```

---

## 5. Seed Data para Planos

```prisma
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPlans() {
  const plans = [
    {
      slug: "free",
      name: "Free",
      description: "Para experimentação e pequenos volumes",
      price: 0,
      features: ["cargo.basic", "tracking.basic", "dashboard.basic"],
      memberLimit: 5,
      cargoLimit: 50,
      trackingLimit: 1_000,
      apiCallLimit: 1_000,
    },
    {
      slug: "pro",
      name: "Pro",
      description: "Para operações profissionais com tracking completo",
      price: 9900, // €99/mo
      features: [
        "cargo.basic",
        "cargo.advanced",
        "tracking.basic",
        "tracking.advanced",
        "dashboard.basic",
        "dashboard.analytics",
        "api.standard",
        "teams",
      ],
      memberLimit: 25,
      cargoLimit: 500,
      trackingLimit: 10_000,
      apiCallLimit: 10_000,
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      description: "Para operações de grande escala com suporte dedicado",
      price: 0, // preço custom
      features: [
        "cargo.basic",
        "cargo.advanced",
        "cargo.unlimited",
        "tracking.basic",
        "tracking.advanced",
        "tracking.unlimited",
        "dashboard.basic",
        "dashboard.analytics",
        "dashboard.custom",
        "api.standard",
        "api.unlimited",
        "teams",
        "sso",
        "audit.export",
        "webhooks",
        "integrations",
      ],
      memberLimit: 999_999,
      cargoLimit: 999_999,
      trackingLimit: 999_999,
      apiCallLimit: 999_999,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
}
```

### Execução

O seed deve ser executado como parte do workflow normal de migração:

```sh
pnpm db:seed
```

E incluído no `prisma/seed.ts` chamando `seedPlans()`.

---

## 6. Resumo de Índices Recomendados

| Modelo             | Índice                          | Tipo    | Justificação                                     |
|--------------------|----------------------------------|---------|--------------------------------------------------|
| `Plan`             | `slug` (unique)                  | B-tree  | Lookup por slug (query de subscrição)            |
| `SsoConfig`        | `organizationId` (unique)        | B-tree  | Lookup 1:1 por org (login flow)                  |
| `Cargo`            | `[organizationId, teamId]`       | B-tree  | Filtragem por organização + equipa               |
| `TrackingShipment` | `[organizationId, teamId]`       | B-tree  | Filtragem por organização + equipa               |
| `Organization`     | `featureFlags` (GIN)             | GIN     | (Opcional) queries nativas JSONB em flags        |

> Nota: O índice GIN em `Organization.featureFlags` é opcional e só deve ser
> criado se existirem queries nativas do tipo `WHERE featureFlags ? 'flag_key'`.
> Para a maioria dos casos, a filtragem é feita na aplicação após carregar a org.

---

## 7. Ordem de Execução Sugerida

1. **Seed de plans** (`pnpm db:seed` com `Plan` apenas)
2. **Migration 1** — criar tabela `plans`
3. **Migration 2** — adicionar `planId` a `Subscription` + FK
4. **Migration 3** — criar tabela `sso_configs`
5. **Migration 4** — adicionar `teamId` a `Cargo` e `TrackingShipment` + índices
6. **Migration 5** — adicionar `featureFlags` a `Organization`

Cada migration deve ser pequena, reversível e testada em ambiente de staging
antes de aplicar em produção.
