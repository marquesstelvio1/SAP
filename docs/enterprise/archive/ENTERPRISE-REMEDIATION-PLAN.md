# Enterprise Remediation Plan — SAPTM

> Based on: PRODUCT-AUDIT.md (2026-06-18)
> Coverage: Fase 1-7, verified against source code in `apps/web`, `apps/api`, `packages/ui`, `packages/rpc`, `packages/database`, `packages/auth`

---

## Classification

| Priority | Meaning | Expected SLA |
|---|---|---|
| **P0** | Blocking production stability or visual identity. Signals amateur quality. | Resolve before any new feature ships. |
| **P1** | High architectural or UX debt. Will block velocity if deferred. | Resolve within next 2-3 sprints. |
| **P2** | Important but not blocking. Address after P0/P1 are closed. | Plan for next quarter. |
| **P3** | Desirable enterprise capability. No immediate risk. | Backlog, no deadline. |

---

## P0 — Critical (7 items)

### P0-1: Spacing token scale is undefined (DS-2)

**Source:** `packages/ui/src/styles/globals.css`, all component files

**Problem:** Components use arbitrary Tailwind classes (`p-3`, `p-4`, `p-5`, `p-6`, `px-4`, `gap-3`, `gap-6`, etc.) with no relationship between values. No `--space-*` CSS variable family exists. This is the single strongest amateur signal in the entire codebase.

**Remediation:**

1. Define spacing scale in `packages/ui/src/styles/globals.css`:
```css
--space-1: 0.25rem;   /*  4px */
--space-2: 0.5rem;    /*  8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

2. Export in `packages/ui/src/tokens/index.ts`.

3. Register as Tailwind theme tokens via `@theme inline { --space-*: var(--space-*); }`.

4. Migrate every component in `packages/ui/src/components/*.tsx` to use token-based spacing (`p-[var(--space-4)]` → then via Tailwind `p-4` mapped to token).

5. Migrate `apps/web/components/*.tsx` and `apps/web/app/**/page.tsx` inline spacing.

**Agent:** design-system-architect
**Files affected:** `packages/ui/src/styles/globals.css`, `packages/ui/src/tokens/index.ts`, `packages/ui/src/components/*.tsx`, `apps/web/components/*.tsx`, `apps/web/app/**/page.tsx`
**Verification:** No `p-<arbitrary>`, `px-<arbitrary>`, `gap-<arbitrary>` without token backing.

---

### P0-2: Density tokens defined but unused (DS-2)

**Source:** `packages/ui/src/styles/globals.css` (lines 52-60), `packages/ui/src/components/button.tsx` (line 22)

**Problem:** `--density-comfortable-control-height: 2.75rem`, etc. are defined as CSS variables and exported in TypeScript, but every component hardcodes `h-9`, `h-10`, `h-8` instead of referencing them.

**Remediation:**

1. Create a `data-density` attribute-based approach or Tailwind variant for density modes.

2. Migrate components:
   - `Button`: replace `h-9` with `var(--density-comfortable-control-height)` etc.
   - `Input`, `SelectNative`: same pattern
   - `TableHead`: replace `h-10` with density row-height token

3. Expose density as a prop on form components, defaulting to "comfortable".

**Agent:** design-system-architect
**Files affected:** `packages/ui/src/components/button.tsx`, `input.tsx`, `select-native.tsx`, `table.tsx`, `globals.css`
**Verification:** No hardcoded `h-*` in components; all control heights reference density tokens.

---

### P0-3: Loading boundaries absent (FE-3 / UX-4)

**Source:** `apps/web/app/**/page.tsx` (all pages)

**Problem:** Every page uses `dynamic = "force-dynamic"` with async RSC data fetching, but zero pages have a `loading.tsx` file. Users see a blank white page until all API calls resolve. On slow connections this looks broken.

**Remediation:**

1. Add `loading.tsx` to every route segment:
```tsx
export default function Loading() {
  return <div className="flex flex-col gap-4 p-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  </div>;
}
```

2. Routes needing `loading.tsx`:
   - `/app`
   - `/app/tracking`
   - `/app/tracking/[shipmentId]`
   - `/app/cargo`
   - `/app/capacity`
   - `/app/planning`
   - `/app/tariffs`
   - `/app/admin`
   - `/app/security`
   - `/app/audit`
   - `/app/integrations`
   - `/app/notifications`
   - `/sign-in`
   - `/two-factor`

3. Create shared skeleton components in `packages/ui` (MetricTileSkeleton, TableSkeleton, CardSkeleton).

**Agent:** frontend-architect
**Files affected:** All route segments (create `loading.tsx` in each), `packages/ui/src/components/skeleton.tsx` (enhance)
**Verification:** Every route segment with `force-dynamic` has a sibling `loading.tsx`.

---

### P0-4: Error boundaries absent (FE-3 / UX-4)

**Source:** `apps/web/app/**/page.tsx`

**Problem:** Zero `error.tsx` files exist. If any RPC call throws (network error, timeout, 500), the entire page crashes with no recovery UI. The "indisponivel" states only handle the `status: "error"` result type, not actual thrown exceptions.

**Remediation:**

1. Add `error.tsx` to each route segment:
```tsx
"use client";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorCard title="Erro inesperado" message={error.message} onRetry={reset} />;
}
```

2. Create `packages/ui/src/components/error-card.tsx` as a reusable error boundary component.

3. Same route list as P0-3.

**Agent:** frontend-architect
**Files affected:** All route segments (create `error.tsx` in each), `packages/ui/src/components/`
**Verification:** Every route segment with `force-dynamic` has a sibling `error.tsx`.

---

### P0-5: Motion / z-index tokens absent (DS-2)

**Source:** `packages/ui/src/styles/globals.css`

**Problem:** No `--motion-*` CSS variables defined. No `--z-*` scale. Currently `z-30` is hardcoded in `platform-shell.tsx` for the sticky header. Animations use bare `transition-colors`, `transition-opacity`, `transition-transform` without shared easing or duration tokens.

**Remediation:**

1. Add motion tokens:
```css
--motion-duration-fast: 150ms;
--motion-duration-normal: 200ms;
--motion-duration-slow: 300ms;
--motion-ease-linear: linear;
--motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
--motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
--motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

2. Add z-index scale:
```css
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
```

3. Export in `packages/ui/src/tokens/index.ts`.

4. Update components to use token-based transitions: `transition-[color,box-shadow] duration-[var(--motion-duration-fast)]`.

**Agent:** design-system-architect
**Files affected:** `globals.css`, `tokens/index.ts`, `platform-shell.tsx`, dialog.tsx, sheet.tsx
**Verification:** No bare `transition-*` without duration/easing tokens. No hardcoded `z-*`.

---

### P0-6: Duplicated inline components across pages (FE-3 / UX-4)

**Source:** `apps/web/app/(platform)/app/tracking/page.tsx`, `cargo/page.tsx`, `admin/page.tsx`, `capacity/page.tsx`, `planning/page.tsx`, `tariffs/page.tsx`, `notifications/page.tsx`, and others.

**Problem:** `StatusTile`, `ContextRow`, `MetricTile`, `AdminAccessState`, `TrackingAccessState`, `CargoAccessState` are redefined in every page file with slightly different implementations:
- Cargo uses `rounded-xl border bg-card p-4` for MetricTile
- Admin uses `rounded-lg border bg-muted/35 p-4` for MetricTile
- Tracking uses `rounded-xl border bg-card p-4` for MetricTile (same as Cargo)
- ContextRow variants: `bg-muted/30`, `bg-muted/35`, `bg-muted/40`

**Remediation:**

1. Create shared components in `packages/ui/src/components/`:
   - `metric-tile.tsx` — universal metric display
   - `context-row.tsx` — key-value row
   - `access-state.tsx` — blocked/error state card
   - `badge-group.tsx` — wrapping badge row pattern

2. Replace all inline definitions with imports from `@saptm/ui`.

3. Enforce via code review: no inline `div className="rounded-xl border bg-card p-4"` patterns in page files.

**Agent:** frontend-architect
**Files affected:** `packages/ui/src/components/` (new files), `apps/web/app/(platform)/app/*/page.tsx`
**Verification:** grep for `rounded-xl border bg-card p-4` returns 0 results in page files.

---

### P0-7: Flat components directory (FE-3)

**Source:** `apps/web/components/` (55 files)

**Problem:** All 55 components are in a single flat directory. No namespace, no subdirectory organization. As more features are added this will grow to 200+ files in one folder.

**Remediation:**

1. Organize into domain subdirectories:
```
components/
├── auth/              # sign-in-form, two-factor-verification, invitation-accept
├── shell/             # platform-shell, command-evidence-panel, operational-journey-panel
├── admin/             # admin-* forms
├── cargo/             # cargo-* forms
├── tracking/          # tracking-* forms
├── capacity/          # capacity-* forms
├── planning/          # transport-order-* forms
├── tariff/            # tariff-* forms
├── integration/       # integration-* forms
└── notification/      # notification-mark-read-form
```

2. Update all import paths in page files.

3. Create barrel `index.ts` per subdirectory if helpful, or use direct imports.

**Agent:** frontend-architect
**Files affected:** `apps/web/components/*`, `apps/web/app/**/page.tsx`
**Verification:** `fs.readdir("components/")` returns only directories, no `.tsx` files.

---

## P1 — High Impact (8 items)

### P1-1: No Domain/Application/Infrastructure layers in NestJS (BE-6)

**Source:** `apps/api/src/*/`

**Problem:** Each module mixes RPC handler, business logic, and Prisma queries in the same service file. Example: `src/cargo/cargo.service.ts` likely contains `prisma.cargo.create()`, `prisma.auditTrail.create()`, and business rule validation in one function.

**Remediation:**

1. Introduce per-module structure:
```
src/cargo/
├── domain/
│   ├── cargo.entity.ts         # Aggregate root with value objects
│   ├── cargo-status.enum.ts
│   ├── cargo.repository.ts     # Interface / port
│   └── cargo.events.ts         # Domain events
├── application/
│   ├── register-cargo.use-case.ts
│   ├── release-cargo.use-case.ts
│   ├── plan-transport.use-case.ts
│   └── cargo.dto.ts
├── infrastructure/
│   ├── prisma-cargo.repository.ts
│   └── cargo.module.ts
└── rpc/
    └── cargo-rpc.router.ts
```

2. Start with one module (e.g., `cargo`) as proof-of-concept, then expand.

**Agent:** backend-architect
**Files affected:** `apps/api/src/cargo/*` (refactor), then other modules
**Verification:** Service files no longer import `@prisma/client` directly.

---

### P1-2: No repository pattern (BE-6)

**Source:** `apps/api/src/*/`

**Problem:** Prisma Client is injected directly into service files. Business logic is coupled to Prisma's API. Schema changes force service changes.

**Remediation:**

1. Define repository interfaces in each module's `domain/` directory:
```ts
export interface CargoRepository {
  findById(id: string): Promise<Cargo | null>;
  save(cargo: Cargo): Promise<void>;
  // ...
}
```

2. Implement in `infrastructure/`:
```ts
export class PrismaCargoRepository implements CargoRepository {
  constructor(private prisma: PrismaClient) {}
  // ...
}
```

3. Register in NestJS DI with `useClass`.

**Agent:** backend-architect
**Files affected:** All domain modules in `apps/api/src/*/`
**Verification:** Services depend on repository interfaces, not Prisma Client.

---

### P1-3: No API versioning (BE-6)

**Source:** `apps/api/src/rpc/*`

**Problem:** Routes are flat: `POST /rpc/cargo/register`. No version prefix means breaking changes are undefined.

**Remediation:**
1. Configure RPC middleware to support `/v1/rpc/*` prefix.
2. Current routes become `/v1/rpc/*`.
3. Document versioning strategy in ADR.

**Agent:** backend-architect
**Files affected:** `apps/api/src/rpc/rpc-http.middleware.ts`
**Verification:** `GET /v1/rpc/health` returns 200.

---

### P1-4: Page components exceed 500 lines (FE-3 / UX-4)

**Source:** `apps/web/app/(platform)/app/cargo/page.tsx` (859 lines), tracking/page.tsx (596 lines), admin/page.tsx (487 lines)

**Problem:** Page files are too large to maintain. Inline functions like `computeNextCargoAction` cannot be unit tested.

**Remediation:**

1. Extract section components from each page into `components/<domain>/`:
   - `cargo-overview-metrics.tsx`
   - `cargo-lifecycle-section.tsx`
   - `cargo-business-rules-card.tsx`
   - `tracking-analytics-section.tsx`
   - `tracking-advisory-section.tsx`

2. Extract business logic into `<domain>/logic.ts` files:
   - `cargo/logic.ts` — `computeNextCargoAction`, `resolveCargoStatusVariant`
   - `tracking/logic.ts` — `resolveStatusVariant`, `resolveAdvisorySeverityVariant`

3. Target: no page file >200 lines.

**Agent:** frontend-architect
**Files affected:** `apps/web/app/(platform)/app/cargo/page.tsx`, `tracking/page.tsx`, `admin/page.tsx`
**Verification:** Maximum page file size ≤200 lines.

---

### P1-5: No pagination on data tables (PR-1)

**Source:** All list displays in `apps/web/app/(platform)/app/*/page.tsx`

**Problem:** Tables like "Recent shipments", "Recent cargo", "Recent members" show only the first N items with no pagination controls. The API may truncate large datasets.

**Remediation:**

1. Add `offset` and `limit` query params to RPC endpoints.

2. Create a shared `Pagination` component in `packages/ui`.

3. Add pagination state to each list:
   - `overview.recentShipments` → paginated shipment list
   - `overview.recentCargo` → paginated cargo list
   - `overview.users` → paginated user list

4. Default page size: 25 (operational density), configurable to 10/50/100.

**Agent:** frontend-architect + backend-architect
**Files affected:** `packages/rpc/src/*.ts`, `packages/ui/src/components/pagination.tsx`, `apps/web/lib/*.ts`, page files
**Verification:** API supports `offset`/`limit`; UI renders pagination controls.

---

### P1-6: Event bus absent — outbox is data-driven, not event-driven (BE-6)

**Source:** `packages/database/scripts/process-outbox.mjs`

**Problem:** Outbox entries are written directly by services (`prisma.outbox.create({...})`). There is no domain event that services publish to, and no event bus that subscribers listen to. This couples modules to the outbox table schema.

**Remediation:**

1. Define a TypeScript `DomainEvent` interface and event types per module.

2. Create an `EventBus` interface:
```ts
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}
```

3. Implement `OutboxEventBus` that writes to the outbox table.

4. Services publish domain events instead of writing directly to outbox.

5. The outbox worker consumes from the outbox table (unchanged).

**Agent:** backend-architect
**Files affected:** `packages/database/src/`, `apps/api/src/*/`
**Verification:** Services call `eventBus.publish()`, not `prisma.outbox.create()`.

---

### P1-7: No form validation library (FE-3 / UX-4)

**Source:** `apps/web/app/sign-in/sign-in-form.tsx`, all form components

**Problem:** Forms use native HTML5 validation only (`required`, `minLength={12}`, `type="email"`). No Zod schema validation on the client side. Server actions do validate via RPC contracts, but the UX feedback is delayed until round-trip.

**Remediation:**

1. Re-export Zod from `@saptm/rpc` for frontend use.

2. Create a `useValidatedForm` hook or integrate Zod with `useActionState`:
```ts
const formSchema = z.object({ email: z.string().email(), password: z.string().min(12) });
```

3. Validate before submit, show inline errors immediately.

4. Create a `FormMessage` component for field-level validation feedback.

**Agent:** frontend-architect
**Files affected:** `packages/ui/src/components/`, `apps/web/components/*.tsx`
**Verification:** Every form has client-side Zod validation mirroring RPC contract.

---

### P1-8: Missing shared shadcn components (DS-2)

**Source:** `packages/ui/src/components/` vs `docs/design-system/design-system-strategy.md`

**Problem:** The strategy doc lists Checkbox, RadioGroup, Switch, Avatar, Tooltip, DropdownMenu, Popover, Command, Breadcrumb, Tabs, Progress, Spinner, Alert as needed. None exist. Instead:
- Checkbox: native `<input>` in sign-in form
- Tooltip: manual CSS `group-hover` in cargo page
- Avatar: inline `div` in shell

**Remediation:**

1. Install missing shadcn components via `pnpm dlx shadcn@latest add checkbox radio-group switch avatar tooltip dropdown-menu popover command breadcrumb tabs progress alert`.

2. Ensure they export from `packages/ui/src/components/index.ts`.

3. Replace inline implementations:
   - Sign-in checkbox → Checkbox component
   - Cargo `NextActionCell` tooltip → Tooltip component
   - ShellUserCard avatar → Avatar component

**Agent:** design-system-architect
**Files affected:** `packages/ui/src/components/`, `apps/web/components/platform-shell.tsx`, `apps/web/app/sign-in/sign-in-form.tsx`, `apps/web/app/(platform)/app/cargo/page.tsx`
**Verification:** No native `<input type="checkbox">`, no `group-hover` tooltips in app code.

---

## P2 — Medium Impact (7 items)

### P2-1: No TanStack Query usage (FE-3)

**Source:** `apps/web/lib/*.ts`, all RSC data fetching

**Problem:** `@tanstack/react-query` is a catalog dependency (`pnpm-workspace.yaml`) but is never imported anywhere. All data fetching is done in RSC, which is correct for the current architecture, but there is no client-side caching layer for scenarios that need it (polling, background refetch, optimistic updates on forms).

**Remediation:**
1. Create a `QueryProvider` wrapper in the platform layout.
2. For form submission results that need to update the UI without full page reload, use TanStack Query's `useMutation` + `invalidateQueries`.
3. Do NOT replace RSC fetching — supplement where cacheable data is needed on the client.

**Agent:** frontend-architect
**Files affected:** `apps/web/app/layout.tsx`, `apps/web/lib/query-client.ts`
**Verification:** `import { useQuery } from "@tanstack/react-query"` exists somewhere in app code.

---

### P2-2: No i18n infrastructure (PR-1)

**Source:** All `apps/web/` files

**Problem:** All user-facing strings are hardcoded in Portuguese. No i18n library, no string extraction, no translation file. Expanding to other languages requires rewriting every component.

**Remediation:**
1. Add `next-intl` or `react-intl` as dependency.
2. Extract all strings from pages and components into `messages/pt.json`.
3. Create translation types.
4. Add locale detection and switching to the platform shell.
5. Do NOT block current development — implement incrementally.

**Agent:** frontend-architect
**Files affected:** `apps/web/` (global), `packages/ui/src/components/` (if components contain strings)
**Verification:** `grep -r '"' apps/web/app/**/page.tsx` shows only dynamic strings.

---

### P2-3: No unit tests — API tests are all integration (BE-6)

**Source:** `apps/api/tests/*.test.mjs`

**Problem:** All tests hit real RPC endpoints. There are no unit tests for business rules, use cases, or domain logic. This makes testing edge cases slow and brittle.

**Remediation:**
1. Extract business rules into testable pure functions.
2. Write `node --test` unit tests alongside business logic files.
3. Example: `computeNextCargoAction` → unit test without Prisma.

**Agent:** qa-architect
**Files affected:** `apps/api/src/*/`, `apps/api/tests/`
**Verification:** Domain logic files have co-located `.test.mjs` files.

---

### P2-4: No dark mode toggle (DS-2)

**Source:** `packages/ui/src/styles/globals.css`

**Problem:** Dark mode CSS variables are defined in `.dark {}` class, but there is no mechanism to toggle it. No theme switch in the UI, no `prefers-color-scheme` detection, no persistence.

**Remediation:**
1. Add `ThemeProvider` component using `next-themes` or similar.
2. Apply `.dark` class based on `prefers-color-scheme` and user preference.
3. Add theme toggle to the platform shell (header or user dropdown).
4. Persist choice in localStorage.

**Agent:** design-system-architect
**Files affected:** `apps/web/app/layout.tsx`, `apps/web/app/(platform)/layout.tsx`, `apps/web/components/platform-shell.tsx`
**Verification:** Toggling theme switch changes all CSS variables.

---

### P2-5: No log aggregation in local dev (INFRA-7)

**Source:** `compose.yaml`

**Problem:** Local dev has no log aggregation stack. Debugging across api/web/postgres/redis requires reading individual `docker logs`. No Loki, no structured log shipping.

**Remediation:**
1. Add Loki and promtail (or Grafana Alloy) to `compose.yaml`.
2. Configure app log shipping via OpenTelemetry or file tail.
3. Add Loki datasource to Grafana.

**Agent:** devops-architect
**Files affected:** `compose.yaml`, `deploy/observability/`
**Verification:** `docker compose logs loki` shows ingested logs from api and web.

---

### P2-6: No infrastructure-as-code for cloud provisioning (INFRA-7)

**Source:** `deploy/`, `scripts/render-cluster-baseline.mjs`

**Problem:** Kubernetes configs are generated by a script (`render-cluster-baseline.mjs`). No Terraform, Pulumi, or CDK for cloud resource provisioning (databases, VPCs, load balancers, DNS).

**Remediation:**
1. Define cloud provider resources in Terraform.
2. Migrate Kubernetes manifests from script-generated to Terraform/Terraform + Helm.
3. Document in `docs/devops/`.

**Agent:** devops-architect
**Files affected:** `deploy/` (new terraform directory), `scripts/render-cluster-baseline.mjs` (deprecated)
**Verification:** `terraform plan` shows infrastructure resources.

---

### P2-7: No keyboard navigation optimization (UX-4)

**Source:** All interactive components

**Problem:** Forms have basic keyboard support (Tab between fields) but no keyboard shortcuts, no `role` attributes beyond defaults, no skip-to-content link, no announcement of dynamic content changes (no live regions).

**Remediation:**
1. Add skip-to-content link as first focusable element.
2. Audit all forms for `aria-describedby`, `aria-invalid`, `role="alert"` on errors.
3. Add `aria-live="polite"` to dynamic update regions (form submission results).
4. Consider Command/Cmd+K palette for power users.

**Agent:** accessibility-expert
**Files affected:** `apps/web/app/(platform)/layout.tsx`, all form components
**Verification:** Lighthouse accessibility audit passes for keyboard navigation.

---

## P3 — Improvements (5 items)

### P3-1: No mobile app (MOB-5)

**Source:** Entire repository

**Problem:** No Expo app, no React Native target. The `packages/ui` design system would need to be shared.

**Remediation:**
1. Do NOT implement until web platform reaches production stability.
2. When ready, create `apps/mobile/` with Expo.
3. Share `packages/ui` components via React Native Web compat layer.
4. Configure deep links to match web routes.

**Agent:** mobile-architect (future)
**Blocked by:** P0-1, P0-2, P0-3, P0-4, P1-1, P1-2

---

### P3-2: No value objects — status as string constants (BE-6)

**Source:** `apps/api/src/*/*.types.ts`, `apps/web/app/(platform)/app/*/page.tsx`

**Problem:** Cargo status, customs status, transport mode, and event types are defined as `const` objects with string values. No TypeScript `enum` or branded types.

**Remediation:**
1. Migrate to TypeScript `enum` or branded types in `packages/types`.
2. Export from `@saptm/types`.
3. Use in both API contracts and frontend displays.

**Agent:** backend-architect
**Files affected:** `packages/types/src/`, `apps/api/src/*/`, `apps/web/`
**Verification:** `s/string/"branded type"/g` for domain status values.

---

### P3-3: No module boundary enforcement (BE-6)

**Source:** All NestJS modules

**Problem:** Nothing prevents `TrackingModule` from importing `CargoModule` or any cross-module dependency. Over time this will produce circular dependencies and spaghetti.

**Remediation:**
1. Document module dependency rules in ADR.
2. Add ESLint rule or use NestJS module boundary analysis.
3. Enforce: domains may depend on `AuthModule`, `RpcModule`, `ObservabilityModule` but not on other domains.

**Agent:** backend-architect
**Files affected:** ADR, `turbo.json` (add lint rule)
**Verification:** `nx graph` shows only allowed dependencies.

---

### P3-4: No print styles (UX-4)

**Source:** All CSS

**Problem:** No `@media print` styles anywhere. Operational reports cannot be printed cleanly.

**Remediation:**
1. Add `@media print` rules to `globals.css`:
   - Hide sidebar, header, navigation
   - Show card content full-width
   - Ensure table borders print

**Agent:** design-system-architect
**Files affected:** `packages/ui/src/styles/globals.css`
**Verification:** Print preview hides chrome and shows data.

---

### P3-5: No PWA manifest (PR-1)

**Source:** `apps/web/`

**Problem:** Next.js `output: "standalone"` is not PWA. No `manifest.json`, no service worker, no offline support.

**Remediation:**
1. Add `next-pwa` or `@serwist/next`.
2. Generate `manifest.json` with app name, icons, theme color.
3. Register service worker for static asset caching (not API calls).

**Agent:** frontend-architect
**Files affected:** `apps/web/next.config.ts`, `apps/web/public/`
**Verification:** Lighthouse PWA badge passes.

---

## Execution Order

```
Sprint 1   │ P0-1, P0-2, P0-5  │ Design System: spacing, density, motion tokens
           │ P0-3, P0-4         │ Frontend: loading + error boundaries
           │────────────────────│────────────────────────────────────
Sprint 2   │ P0-6, P0-7         │ Frontend: shared components, flat dir fix
           │ P1-4               │ Frontend: decompose 500+ line pages
           │────────────────────│────────────────────────────────────
Sprint 3   │ P1-1, P1-2, P1-6  │ Backend: layered architecture, repos, event bus
           │────────────────────│────────────────────────────────────
Sprint 4   │ P1-3, P1-8        │ Backend: API versioning; DS: missing components
           │ P1-5               │ Pagination for all tables
           │────────────────────│────────────────────────────────────
Sprint 5   │ P1-7               │ Form validation library
           │ P2-1, P2-2, P2-3  │ TanStack Query, i18n, unit tests
           │────────────────────│────────────────────────────────────
Sprint 6   │ P2-4, P2-5, P2-6  │ Dark mode, log aggregation, IaC
           │ P2-7               │ Keyboard navigation + a11y
           │────────────────────│────────────────────────────────────
Backlog    │ P3-1 through P3-5  │ Mobile app, value objects, PWA, etc.
```

## Agent Dispatch

| Agent | Sprint | Assignments |
|---|---|---|
| **design-system-architect** | 1, 4, 6 | P0-1, P0-2, P0-5, P1-8, P2-4, P3-4 |
| **frontend-architect** | 1, 2, 5, 6 | P0-3, P0-4, P0-6, P0-7, P1-4, P1-5, P1-7, P2-1, P2-2, P3-5 |
| **backend-architect** | 3, 4, 5 | P1-1, P1-2, P1-3, P1-6, P2-3, P3-2, P3-3 |
| **qa-architect** | 5 | P2-3 (unit test patterns) |
| **devops-architect** | 6 | P2-5, P2-6 |
| **accessibility-expert** | 6 | P2-7 |
| **mobile-architect** | Backlog | P3-1 (deferred) |

## Verification Gate

After each sprint, run:
```
pnpm lint                  # Biome passes
pnpm typecheck             # tsc --noEmit passes
pnpm test                  # API + RPC tests pass (--filter @saptm/api --filter @saptm/rpc)
pnpm build                 # Both apps build
```

Before closing P0 items, add a visual regression step:
- Compare before/after screenshots of every route in `/app`
- Verify spacing consistency using a design-token diff tool (e.g., `style-dictionary`)
