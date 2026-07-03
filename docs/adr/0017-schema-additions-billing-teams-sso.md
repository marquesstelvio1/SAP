# ADR 0017 — Schema Additions for Billing, Teams, and SSO

## Status

Accepted — partially implemented.

> **Nota de actualização (2026-07-03):** A checklist de compliance está toda por preencher (`[ ]`). Diferenças entre ADR e implementação real:
> - `Plan` model: usa JSON fields (`features`, `limits`) em vez dos campos escalares propostos. Implementado correctamente.
> - `SsoConfig` model: `domain` é nullable (não non-null/unique como proposto). Campo `idpBinding` não existe. Campos adicionais: `idpMetadataUrl`. JIT provisioning fields existem.
> - `Subscription.planId`: é nullable (`String?`) com default `"plan_free"`, mantendo o campo `plan` legacy. ADR propunha FK obrigatória.
> - Feature gating: ainda usa `getPlanLimits()` hardcoded, não `Plan.features`.
> - Migração SQL: a migration proposta no ADR foi substituída pela migração Prisma real.

## Context

Product requirements (Sprint A+B) require the following schema changes to support enterprise feature gating, team-scoped resources, and SSO/SAML authentication:

### a) Plan model for feature gating

Currently, plans are represented as strings (`"free"`, `"pro"`, `"enterprise"`) in the `Subscription.plan` field. There is no `Plan` model to define:

- A catalog of available pricing plans
- Feature flags per plan for feature gating
- Pricing metadata (currency, amount, trial days)
- Plan-level limits (members, cargos, tracking events)

Feature gating currently relies on hardcoded values in `UsageService.getPlanLimits()` — not data-driven.

### b) SsoConfig for SSO/SAML

There is no model to store per-organization SSO/SAML configuration. Enterprise customers require:

- Identity Provider metadata (entity ID, SSO URL, certificate)
- Domain-based SSO enforcement (login with company email triggers SAML flow)
- Just-In-Time (JIT) provisioning — auto-create users on first SSO login
- Per-organization IdP configuration (different IdP per tenant)

### c) teamId on domain entities

Current `Cargo` and `TrackingShipment` models have no `teamId` column. Team scoping (ADR 0015) requires optional `teamId` on domain entities.

## Decision

### 1. Add Plan model

A new `Plan` model serves as the catalog of pricing plans with feature flags. The `Subscription.plan` field becomes a foreign key reference to `Plan.id`.

```prisma
enum PlanTier {
  free
  pro
  enterprise
}

model Plan {
  id            String    @id @default(cuid())
  tier          PlanTier  @unique
  name          String
  description   String?
  priceMonthly  Int       // Amount in cents (0 for free)
  currency      String    @default("eur")
  trialDays     Int       @default(0)
  features      String[]  // Feature flag keys, e.g. ["sso", "audit_log", "api_access", "custom_roles"]
  maxMembers    Int       @default(5)
  maxCargos     Int       @default(50)
  maxTrackingEvents Int   @default(1000)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  deletedBy     String?

  subscriptions Subscription[]

  @@map("plans")
}
```

The `Subscription.plan` field changes from `String` to a relation:

```prisma
model Subscription {
  id                   String       @id @default(cuid())
  organizationId       String       @unique
  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  planId               String       @default("free")
  plan                 Plan         @relation(fields: [planId], references: [id])
  stripeCustomerId     String?
  stripeSubscriptionId String?
  status               String       @default("active")
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean      @default(false)
  trialEndsAt          DateTime?
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
  deletedAt            DateTime?
  deletedBy            String?

  @@index([stripeSubscriptionId])
  @@map("subscriptions")
}
```

### 2. Add SsoConfig model

```prisma
model SsoConfig {
  id                String    @id @default(cuid())
  organizationId    String    @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  domain            String    @unique  // e.g., "megaport.com"
  idpEntityId       String
  idpSsoUrl         String
  idpCertificate    String
  idpBinding        String    @default("redirect")  // "redirect" | "post"
  jitProvisioning   Boolean   @default(true)
  jitDefaultRoleId  String?
  jitDefaultTeamId  String?
  enabled           Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  deletedBy         String?

  @@index([domain, enabled])
  @@map("sso_configs")
}
```

Key design decisions:

- **One SsoConfig per organization** — `organizationId` is unique. Each org has at most one SSO configuration (they may choose between multiple IdPs via the IdP itself).
- **Domain-based enforcement** — `domain` is unique globally. When a user signs in with an email whose domain matches an enabled `SsoConfig`, the login flow redirects to SAML. This prevents domain conflicts.
- **JIT provisioning** — When `jitProvisioning` is true, a first-time SSO login auto-creates the user (via `User` model), assigns them to the organization (via `Membership`), optionally assigns a default role and default team.
- **Soft delete** — `deletedAt`/`deletedBy` for audit trail. Disabling SSO (`enabled = false`) does not remove the config.

### 3. Add optional teamId to Cargo and TrackingShipment

```diff
 model Cargo {
   id                          String               @id @default(cuid())
   organizationId              String
+  teamId                      String?
   cargoReference              String
   ...

+  team                        Team?                @relation(fields: [teamId], references: [id], onDelete: SetNull)
 }

 model TrackingShipment {
   id                 String                 @id @default(cuid())
   organizationId     String
+  teamId             String?
   referenceCode      String
   ...

+  team               Team?                  @relation(fields: [teamId], references: [id], onDelete: SetNull)
 }
```

- `teamId` is **optional** (`String?`) — existing records and non-team-scoped operations use `null`.
- On delete of a Team, `SetNull` preserves the resource (it becomes visible to all org members).
- Indexes on `(organizationId, teamId)` are added for query performance.

### 4. Indexes added

```prisma
// Cargo
@@index([organizationId, teamId, status])

// TrackingShipment
@@index([organizationId, teamId, status])
```

## Consequences

### Positive

1. ✅ **Feature gating becomes data-driven** — Plans with feature flags can be managed via seed data or admin UI, no code changes needed for new plan tiers
2. ✅ **SSO configurable per organization** — Each enterprise tenant can configure their own IdP without affecting others
3. ✅ **Team scoping reaches the data layer** — `teamId` enables query-level filtering for team-scoped resources (ADR 0015)
4. ✅ **JIT provisioning reduces admin overhead** — Users auto-provisioned on first SSO login with sensible defaults

### Negative

1. ❌ **Migration coordination required** — Adding `planId` to `Subscription`, creating `Plan` seed data, adding `SsoConfig` table, and adding `teamId` to two large tables must be sequenced carefully
2. ❌ **Existing data defaults** — Existing subscriptions with `plan = "free"` must be migrated to reference the `Plan` record with `tier = "free"`. Migration script required
3. ❌ **Domain uniqueness on SsoConfig** — If two organizations claim the same domain, the second will fail. Mitigation: validation at the API layer; enterprise customers typically control their own domains
4. ❌ **Prisma schema complexity increases** — More relations, more indexes, more migration files. Schema review becomes more critical

### Complete migration plan

```sql
-- Step 1: Create Plan table and seed data
INSERT INTO plans (id, tier, name, price_monthly, currency, trial_days, features, max_members, max_cargos, max_tracking_events, is_active, created_at, updated_at)
VALUES
  ('plan_free', 'free', 'Free', 0, 'eur', 0, '{}', 5, 50, 1000, true, NOW(), NOW()),
  ('plan_pro', 'pro', 'Professional', 2900, 'eur', 14, '{sso,audit_log,api_access}', 25, 500, 50000, true, NOW(), NOW()),
  ('plan_enterprise', 'enterprise', 'Enterprise', 0, 'eur', 0, '{sso,audit_log,api_access,custom_roles,dedicated_support}', 999999, 999999, 999999, true, NOW(), NOW());

-- Step 2: Create SsoConfig table
CREATE TABLE sso_configs ( ... );  -- Managed by Prisma migration

-- Step 3: Add teamId columns
ALTER TABLE cargo ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE tracking_shipments ADD COLUMN team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX idx_cargo_org_team ON cargo(organization_id, team_id);
CREATE INDEX idx_tracking_org_team ON tracking_shipments(organization_id, team_id);

-- Step 4: Migrate existing subscriptions
UPDATE subscriptions SET plan_id = 'plan_free' WHERE plan = 'free';
UPDATE subscriptions SET plan_id = 'plan_pro' WHERE plan = 'pro';
UPDATE subscriptions SET plan_id = 'plan_enterprise' WHERE plan = 'enterprise';
```

## Compliance

- [ ] `Plan` model added with seed data for free/pro/enterprise
- [ ] `SsoConfig` model added with domain uniqueness, JIT provisioning flags
- [ ] `teamId` added to `Cargo` and `TrackingShipment` models
- [ ] Indexes created for team-scoped queries
- [ ] Migration scripts written and tested
- [ ] `Subscription.plan` migrated to `Subscription.planId` relation
- [ ] Feature gating updated to use `Plan.features` instead of hardcoded checks
- [ ] ADR written for this decision
