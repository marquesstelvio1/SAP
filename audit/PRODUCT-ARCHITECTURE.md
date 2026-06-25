# SAPTM Product Architecture

> Enterprise-Grade Product Architecture for Multi-Tenant Logistics OS
> Version: 1.0
> Date: 2026-06-22

---

## 1. Information Architecture

### 1.1 Complete Sitemap

```
/ (public)
├── /sign-in                                    # Authentication
│   ├── ?next=                                  # Post-login redirect
├── /two-factor                                # 2FA verification
│   ├── ?next=                                  # Post-2FA redirect
├── /forgot-password                           # [NEW] Password reset request
├── /reset-password                            # [NEW] Password reset with token
│   ├── ?token=                                 # Reset token
├── /accept-invitation                         # Accept org invitation
│   ├── ?token=                                 # Invitation token
├── /api
│   ├── /auth/[...all]                         # Better Auth API
│   └── /health                                # Health check

/(platform)/app (authenticated)
├── /app                                       # Control Center (Dashboard)
├── /app/operations                            # [NEW] Unified operations hub
│   ├── /app/cargo                             # Cargo lifecycle
│   ├── /app/tracking                          # Operational tracking
│   │   └── /[shipmentId]                      # Shipment detail
│   ├── /app/capacity                          # Capacity management
│   ├── /app/planning                          # Transport planning
│   └── /app/tariffs                           # Tariff/pricing
├── /app/integrations                          # Integration gateway
├── /app/notifications                         # Operational inbox
├── /app/reports                               # CSV reports
├── /app/admin                                 # Identity & RBAC
├── /app/audit                                 # Audit trail
├── /app/security                              # Account security
├── /app/settings                              # [NEW] Organization settings
│   ├── /app/settings/general                  # Org name, branding, logo
│   ├── /app/settings/teams                    # [NEW] Team management
│   ├── /app/settings/billing                  # [NEW] Billing & subscriptions
│   ├── /app/settings/members                  # Member management
│   ├── /app/settings/roles                    # Role & permission management
│   └── /app/settings/webhooks                 # [NEW] Webhook configuration
├── /app/profile                               # [NEW] User profile
│   ├── /app/profile/general                   # Name, email, avatar
│   ├── /app/profile/password                  # Password change
│   ├── /app/profile/preferences               # [NEW] Notification prefs, theme
│   ├── /app/profile/api-keys                  # [NEW] Personal API tokens
│   └── /app/profile/sessions                  # Active sessions (moved from /app/security)
├── /app/help                                  # [NEW] Help & documentation
├── /app/changelog                             # [NEW] Release notes
└── /app/admin/super                           # [NEW] Cross-tenant admin (super admin)
```

### 1.2 Navigation Hierarchy

```
┌─ FOUNDATION ──────────────────────────────┐
│  Control Center                    /app    │
│  Profile                     /app/profile  │
│  Security                   /app/security  │
├─ OPERATIONS ───────────────────────────────┤
│  Operations Hub        /app/operations [NEW]│
│  Cargo Management            /app/cargo     │
│  Tracking                /app/tracking      │
│  Capacity               /app/capacity       │
│  Planning               /app/planning       │
│  Tariffs                 /app/tariffs       │
│  Reports                 /app/reports       │
├─ WORKSPACE ────────────────────────────────┤
│  Notifications       /app/notifications     │
│  Integrations       /app/integrations       │
│  Audit Log               /app/audit         │
│  Settings              /app/settings        │
├─ ADMIN ────────────────────────────────────┤
│  Members               /app/admin           │
│  Roles & Permissions   /app/settings/roles  │
│  Teams          /app/settings/teams [NEW]   │
│  Billing         /app/settings/billing [NEW]│
│  Webhooks      /app/settings/webhooks [NEW] │
└────────────────────────────────────────────┘
```

### 1.3 Route Hierarchy Principles

| Principle | Implementation |
|---|---|
| Depth ≤ 3 | Never more than 3 segments deep (e.g., `/app/cargo/[id]/events`) |
| Plural nouns | `/app/cargo` not `/app/cargo-management` |
| Portuguese | `/app/capacidade` not `/app/capacity` (future i18n) |
| Case | Lowercase kebab-case only |
| Query params | `?page=`, `?search=`, `?status=`, `?filter=` |
| RBAC matching | Route name matches permission prefix (e.g., `/app/cargo` ↔ `cargo.*`) |

---

## 2. Domain Model

### 2.1 Core Entities & Relationships

```
┌────────────────────────────────────────────────────────────────────┐
│                        ORGANIZATION                                │
│  id, name, slug, status, createdAt, updatedAt                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  TEAM (Bounded Group within Org)            [NEW]           │  │
│  │  id, name, description, createdAt                             │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │  MEMBERSHIP (User + Org + Team + Roles)              │   │  │
│  │  │  id, userId, organizationId, teamId?, status, roles   │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Has many: User (via Membership)                                    │
│  Has many: Role (custom roles per org)                              │
│  Has many: AuditRecord                                             │
│  Has many: OutboxEvent                                             │
│  Has many: Notification                                            │
│  Has many: ServiceAccount                                          │
│  Has many: IntegrationEvent                                        │
│  Has many of each domain entity (Cargo, TrackingShipment, etc.)    │
│  Has one: Subscription (billing)                    [NEW]           │
│  Has many: WebhookEndpoint                          [NEW]           │
│  Has many: FeatureFlag                              [NEW]           │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        USER                                        │
│  id, name, email, emailVerified, twoFactorEnabled, image           │
│  Has many: Session                                                 │
│  Has many: Account (OAuth identities)              [NEW]           │
│  Has many: TwoFactor                                                │
│  Has many: Membership (orgs + teams)                               │
│  Has many: ApiToken (personal)                    [NEW]            │
│  Has one: UserPreferences                         [NEW]            │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        SUBSCRIPTION                 [NEW]          │
│  id, organizationId, planId, status, currentPeriodStart,           │
│  currentPeriodEnd, stripeCustomerId, stripeSubscriptionId          │
│  Belongs to: Organization                                          │
│  Has many: Invoice                               [NEW]             │
│  Has many: UsageRecord                           [NEW]             │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        DOMAIN ENTITIES                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐             │
│  │ Cargo        │  │ Tracking     │  │ Capacity      │             │
│  │ - register   │  │ - Shipment   │  │ - Resource    │             │
│  │ - lifecycle  │  │ - Event      │  │ - Slot        │             │
│  │ - compliance │  │ - Exception  │  │ - Reservation │             │
│  │ - handoff    │  │              │  │ - Advisory    │             │
│  │ - claim      │  │              │  │               │             │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘             │
│         │                 │                  │                      │
│         └─────────────────┼──────────────────┘                      │
│                           ▼                                         │
│              ┌──────────────────────┐                               │
│              │ Transport Order      │                               │
│              │ - Planning           │                               │
│              │ - Dispatch           │                               │
│              │ - Schedule Revision  │                               │
│              └──────────────────────┘                               │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bounded Contexts

| Bounded Context | Core Entities | Responsibilities | Events Emitted |
|---|---|---|---|
| **Identity & Access** | Organization, User, Membership, Role, Permission, Team, ServiceAccount | Authentication, authorization, RBAC, org management, SSO | `user.invited`, `user.joined`, `role.assigned`, `team.created` |
| **Cargo** | Cargo, CargoDeliveryException, CargoClaimSettlement, CargoOperationalHandoff, CargoComplianceEvidence | Cargo lifecycle: register → release → plan → depart → handoff → arrive → deliver → claim | `cargo.registered`, `cargo.released`, `cargo.delivered`, `cargo.exception.recorded` |
| **Tracking** | TrackingShipment, TrackingEvent | Shipment visibility, event recording, exception management | `tracking.event.recorded`, `tracking.exception.created`, `tracking.exception.resolved` |
| **Capacity** | CapacityResource, CapacitySlot, CapacitySlotReservation, CapacityAdvisoryDecision | Resource management, slot allocation, reservation, capacity advisory | `capacity.slot.opened`, `capacity.slot.reserved`, `capacity.slot.cancelled`, `capacity.advisory.decided` |
| **Planning** | TransportOrder, TransportOrderDispatch, TransportOrderScheduleRevision | Transport order lifecycle: confirm → dispatch → reschedule → cancel | `planning.order.confirmed`, `planning.order.dispatched`, `planning.order.cancelled` |
| **Tariff** | TariffRateCard, TariffRateRule, TariffQuote | Rate card management, rule configuration, quote calculation/approval | `tariff.rate.card.created`, `tariff.quote.calculated`, `tariff.quote.approved` |
| **Integration** | ServiceAccount, ApiKey, IntegrationEvent | External system adapters, API key management, event ingestion | `integration.event.ingested`, `integration.service.account.created` |
| **Notifications** | Notification, OutboxEvent | In-app notifications, outbox processing, email dispatch, webhook delivery | `notification.created`, `notification.email.sent`, `notification.webhook.failed` |
| **Audit** | AuditRecord | Immutable audit trail with before/after snapshots, search, export | `audit.record.created` (internal) |
| **Billing** [NEW] | Subscription, Invoice, UsageRecord, Price, Plan | Plan management, metering, invoicing, payment processing | `billing.subscription.created`, `billing.invoice.paid`, `billing.usage.reported` |
| **Reports** | (Stateless) | CSV export, scheduled reports, analytics aggregation | `report.exported` |

### 2.3 Domain Events Catalog (Planned)

```typescript
// Identity & Access
"identity.user.invited"           { organizationId, inviteeEmail, roleId, invitedBy }
"identity.user.joined"            { organizationId, userId, membershipId }
"identity.user.removed"           { organizationId, userId, removedBy }
"identity.role.assigned"          { organizationId, userId, roleId, assignedBy }
"identity.role.created"           { organizationId, roleId, permissions }
"identity.team.created"           { organizationId, teamId, name }
"identity.team.member.added"      { organizationId, teamId, userId }

// Cargo
"cargo.registered"                { organizationId, cargoId, cargoReference, cargoType }
"cargo.released"                  { organizationId, cargoId, releaseReference }
"cargo.transport.planned"         { organizationId, cargoId, trackingShipmentId }
"cargo.departed"                  { organizationId, cargoId, departureReference }
"cargo.arrived"                   { organizationId, cargoId, arrivalReference }
"cargo.handoff.completed"         { organizationId, cargoId, handoffType, toOwner }
"cargo.delivered"                 { organizationId, cargoId, deliveryReference }
"cargo.exception.recorded"        { organizationId, cargoId, exceptionType, severity }
"cargo.exception.resolved"        { organizationId, cargoId, resolutionCode }
"cargo.claim.settled"             { organizationId, cargoId, settlementType, amount }
"cargo.compliance.recorded"       { organizationId, cargoId, evidenceType }
"cargo.compliance.verified"       { organizationId, cargoId, status }

// Tracking
"tracking.event.recorded"         { organizationId, shipmentId, eventType, location }
"tracking.exception.created"      { organizationId, shipmentId, exceptionType }
"tracking.exception.resolved"     { organizationId, shipmentId, resolution }

// Billing [NEW]
"billing.subscription.created"    { organizationId, planId, stripeSubscriptionId }
"billing.subscription.updated"    { organizationId, planId, changeType }
"billing.subscription.cancelled"   { organizationId, reason }
"billing.invoice.paid"            { organizationId, invoiceId, amount, currency }
"billing.invoice.past_due"        { organizationId, invoiceId, amount }
"billing.usage.reported"          { organizationId, metric, value, period }
```

---

## 3. Multi-Tenant Architecture

### 3.1 Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION STRATEGY                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Database: Shared PostgreSQL with tenant isolation via           │   │
│  │  `organizationId` on every table (+ composite indexes)            │   │
│  │                                                                   │   │
│  │  Authentication: Shared auth with tenant resolution               │   │
│  │  during sign-in (user selects org or auto-resolves)               │   │
│  │                                                                   │   │
│  │  Session: Tenant ID embedded in Better Auth session               │   │
│  │  after sign-in or org switch                                       │   │
│  │                                                                   │   │
│  │  Authorization: RBAC roles scoped to organization                  │   │
│  │  (org-specific roles + global platform roles for super admin)     │   │
│  │                                                                   │   │
│  │  Data Access: All queries MUST include `organizationId` filter    │   │
│  │  enforced at RPC middleware layer                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Organization Onboarding Flow [NEW]

```
User signs up
    │
    ▼
Create Organization ──► Provide: name, slug, domain (optional)
    │
    ▼
Select Plan ──► Free trial / Paid plan / Enterprise
    │
    ▼
SSO Configuration ──► Optional: SAML/OIDC setup
    │
    ▼
Initial Setup ──► Default roles created
               ──► Admin user assigned tenant.admin
               ──► Welcome tour
```

### 3.3 Multi-Org User Model [NEW]

```
User
  ├── Org A (active)
  │     ├── Role: cargo_operator
  │     └── Team: Warehouse Team
  │
  ├── Org B (switched)
  │     ├── Role: operations_manager
  │     └── Team: Logistics Team
  │
  └── Org C (invited, pending)
        └── Role: not yet assigned

Users can switch organizations via tenant switcher in the shell.
Session token includes current organization context.
```

### 3.4 Team Structure [NEW]

```
Organization
  ├── Team: Warehouse Operations
  │     ├── Manager (role: operations_manager)
  │     ├── Operator 1 (role: cargo_operator)
  │     ├── Operator 2 (role: cargo_operator)
  │     └── Compliance (role: compliance_officer)
  │
  ├── Team: Tracking & Monitoring
  │     ├── Tracking Lead (role: tracking_operator)
  │     └── Analyst (role: operations_viewer)
  │
  └── Team: Finance & Planning
        ├── Finance Manager (role: finance_manager)
        ├── Capacity Planner (role: capacity_planner)
        └── Auditor (role: auditor)
```

### 3.5 Role & Permission Architecture

```typescript
// Current: 12 role templates, 37 permissions
// Future: 15+ role templates, 50+ permissions (including billing, teams, webhooks)

type PlatformPermission =
  // Identity
  | "tenant.manage"
  | "identity.user.invite"
  | "identity.role.assign"
  | "team.manage"              // [NEW]
  | "team.member.manage"       // [NEW]

  // Integration
  | "integration.api_key.manage"
  | "integration.event.ingest"
  | "webhook.manage"           // [NEW]

  // Audit
  | "audit.read"

  // Reports
  | "report.export"

  // Notifications
  | "notification.read"

  // Cargo (8)
  | "cargo.read"
  | "cargo.register"
  | "cargo.release"
  // ... etc

  // Billing [NEW]
  | "billing.view"
  | "billing.manage"
  | "billing.invoices.view"
  | "billing.usage.view"

  // Settings [NEW]
  | "settings.org.edit"
  | "settings.branding.edit"
  | "settings.security.edit"
```

### 3.6 Feature Flag Architecture [NEW]

```typescript
interface FeatureFlag {
  id: string;
  organizationId: string;
  key: string;                       // e.g., "advanced-analytics", "bulk-operations"
  enabled: boolean;
  targetingRules?: TargetingRule[];  // [NEW] Percentage, user segments, dates
  createdAt: Date;
  updatedAt: Date;
}

interface TargetingRule {
  type: "percentage" | "segment" | "date" | "user";
  value: string;                     // e.g., "50" for percentage, "2024-Q3" for date
}
```

### 3.7 Audit Log Architecture (Current + Planned)

| Feature | Current State | Target State |
|---|---|---|
| Actor tracking | ✅ ActorType + actorId | ✅ Same |
| Before/after snapshots | ✅ JSON diff | ✅ Same |
| Correlation ID | ✅ UUID per request | ✅ Same |
| Severity levels | ✅ low/medium/high/critical | ✅ Same |
| Search | ✅ action, subject, actor, severity, date | ✅ Add full-text search on payload |
| Export | ✅ CSV | ✅ CSV + JSON + PDF [NEW] |
| Retention | ❌ Not configured | Configurable TTL per org [NEW] |
| Real-time stream | ❌ Not available | SSE stream for security team [NEW] |
| Alerting | ❌ Not available | Rules: "5 failed logins → alert" [NEW] |

### 3.8 Billing Architecture [NEW]

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BILLING ARCHITECTURE                            │
│                                                                          │
│  Stripe                                                                  │
│    ├── Products ────► Plan (Free, Pro, Enterprise)                       │
│    ├── Prices ──────► Monthly / Annual / Usage-based                     │
│    │                  ├── Base price (per org)                          │
│    │                  ├── Per-seat (per active member)                   │
│    │                  └── Usage (per cargo, per tracking event)         │
│    ├── Subscriptions ──► Subscription record in DB                      │
│    ├── Invoices ─────► Invoice display in billing UI                    │
│    ├── Webhooks ────► stripe.webhook endpoint                           │
│    │                  ├── customer.subscription.updated                  │
│    │                  ├── invoice.paid                                   │
│    │                  ├── invoice.payment_failed                         │
│    │                  └── customer.subscription.deleted                  │
│    └── Customer Portal ──► Stripe-hosted portal for payment methods     │
│                                                                          │
│  Usage Metering                                                          │
│    ├── Active members (count per org)                                    │
│    ├── Cargo registrations (monthly)                                     │
│    ├── Tracking events (monthly)                                         │
│    ├── API calls (monthly)                                               │
│    └── Storage (GB)                                                      │
│                                                                          │
│  Plan Tiers                                                              │
│    ├── Free: 1 org, 5 members, 100 cargo/month                          │
│    ├── Pro: 1 org, 50 members, unlimited cargo                          │
│    ├── Enterprise: Unlimited orgs, SSO, audit retention, SLA             │
│    └── Self-hosted: Flat annual license                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.9 Webhook Architecture [NEW]

```typescript
interface WebhookEndpoint {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  secret: string;                    // HMAC signing secret
  events: string[];                  // ["cargo.registered", "tracking.event.recorded"]
  active: boolean;
  retryConfig: {
    maxRetries: number;              // default: 3
    backoffMs: number;               // exponential backoff base
  };
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  createdAt: Date;
}

// Delivery Worker (extends outbox processor)
// 1. Outbox event published
// 2. WebhookWorker checks subscribed endpoints
// 3. POST to each endpoint with HMAC signature
// 4. Record delivery attempt (success/failure timestamp)
// 5. Retry with exponential backoff on failure
// 6. Dead letter after max retries
```

---

## 4. User Flows

### 4.1 Authentication Flows

```
A. First-time User (No Org)
  Sign Up → Create Org → Select Plan → Configure SSO → Dashboard

B. Invited User
  Accept Invitation → Set Password → Sign In → Dashboard (org context)

C. Returning User (Single Org)
  Sign In → 2FA (if enabled) → Dashboard

D. Returning User (Multiple Orgs)
  Sign In → 2FA (if enabled) → Org Selection → Dashboard

E. SSO User
  Sign In with SSO → Auto-provisioned → Dashboard

F. Password Reset
  Forgot Password → Email Link → Reset Password → Sign In
```

### 4.2 Primary Operational Flows

```
A. Cargo Lifecycle (Complete)
  Register Cargo
    → Release for Transport
    → Plan Transport (creates TrackingShipment)
    → Depart Transport
    → Handoff (custody transfer)
    → Arrive Transport
    → Complete Delivery
    → [If Exception] Record Exception → Resolve Exception
    → [If Damage] Record Claim Settlement

B. Tracking & Monitoring
  View Tracking Overview
    → Filter by Status / Mode / Date
    → Select Shipment → View Timeline
    → Record Event
    → [If Exception] Manage Exception → Resolve Exception

C. Capacity Planning
  Register Resource
    → Open Slot
    → View Advisory Recommendations
    → Make Advisory Decision
    → Reserve Slot
    → [If Needed] Cancel Reservation

D. Transport Planning
  View Orders
    → Confirm Transport Order
    → Reschedule (if needed)
    → Dispatch
    → [If Needed] Cancel

E. Tariff Management
  Create Rate Card
    → Add Rate Rules
    → Calculate Quote
    → Approve/Reject Quote
```

### 4.3 Admin Flows

```
A. Organization Setup
  Edit Org Name
    → Set Branding (Logo, Colors)
    → Configure SSO
    → View Billing & Plan

B. Team Management [NEW]
  Create Team
    → Add Members
    → Assign Team-Scoped Roles
    → Set Team Lead

C. Member Lifecycle
  Invite User
    → Assign Role
    → [Optional] Assign to Team
    → Resend/Cancel Invitation
    → Activate/Suspend/Remove Member

D. Webhook Configuration [NEW]
  Create Endpoint
    → Select Events
    → Test Delivery
    → View Delivery Logs
```

---

## 5. Application States Architecture

### 5.1 Page State Machine

Every page should implement all states:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  LOADING │───▶│  EMPTY   │───▶│  DATA    │───▶│  ERROR   │
│ (skeleton)│   │ (onboarding)│  │ (content)│   │ (retry)  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │               │               │               │
     ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                   OFFLINE STATE                          │
│              (stale data + offline indicator)             │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Component State Pattern

Every interactive component should implement:

```typescript
type ComponentState =
  | { status: "idle" }                                    // Initial, no interaction
  | { status: "loading"; progress?: number }               // Operation in progress
  | { status: "success"; data: unknown; timestamp: Date }  // Operation completed
  | { status: "error"; message: string; code?: string }    // Operation failed
  | { status: "empty"; message: string }                   // No data available
  | { status: "offline"; lastSynced?: Date }               // No network
```

### 5.3 Form Lifecycle Pattern

```typescript
type FormState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "submitting"; idempotencyKey: string }
  | { status: "success"; message: string; result: unknown }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "confirming"; message: string }   // For destructive actions
```

---

## 6. Performance Budget

| Metric | Target | Current (Estimated) |
|---|---|---|
| Time to First Paint (TTFP) | < 1.5s | ~2s (force-dynamic) |
| First Contentful Paint (FCP) | < 2s | ~2.5s |
| Largest Contentful Paint (LCP) | < 2.5s | ~3s |
| Time to Interactive (TTI) | < 3.5s | ~4s |
| First Input Delay (FID) | < 100ms | ~50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.1 |
| API response time (p95) | < 500ms | ~300ms |
| Page weight (JS) | < 300KB | ~400KB |

---

## 7. Technology Stack — Target Architecture

| Layer | Current | Target | Priority |
|---|---|---|---|
| Frontend Framework | Next.js 16 (App Router) | Same | — |
| UI Components | shadcn/ui + Tailwind 4 | Same | — |
| Client State | URL params only | TanStack Query + URL params | P1 |
| Form Validation | HTML5 native | Zod + react-hook-form | P1 |
| Backend Framework | NestJS 11 | Same | — |
| RPC Layer | @orpc/server + @orpc/client | Same | — |
| ORM | Prisma 6 | Same | — |
| Auth | Better Auth | Same + SSO/OAuth | P0 |
| Billing | None | Stripe | P0 |
| Feature Flags | None | Unleash / LaunchDarkly | P1 |
| Event Bus | None | NestJS EventBus + Outbox | P1 |
| Caching | In-memory + Redis | Same + TanStack Query cache | P1 |
| Real-Time | None | SSE + WebSocket | P2 |
| Search | CSV only | Meilisearch / Typesense | P2 |
| Queue | Outbox (polling) | Bull/BullMQ + Redis | P2 |
| Monorepo | Turborepo + pnpm | Same | — |
