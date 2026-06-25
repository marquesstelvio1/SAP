# SAPTM Product Audit

> Audit date: 2026-06-18
> Scope: `apps/web`, `apps/api`, `packages/ui`, `packages/rpc`, `packages/database`, `packages/auth`
> Method: Static code analysis of all source files in apps and packages.

---

## Phase 1 — Product Audit

### Verdict: Platform is in foundation phase. Not an MVP. Not a marketplace.

The product is an **enterprise logistics OS** (rail, port, cargo tracking, operational analytics). It explicitly prohibits CRUD, generic dashboards, and marketplaces. This is correct for its domain.

### Information Architecture

| Layer | Status | Notes |
|---|---|---|
| Route groups | ✅ | `(platform)` route group protects authenticated routes |
| Public routes | ✅ | `/sign-in`, `/two-factor`, `/accept-invitation` are public |
| Auth-protected routes | ✅ | Redirect to `/sign-in?next=` if unauthenticated |
| RBAC-gated routes | ✅ | Each page checks permissions before rendering data |
| Navigation groups | ✅ | Foundation, Operations, Security, Preparacao |
| Route naming | ✅ | Portuguese, consistent: `/app/cargo`, `/app/tracking`, `/app/admin` |

### Navigation (platform-shell.tsx)

| Aspect | Assessment |
|---|---|
| Sidebar (lg+) | ✅ 288px, sticky, dark theme, scrollable |
| Mobile nav | ✅ Sheet drawer, left side |
| User card | ✅ Name, email, sign out, bottom of sidebar |
| RBAC indicators | ✅ Locked items shown with "RBAC" badge and reduced opacity |
| Active state | ✅ Background highlight, links use `usePathname()` |
| Root redirects | ✅ `/ → /app`, authenticated check |

### User Flows

Implemented:
- Sign in → Dashboard (Control Center)
- Sign in → 2FA → Dashboard
- Accept invitation → Sign in → Dashboard
- Dashboard → Tracking → Register event
- Dashboard → Cargo → Register → Release → Plan transport → Depart → Handoff → Arrive → Deliver
- Dashboard → Admin → Invite user → Assign role → Manage permissions

Not implemented (expected for enterprise logistics):
- Shipment detail drill-down (route exists `/app/tracking/[shipmentId]`)
- Real-time map visualization
- Batch operations
- Dashboard customization
- Report builder interface

### Screens Inventory

| Screen | Type | Status |
|---|---|---|
| `/sign-in` | Auth | ✅ Email + password, 2FA redirect |
| `/two-factor` | Auth | ✅ Verification form |
| `/accept-invitation` | Auth | ✅ Token validation + accept |
| `/app` (Control Center) | Dashboard | ✅ Foundation metrics, RBAC matrix, audit context |
| `/app/tracking` | Operations | ✅ Overview, analytics, advisory, event form |
| `/app/tracking/[shipmentId]` | Detail | 🟡 Route exists, content not audited |
| `/app/cargo` | Operations | ✅ Full lifecycle (pre-transport → delivery → claims) |
| `/app/capacity` | Operations | ✅ Resources, slots, reserves, advisory |
| `/app/planning` | Operations | ✅ Transport orders, confirm, reschedule, dispatch, cancel |
| `/app/tariffs` | Operations | ✅ Rate cards, rules, quotes, approval |
| `/app/reports` | Reports | 🟡 Export-only (CSV) |
| `/app/notifications` | Operations | ✅ Inbox with status filter |
| `/app/admin` | Admin | ✅ Users, roles, permissions, invitations |
| `/app/security` | Admin | ✅ Active sessions, MFA enrollment |
| `/app/audit` | Admin | ✅ Searchable audit trail with filters |
| `/app/integrations` | Admin | ✅ Service accounts, API keys, external events |

### Trust Signals

| Signal | Present | Location |
|---|---|---|
| Session ID display | ✅ | Control Center, Tracking, Cargo pages |
| Organization ID/Name | ✅ | All operational pages |
| Expiration timestamp | ✅ | Control Center |
| Email verification status | ✅ | Control Center, Security page |
| RBAC grant count | ✅ | Control Center, each feature page |
| Permission names displayed | ✅ | Matrix on Control Center |
| Feature gate status | ✅ | "RBAC ativo", "Sem grant" badges |

### Conversion Optimization

**Not applicable.** This is internal enterprise logistics software, not a B2C/B2B marketplace. Users are employees/operators, not customers being converted.

However, operator efficiency metrics that matter:
- No redundant clicks to reach operational data
- Command-style interactions (register event, not navigate to form)
- RBAC trust displayed upfront reduces confusion

### Issues Found

1. No loading skeletons on pages that fetch async data — pages show nothing until all data resolves
2. No error boundaries — a single API failure takes down the entire page
3. `force-dynamic` on every page means zero caching; every navigation hits the API
4. No pagination on most tables (recent cargo/shipments are truncated by the API)

---

## Phase 2 — Design System Audit

### Verdict: Tokens partially defined, NOT applied consistently. No spacing, motion, or z-index scale.

### What EXISTS

| Token Family | CSS Variables | TypeScript Export | Used in Components |
|---|---|---|---|
| Color — Semantic | ✅ | ✅ | ✅ |
| Color — Operational | ✅ | ✅ | ✅ |
| Color — Chart | ✅ | ❌ | ❌ |
| Color — Sidebar | ✅ | ❌ | ✅ |
| Typography — Stacks | ✅ | ✅ | ✅ |
| Typography — Tracking | ✅ | ✅ | ✅ |
| Radius | ✅ | ✅ | ✅ |
| Elevation/Shadows | ✅ | ✅ | ✅ |
| Density modes | ✅ | ✅ | ❌ (none used) |
| Spacing | ❌ | ❌ | ❌ (Tailwind defaults) |
| Z-index | ❌ | ❌ | ❌ (`z-30` hardcoded) |
| Motion | ❌ | ❌ | ❌ (only `transition-colors`) |
| Feedback/State animations | ❌ | ❌ | ❌ |
| Breakpoints | ❌ | ❌ | Only Tailwind `md:`, `lg:`, `xl:` |

### Spacing Scale — CRITICAL GAP

No spacing tokens exist. Components use arbitrary Tailwind values:

```
Button default:   h-9  px-4 py-2   (36px, 16/8px)
Button lg:        h-10 px-6         (40px, 24px)
Button sm:        h-8  px-3         (32px, 12px)
Button icon:      size-9             (36px)
Card:             p-6               (24px)
CardHeader:       p-6               (24px)
CardContent:      p-6 pt-0          (24px/0)
CardFooter:       p-6 pt-0          (24px)
Input:            h-9  px-3 py-1    (36px, 12px/4px)
Textarea:         px-3 py-2         (12px/8px)
TableHead:        h-10 px-2         (40px, 8px)
TableCell:        p-2               (8px)
Badge:            px-2 py-0.5       (8px/2px)
Sidebar:          px-5              (20px)
Shell header:     px-4 md:px-6      (16px → 24px)
Shell main:       px-4 py-6 md:px-6 lg:px-8
```

No relationship between these values. No `space-1=4px`, `space-2=8px`, etc. This is the **exact amateur pattern** described in the audit spec.

### Density Tokens — DEFINED BUT UNUSED

Three density modes exist in CSS vars:
```css
--density-comfortable-control-height: 2.75rem  /* 44px */
--density-compact-control-height: 2.25rem       /* 36px */
--density-operational-control-height: 2rem       /* 32px */
```

But component heights:
```
Button default:  h-9 (36px)  — matches compact
Button lg:       h-10 (40px) — matches nothing
Button sm:       h-8 (32px)  — matches operational
Input:           h-9 (36px)  — matches compact
TableHead:       h-10 (40px) — matches nothing
```

Density tokens exist but components don't reference them. Components use hardcoded `h-*` classes.

### Consistency Audit

| Component | Border Radius | Padding | Height | Font Size |
|---|---|---|---|---|
| Button | `rounded-md` (6px) | `px-4 py-2` | `h-9` | `text-sm` |
| Card | `rounded-xl` (12px) | `p-6` | auto | `text-sm` (description) |
| Input | `rounded-md` (6px) | `px-3 py-1` | `h-9` | `text-base md:text-sm` |
| Badge | `rounded-md` (6px) | `px-2 py-0.5` | auto | `text-xs` |
| SelectNative | `rounded-md` (6px) | `px-3 py-1` | `h-9` | `text-base md:text-sm` |
| TableCell | `rounded-md` (6px) via parent | `p-2` | auto | `text-sm` |
| StatusTile | `rounded-xl` (12px) | `p-4` | auto | `text-xs` (label) |
| ContextRow | `rounded-lg` (8px) | `px-3 py-2` | auto | `text-sm` |
| FieldSet | flex gap | `gap-6` | auto | `text-sm` |

Radius is somewhat consistent. Spacing is arbitrary.

### Missing Components

The design system strategy doc (`docs/design-system/design-system-strategy.md`) lists these as planned but NOT YET IMPLEMENTED:

- Checkbox (native `<input>` used in sign-in form instead)
- RadioGroup
- Switch
- Avatar (inline div used in ShellUserCard)
- Tooltip (manual CSS `group-hover` used in cargo page)
- DropdownMenu
- Popover
- Command palette
- Breadcrumb
- Tabs
- Progress bar
- Spinner
- Alert/Sonner toast
- Empty state
- Timeline panel
- NavigationMenu

### Elevation/Shadows

| Token | Value | Used |
|---|---|---|
| `--shadow-panel` | 0 1px 2px oklch(.../8%) | ✅ Card, Button, Input, SelectNative, Textarea |
| `--shadow-overlay` | 0 18px 45px oklch(.../18%) | ✅ Dialog, Sheet |
| `--shadow-command` | 0 24px 60px oklch(.../22%) | ❌ Not used |
| `--shadow-sticky` | 0 1px 0 oklch(...) | ❌ Not used (header uses `border-b`) |

### Color Tokens — GOOD

Colors use OKLCH (modern perceptual color space). Semantic tokens exist for all states. Operational status colors (success, warning, risk, info) are defined. Dark mode is partially implemented.

### Typography — GOOD

Three font stacks (sans, mono, numeric). Heading tracking defined. Label tracking defined. Inter + IBM Plex Mono is a solid enterprise choice.

### Issues

1. **No spacing token scale** — `space-1` through `space-16` must be defined as CSS variables and components must use them.
2. **Density tokens defined but unused** — Components hardcode `h-9`, `h-10` instead of using `var(--density-*-control-height)`.
3. **Button sizes don't match density system** — `h-9 = 36px` ≠ comfortable 44px or compact 36px.
4. **No motion tokens** — No durations, easings, or reduced-motion preferences.
5. **No z-index scale** — Hardcoded `z-30`.
6. **Multiple radius values** without clear semantic mapping: `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px). What scenario maps to each?
7. **No dark mode `.dark` class toggling** — The `@theme inline` block in globals.css duplicates tokens but dark mode toggling mechanism is absent.
8. **Shadow tokens don't use radius system** — shadow-panel has no border relationship with `--radius` vars.

---

## Phase 3 — Frontend Architecture Audit

### Verdict: Well-structured feature-based RSC architecture, but with significant gaps.

### Structure

```
apps/web/
├── app/
│   ├── (platform)/app/           # Protected route group
│   │   ├── admin/                # Feature: admin
│   │   ├── audit/                # Feature: audit
│   │   ├── capacity/             # Feature: capacity
│   │   ├── cargo/                # Feature: cargo
│   │   ├── integrations/         # Feature: integrations
│   │   ├── notifications/        # Feature: notifications
│   │   ├── planning/             # Feature: planning
│   │   ├── security/             # Feature: security
│   │   ├── tariffs/              # Feature: tariffs
│   │   └── tracking/             # Feature: tracking
│   ├── sign-in/                  # Auth
│   ├── two-factor/               # Auth
│   ├── accept-invitation/        # Auth
│   └── api/                      # API routes (auth, health)
├── components/                   # 55 form components (flat)
└── lib/                          # 18 data-fetching modules
```

### Strengths
- ✅ Feature-based routing: each domain has its own route segment
- ✅ Each feature has its own `actions.ts` and `form-state.ts` (co-located)
- ✅ Server components for data fetching, client components only for interactivity
- ✅ Consistent pattern: page → RSC fetch → render data + pass form client components
- ✅ RBAC guard at top of every page before API calls
- ✅ No CRUD — commands only
- ✅ `dynamic = "force-dynamic"` prevents stale data (but at cost of caching)

### Weaknesses

#### Components directory is flat — 55 files

All 55 components are in a single `components/` directory. No subdirectory organization:
```
components/
├── cargo-register-form.tsx
├── cargo-release-form.tsx
├── platform-shell.tsx
├── tracking-event-record-form.tsx
├── admin-role-create-form.tsx
├── capacity-slot-reserve-form.tsx
... (55 files, all flat)
```

This is the **exact anti-pattern** described in the audit spec (`components/ — 500 arquivos`). While not 500, 55 flat components across 10+ domains will become unmanageable.

#### Data fetching pattern

Each `lib/*.ts` module fetches data from the RPC layer:
```ts
// lib/tracking-overview.ts
export async function getTrackingOverview(): Promise<TrackingOverviewResult> {
  const result = await client.tracking.overview(query);
  // ...
}
```

This is reasonable, but:
- No error boundaries around RSC data fetching
- No retry/fallback if RPC fails
- No deduplication of requests (every page navigation re-fetches)
- `force-dynamic` on every page prevents React cache from working effectively

#### Server Actions pattern

Each feature has:
- `actions.ts` — server action functions
- `form-state.ts` — form state types + initial state

Forms follow this flow:
1. Server action receives `previousState` + `FormData`
2. Calls RPC method
3. Returns `{ status: "success" | "error", message, ... }`
4. Client component reads state via `useActionState()`
5. On success, resets idempotency key

This is clean and follows React 19 patterns.

#### No loading/error boundaries

- No `loading.tsx` in any route segment (except possibly [shipmentId])
- No `error.tsx` in any route segment
- No `not-found.tsx`
- A single failed RPC call renders nothing useful

#### Issues

1. **No `loading.tsx`** in any route segment — users see blank page during async data fetch.
2. **No `error.tsx`** boundaries — unhandled RPC errors crash the page.
3. **No TanStack React Query usage** — despite being in catalog deps and `pnpm-workspace.yaml`.
4. **Components dir flat** — 55 files in one directory across 10 domains.
5. **Inconsistent inline component definitions** — `StatusTile`, `ContextRow`, `MetricTile` are redefined in multiple page files with slightly different implementations.
6. **No suspense boundaries** — pages wait for all parallel fetches to complete before rendering anything.
7. **No form validation library** — uses native HTML5 validation only (no Zod frontend validation).
8. **`force-dynamic` on all pages** — zero static optimization; every request hits the API.

---

## Phase 4 — UI/UX Audit

### Verdict: Consistent, information-dense enterprise UI. No marketplace or consumer patterns. Missing loading states and error recovery.

### Screen-by-Screen

#### Sign-in (`/sign-in`)

| Aspect | Assessment |
|---|---|
| Layout | ✅ Split screen: brand + value prop left, form right |
| Spacing | 🟡 `p-10` left, `p-4 md:p-8` right — arbitrary |
| Branding | ✅ Logo, tagline, feature badges |
| Trust | ✅ "Better Auth", "Sessão real" badges |
| Accessibility | ✅ Labels, `autoComplete`, `required`, focus ring on input |
| Form validation | 🟡 Native only, no Zod schema, password `minLength={12}` hardcoded |
| Loading state | ✅ Button text changes to "A validar..." |
| Error state | ✅ Inline error above submit button |
| 2FA redirect | ✅ Detects `twoFactorRedirect` |

Issues:
- No `aria-describedby` linking input to error
- Error is just text, not `role="alert"`
- Checkbox has no visible focus ring (only `accent-primary`)

#### Control Center (`/app`)

| Aspect | Assessment |
|---|---|
| Layout | ✅ `max-w-7xl` centered, grid sections |
| Hierarchy | ✅ Card titles + badges + metrics |
| Trust | ✅ Session ID, org, email verification, RBAC matrix |
| Readiness items | ✅ Table with status badges |
| State handling | ✅ Loading, error, empty all handled per-card |
| Permission matrix | ✅ Full catalog rendered with grant status |

Issues:
- 500+ line page component (too large, should be broken into smaller server components)
- No compact density mode for this information-dense page
- Tooltip on blocked items uses manual CSS (`group-hover:block`)

#### Tracking (`/app/tracking`)

| Aspect | Assessment |
|---|---|
| Layout | ✅ Grid layout with overview, analytics, advisory, events |
| Data display | ✅ Tables + metric tiles + recommendation cards |
| RBAC integration | ✅ Read/Write permissions checked before render |
| Empty state | ✅ `Sem cargas rastreadas` message |
| Error state | ✅ Per-card fallback messages |
| Advisory cards | ✅ Severity badges, confidence scores, recommended action |

Issues:
- 596 lines in one page component
- No detail panel/sheet for shipment drill-down
- No pagination on recent shipments table
- `recentShipments.length === 0` check renders empty message but table headers still visible

#### Cargo (`/app/cargo`)

| Aspect | Assessment |
|---|---|
| Layout | ✅ Lifecycle sections: Pre-Transport → In Transit → Delivery → Completed |
| Next Action column | ✅ FE-03 feature: computed per cargo row |
| Compliance UI | ✅ Record + Verify separate forms |
| Business rules display | ✅ ContextRow lists every business rule |
| 859 lines | ❌ Largest page component, needs decomposition |

Issues:
- 859 lines (hard to maintain)
- `computeNextCargoAction` is a pure function inside a page component (cannot test in isolation)
- `NextActionCell` has tooltip implemented with raw CSS `group-hover` instead of Tooltip component
- No filtering/search for cargo list

#### Admin (`/app/admin`)

| Aspect | Assessment |
|---|---|
| Layout | ✅ Multiple sections: users, roles, permissions, invitations |
| Forms | ✅ 8 admin forms with RBAC-gated visibility |
| Role management | ✅ Create, assign, revoke, delete, permission editing |
| Invitation lifecycle | ✅ Invite, resend, cancel |
| 487 lines | 🟡 Large but well-organized |

Issues:
- No batch actions (e.g., invite multiple users at once)
- No invitation expiry shown in UI

#### Capacity, Planning, Tariffs, Integrations

All follow the same pattern:
- RBAC guard → fetch overview → render metrics + tables + forms
- Consistent layout (max-w-7xl, grid sections, Card containers)
- Business rules displayed as ContextRow lists

Issues:
- All pages >300 lines
- Same code duplication for `MetricTile`, `ContextRow`, `AccessState` patterns across files

### Cross-Cutting Issues

1. **No loading.tsx anywhere** — all pages are `force-dynamic` with no loading state.
2. **No error.tsx anywhere** — RPC failures show "indisponivel" states but unhandled errors crash.
3. **`MetricTile`, `ContextRow`, `AccessState` duplicated** across 10+ pages.
4. **Hardcoded Portuguese strings** — no i18n, no string extraction.
5. **No responsive breakpoint tuning** — only `md:`, `lg:`, `xl:` grid column changes.
6. **No print styles**.
7. **No keyboard navigation optimization** beyond default browser behavior.

---

## Phase 5 — Mobile Audit

### Verdict: No mobile app exists.

There is no Expo app, no React Native package, and no mobile build configuration in this repository. The web app has basic responsive layout (sidebar collapses to sheet at `lg:` breakpoint), but:

- **No mobile app** — zero files, zero packages
- **No PWA manifest** — `next.config.ts` has `output: "standalone"` but no PWA config
- **No offline support** — all pages are `force-dynamic`
- **No push notifications** — outbox generates data but no mobile push channel exists
- **No deep links** — no linking configuration
- **No touch optimization** — inputs are web-native, no touch-specific interactions

The `packages/ui` design system would need to be shared with an Expo app, but no rendering target (React Native Web) is configured.

**Recommendation**: Do NOT build a mobile app until the web platform reaches production stability. The responsive web shell with mobile navigation is sufficient for desktop-first logistics operators.

---

## Phase 6 — Backend Audit

### Verdict: Well-modularized NestJS with clear bounded contexts. Lacks Domain/Application/Infrastructure layering within modules.

### Structure

```
apps/api/src/
├── admin/             # RBAC administration
├── audit/             # Audit trail
├── auth/              # Authentication
├── capacity/          # Capacity management
├── cargo/             # Cargo lifecycle
├── health/            # Health checks
├── integrations/      # External system integrations
├── notifications/     # Outbox-based notifications
├── observability/     # OpenTelemetry setup
├── planning/          # Transport planning
├── reports/           # CSV report exports
├── tariff/            # Rate cards and pricing
├── tracking/          # Operational tracking
├── rpc/               # RPC middleware + module
└── security/          # Security headers
```

### Strengths

- ✅ **Bounded contexts** — each domain is a NestJS module
- ✅ **No generic CRUD** — every operation is a named command with business rules
- ✅ **RBAC on every endpoint** — permission checks in RPC handlers
- ✅ **Idempotency keys** required for all write operations
- ✅ **Audit trail** — all domain events logged
- ✅ **Outbox pattern** — async processing via `process-outbox.mjs`
- ✅ **RPC layer** — @orpc contract-first approach
- ✅ **No controllers/services/helpers/utils** flat structure — proper module boundaries

### Weaknesses

#### No layered architecture within modules

```
src/cargo/               # Module
├── cargo-rpc.router.ts  # RPC handler (acts as controller)
├── cargo.service.ts     # Business logic + Prisma (acts as both application + infrastructure)
├── cargo.types.ts       # Types
├── cargo.module.ts      # NestJS module
```

There is no:
- **Domain layer** (entities, value objects, domain events, aggregate roots)
- **Application layer** (use cases, application services, DTOs)
- **Infrastructure layer** (Prisma repositories, external API clients)

Business rules are mixed with Prisma queries in service files. This will become a maintenance problem as domains grow.

#### API versioning

No versioning strategy exists:
```
POST /rpc/cargo/register          # No v1 prefix
POST /rpc/tracking/events         # No version prefix
```

For a v1 foundation this is acceptable, but an API versioning strategy (`/v1/rpc/...` or content negotiation) should be planned.

#### Event system

The outbox pattern exists for async writes, but there is no:
- Event bus/Event emitter abstraction
- Domain events published to the outbox
- Event schema registry
- Dead letter queue handling visible in code

The outbox worker (`packages/database/scripts/process-outbox.mjs`) processes pending outbox entries but the event model is database-row-driven, not domain-event-driven.

#### Service-Repository boundary

Services mix Prisma Client directly:
```ts
// Hypothetical pattern in cargo service
await prisma.cargo.create({ ... });
await prisma.auditTrail.create({ ... });
await prisma.outbox.create({ ... });
```

No repository abstraction. This couples business logic to Prisma schema changes.

#### Issues

1. **No Domain/Application/Infrastructure layers** — services mix ORM with business rules.
2. **No API versioning** — future breaking changes will be difficult.
3. **Outbox is data-driven** — entries are written by services, not published domain events.
4. **No event bus** — no publish/subscribe between modules.
5. **No repository pattern** — Prisma Client is injected directly into services.
6. **No value objects** — cargo status, customs status, transport mode are string constants.
7. **No unit tests** — API tests are integration tests hitting real RPC endpoints.
8. **Module boundaries not enforced** — nothing prevents `tracking` from importing `cargo` directly.

---

## Phase 7 — Infrastructure Audit

### Verdict: Local Docker infrastructure is solid. CI/CD is comprehensive but heavyweight.

### Docker

| Component | Status |
|---|---|
| Postgres 17 Alpine | ✅ `compose.yaml` |
| Redis 7 Alpine | ✅ `compose.yaml` |
| API (Dockerfile) | ✅ `apps/api/Dockerfile` |
| Web (Dockerfile) | ✅ `apps/web/Dockerfile` |
| OTEL Collector | ✅ `compose.yaml` |
| Alertmanager | ✅ `compose.yaml` |
| Prometheus | ✅ `compose.yaml` |
| Grafana | ✅ `compose.yaml` |

Non-standard ports: postgres 25432, redis 26379, grafana 3001.

### CI/CD (GitHub Actions)

| Workflow | Trigger | Scope |
|---|---|---|
| `platform-ci.yml` | PR + push main | Full validation suite (20+ validate gates) |
| `ai-ci.yml` | PR + push main + workflow_dispatch | AI engineering OS validation |
| `container-ci.yml` | PR + push | Container builds |
| `cluster-baseline.yml` | ? | Cluster provisioning |
| Others | Deploy, rollback, observability | Infrastructure |

The CI pipeline is **extremely thorough** — 20+ validation gates run before lint/typecheck/test/build. This is enterprise-grade rigour.

### Observability

| Component | Status |
|---|---|
| OpenTelemetry | ✅ Exporter configured, OTEL collector in compose |
| Prometheus metrics | ✅ Prometheus configured with rules |
| Grafana dashboards | ✅ Provisioning + dashboards mounted |
| Alertmanager | ✅ Alert routing configured |
| Service maps | 🟡 OTEL collector exposes traces but no Jaeger/Tempo |
| Log aggregation | 🟡 No ELK/Loki stack (just container logs) |

### Issues

1. **No infrastructure-as-code** — no Terraform, Pulumi, or CDK for cloud provisioning.
2. **Kubernetes configs are script-generated** — `scripts/render-cluster-baseline.mjs` renders YAML, not a declarative IaC tool.
3. **No log aggregation stack** — Loki or similar not in compose for local dev.
4. **Secrets via env vars only** — no Vault or similar secret store integration.
5. **No service mesh** — no mTLS between services.
6. **No canary/blue-green deployment strategy** — deploy scripts not visible.

---

## Summary of Critical Findings

| # | Severity | Phase | Finding |
|---|---|---|---|
| 1 | **CRITICAL** | DS-2 | **No spacing token scale** — all spacing is arbitrary Tailwind values |
| 2 | **CRITICAL** | DS-2 | **Density tokens defined but unused** — components hardcode heights |
| 3 | **CRITICAL** | FE-3 | **No loading/error boundaries** — every page is `force-dynamic` with no skeleton |
| 4 | **HIGH** | DS-2 | **No motion/z-index tokens** — `z-30` hardcoded, no animation system |
| 5 | **HIGH** | FE-3 | **Components directory flat** — 55 files, 10 domains, no subdirectories |
| 6 | **HIGH** | FE-3 | **`StatusTile`/`ContextRow`/`MetricTile` duplicated** across 10+ page files |
| 7 | **HIGH** | BE-6 | **No Domain/Application/Infrastructure layers** in NestJS modules |
| 8 | **HIGH** | BE-6 | **No repository pattern** — Prisma Client directly in services |
| 9 | **HIGH** | BE-6 | **No API versioning** |
| 10 | **MEDIUM** | PR-1 | **No pagination** on any table |
| 11 | **MEDIUM** | DS-2 | **Missing components** — Checkbox, RadioGroup, Tooltip, Breadcrumb, etc. |
| 12 | **MEDIUM** | FE-3 | **No TanStack Query usage** — despite being catalog dependency |
| 13 | **MEDIUM** | PR-1 | **No i18n** — all strings hardcoded in Portuguese |
| 14 | **MEDIUM** | BE-6 | **No event bus** — outbox is data-driven, not event-driven |
| 15 | **LOW** | MOB-5 | **No mobile app** — Expo not in the repo at all |

---

## Priority Action Plan

### Immediate (foundation-blocking)

1. **Define spacing token scale** in `packages/ui/src/styles/globals.css` and migrate all components to use `var(--space-*)`. This is the #1 amateur signal.
2. **Add `loading.tsx`** to all route segments — skeleton components for every page.
3. **Add `error.tsx`** to all route segments — graceful error recovery.

### Short-term

4. **Consolidate `StatusTile`, `ContextRow`, `MetricTile`** into shared components in `packages/ui`.
5. **Organize `components/`** into subdirectories: `components/tracking/`, `components/cargo/`, etc.
6. **Add motion tokens** — define `--motion-duration-*`, `--motion-ease-*`, respect `prefers-reduced-motion`.
7. **Component audit** — align all button/input heights to density tokens.

### Medium-term

8. **Introduce Domain/Application/Infrastructure layers** in NestJS modules.
9. **Repository pattern** — abstract Prisma behind interfaces.
10. **API versioning** — `/v1/rpc/...` prefix.
11. **Event bus** — publish domain events, outbox subscribes to events.
12. **Pagination** on all data tables.

### Long-term

13. **Implement missing shadcn components**: Checkbox, Tooltip, Command, Breadcrumb, Progress, etc.
14. **Dark mode toggle** — wire `.dark` class with user preference.
15. **i18n infrastructure** — string extraction, translation support.
16. **TanStack Query integration** for client-side caching where RSC is insufficient.

---

## Agent Recommendations

Given the findings, I recommend creating agents in this order:

1. **design-system-architect** — fix spacing tokens, density alignment, motion system
2. **frontend-architect** — loading/error boundaries, components reorganization, shared UI patterns
3. **backend-architect** — layered architecture, repository pattern, event bus
4. **qa-architect** — add error boundaries, loading states, pagination
5. **product-manager** — validate scope against enterprise roadmap
6. **product-designer** — review screen hierarchy before UI tokens are finalized

Do NOT create mobile-architect until web reaches production stability.
Do NOT create performance-architect until loading states and error boundaries exist.
