# SAPTM Execution Plan — 6-Sprint Roadmap

> Target: Enterprise SaaS Grade (95+/100)
> Duration: 12 weeks (2-week sprints)
> Start: 2026-07-06
> End: 2026-09-25

---

## Execution Strategy

### Parallel Workstreams

```
Stream A: Frontend Foundation (UI/UX)
Stream B: SaaS Platform (Multi-Tenant, Billing, Auth)
Stream C: Backend Architecture (Layers, Events, API)
Stream D: Quality & Governance (Tests, Docs, A11y)
```

### Dependency Map

```
Sprint 1               Sprint 2               Sprint 3
────────               ────────               ────────
A: Error Boundaries    A: Loading States       A: TanStack Query
B: Org Settings        B: Tenant Switcher      B: Teams
C: Spacing Tokens      C: Missing Components   C: Layered Arch (start)
D: Component Extract   D: Pagination           D: Frontend Tests

Sprint 4               Sprint 5               Sprint 6
────────               ────────               ────────
A: Breadcrumb+Timeline A: Profile/Settings     A: Polish
B: Billing (start)     B: Billing (finish)     B: SSO/OAuth
C: Layered Arch (cont) C: Event Bus            C: API Versioning
D: E2E Expansion       D: A11y Audit           D: Storybook
```

### Capacity Planning

| Sprint | Stream A | Stream B | Stream C | Stream D | Total |
|---|---|---|---|---|---|
| 1 | 8 days | 6 days | 5 days | 3 days | 22 days |
| 2 | 8 days | 8 days | 6 days | 3 days | 25 days |
| 3 | 8 days | 8 days | 8 days | 5 days | 29 days |
| 4 | 6 days | 10 days | 8 days | 3 days | 27 days |
| 5 | 8 days | 8 days | 6 days | 5 days | 27 days |
| 6 | 6 days | 6 days | 4 days | 8 days | 24 days |
| **Total** | **44 days** | **46 days** | **37 days** | **27 days** | **154 days** |

---

## Sprint 1: Foundation Gate

**Theme:** Close critical production gaps
**Focus:** Error boundaries, spacing tokens, org settings, component consolidation

### Objectives
1. Eliminate all blank-page crash scenarios (P0-005)
2. Begin spacing token adoption (P1-002)
3. Create organization settings page (P0-002)
4. Extract duplicated inline components (P1-011)

### Tasks

| ID | Stream | Task | Effort | Dependencies | Owner |
|---|---|---|---|---|---|
| S1-01 | A | Add `error.tsx` to all 15 route segments | 2 days | None | Frontend |
| S1-02 | A | Add `global-error.tsx` to root layout | 0.5 day | None | Frontend |
| S1-03 | A | Add `not-found.tsx` to `(platform)` group | 0.5 day | None | Frontend |
| S1-04 | A | Extract MetricTile → `packages/ui` | 0.5 day | None | Frontend |
| S1-05 | A | Extract ContextRow → `packages/ui` | 0.5 day | None | Frontend |
| S1-06 | A | Extract AccessState → `packages/ui` | 0.5 day | None | Frontend |
| S1-07 | A | Replace all inline usages of extracted components | 1 day | S1-04, S1-05, S1-06 | Frontend |
| S1-08 | A | Define spacing token map (Tailwind → CSS vars) | 1 day | None | Design |
| S1-09 | A | Migrate Button, Input, Card to spacing tokens | 2 days | S1-08 | Frontend |
| S1-10 | B | Create Settings layout with sidebar navigation | 2 days | None | Frontend |
| S1-11 | B | Create General Settings page | 2 days | S1-10 | Frontend |
| S1-12 | B | Create Branding Settings page (logo, colors) | 2 days | S1-11 | Frontend |
| S1-13 | C | Define API versioning strategy doc | 0.5 day | None | Backend |
| S1-14 | C | Create domain layer interfaces for Cargo module | 3 days | None | Backend |
| S1-15 | C | Create repository abstraction for Cargo module | 2 days | S1-14 | Backend |
| S1-16 | D | Organize `components/` into subdirectories | 1 day | None | Frontend |
| S1-17 | D | Update AGENTS.md with new patterns | 0.5 day | None | Tech Writer |

### Acceptance Criteria

```
[ ] All 15 route segments have error.tsx showing recovery UI
[ ] Root layout has global-error.tsx
[ ] (platform) route group has not-found.tsx
[ ] MetricTile, ContextRow, AccessState are in packages/ui
[ ] No inline MetricTile/ContextRow/AccessState remain
[ ] Settings page renders with sidebar navigation
[ ] 20+ components use spacing tokens (css variables)
[ ] Cargo module has domain interfaces + repository impl
[ ] components/ is organized into domain subdirectories
```

### Expected Outcome

- Zero crash-on-error scenarios
- 480 lines of duplicated code eliminated
- Organization can edit name, slug, logo
- Cargo module becomes reference for layered architecture
- Spacing consistency begins

---

## Sprint 2: UX Foundation

**Theme:** Loading states, missing components, tenant management
**Focus:** Loading skeletons, breadcrumbs, tooltips, tenant switcher

### Objectives
1. Add loading states to all routes (P1-001)
2. Create Breadcrumb and Tooltip components (P1-003)
3. Implement tenant switcher (P1-005)
4. Begin password reset flow (P1-010)

### Tasks

| ID | Stream | Task | Effort | Dependencies |
|---|---|---|---|---|
| S2-01 | A | Add `loading.tsx` to all 15 route segments | 3 days | S1-01 |
| S2-02 | A | Create Breadcrumb component | 1 day | None |
| S2-03 | A | Implement Breadcrumb in PlatformShell | 1 day | S2-02 |
| S2-04 | A | Create Tooltip component | 0.5 day | None |
| S2-05 | A | Replace all CSS group-hover tooltips | 1 day | S2-04 |
| S2-06 | A | Create Timeline component | 2 days | None |
| S2-07 | A | Implement Timeline in tracking detail page | 1 day | S2-06 |
| S2-08 | B | Multi-org membership model (schema) | 2 days | None |
| S2-09 | B | Create Org Switcher component | 2 days | S2-08 |
| S2-10 | B | Create `/forgot-password` page | 1 day | None |
| S2-11 | B | Create `/reset-password` page | 1 day | S2-10 |
| S2-12 | B | Wire password reset into email flow | 0.5 day | S2-11 |
| S2-13 | C | Create domain layer for Tracking module | 3 days | S1-15 |
| S2-14 | C | Create repository abstraction for Tracking | 2 days | S2-13 |
| S2-15 | D | Add pagination to cargo and tracking tables | 2 days | None |

### Acceptance Criteria

```
[ ] All 15 route segments have loading.tsx with skeletons
[ ] Breadcrumb component built and visible on all pages
[ ] Tooltip component built and used everywhere
[ ] Timeline component built and used on tracking detail
[ ] Org Switcher dropdown in shell — user can switch org
[ ] Password reset flow works end-to-end (email + form)
[ ] Tracking module has domain interfaces + repository
[ ] Cargo and tracking tables have pagination (10/page, 25, 50)
```

### Expected Outcome

- No blank pages during navigation
- Users can navigate hierarchy
- Multi-org users can switch tenants
- Password reset is self-serve

---

## Sprint 3: Data Layer

**Theme:** Client-side data management, team structure, backend refactoring
**Focus:** TanStack Query, Teams feature, layered architecture, frontend tests

### Objectives
1. Set up TanStack Query for client-side data fetching (P1-006)
2. Create Teams management feature (P0-003)
3. Continue layered architecture refactoring (P1-008)
4. Begin frontend component tests (P1-014)

### Tasks

| ID | Stream | Task | Effort | Dependencies |
|---|---|---|---|---|
| S3-01 | A | Set up TanStack Query provider | 0.5 day | None |
| S3-02 | A | Migrate Control Center to TanStack Query | 2 days | S3-01 |
| S3-03 | A | Migrate cargo overview to TanStack Query | 2 days | S3-02 |
| S3-04 | A | Create DataTable async data hook pattern | 1 day | S3-01 |
| S3-05 | B | Create Team model + migration | 2 days | S1-11 |
| S3-06 | B | Create Team management API (RPC + NestJS) | 3 days | S3-05 |
| S3-07 | B | Create Team management UI (list, create, manage members) | 3 days | S3-06 |
| S3-08 | B | Team-scoped role assignment | 2 days | S3-07 |
| S3-09 | C | Create domain layer for Capacity module | 3 days | S1-15 |
| S3-10 | C | Create repository for Capacity module | 2 days | S3-09 |
| S3-11 | C | Create domain layer for Planning module | 2 days | S3-10 |
| S3-12 | D | Write component tests for Button, Input, Dialog | 2 days | None |
| S3-13 | D | Write component tests for MetricTile, ContextRow | 1 day | None |

### Acceptance Criteria

```
[ ] TanStack Query provider configured in web app
[ ] Control Center data fetched via useQuery
[ ] Cargo overview fetches via useQuery
[ ] Team model exists in schema (name, description, orgId)
[ ] Team CRUD via admin UI
[ ] Members can be assigned to teams with team-scoped roles
[ ] Capacity + Planning modules have domain interfaces
[ ] 10+ component tests pass with Vitest
```

### Expected Outcome

- Client-side data caching reduces API calls
- Teams enable enterprise org structure
- 4 of 10 backend modules refactored to layered architecture

---

## Sprint 4: Billing Foundation

**Theme:** Revenue enablement, subscription management, event system
**Focus:** Stripe integration, billing UI, event bus, API versioning

### Objectives
1. Implement Stripe billing integration (P0-001)
2. Create billing UI with plan management (P0-001)
3. Start event bus implementation (P1-009)
4. Create webhook system (P1-012)

### Tasks

| ID | Stream | Task | Effort | Dependencies |
|---|---|---|---|---|
| S4-01 | A | Create Billing layout + navigation | 1 day | S1-10 |
| S4-02 | A | Build usage metering UI | 2 days | None |
| S4-03 | A | Build invoice history UI | 2 days | None |
| S4-04 | A | Build plan comparison modal | 2 days | None |
| S4-05 | B | Stripe integration — product/price setup | 2 days | None |
| S4-06 | B | Subscription model + webhooks | 3 days | S4-05 |
| S4-07 | B | Checkout flow (Stripe Checkout) | 2 days | S4-06 |
| S4-08 | B | Billing portal (Stripe Customer Portal) | 1 day | S4-06 |
| S4-09 | B | Usage metering service | 2 days | S4-06 |
| S4-10 | C | Implement NestJS EventBus | 2 days | None |
| S4-11 | C | Migrate outbox writes to event-driven model | 3 days | S4-10 |
| S4-12 | C | Create Webhook model + delivery worker | 3 days | S4-10 |
| S4-13 | C | Create Webhook configuration API | 2 days | S4-12 |
| S4-14 | D | Write E2E tests for billing flow | 2 days | S4-08 |

### Acceptance Criteria

```
[ ] Stripe integration creates subscriptions
[ ] Plan comparison modal with Free/Pro/Enterprise
[ ] Checkout creates subscription in Stripe + DB
[ ] Invoices display in billing UI
[ ] Usage metering tracks active members + cargo
[ ] EventBus emits typed domain events
[ ] Outbox worker subscribes to events (not DB writes)
[ ] Webhook delivery worker posts to external endpoints
[ ] Webhook CRUD via settings UI
```

### Expected Outcome

- Platform can generate revenue
- Subscriptions managed end-to-end
- Events flow through proper event bus
- Webhooks enable external integrations

---

## Sprint 5: Profile & SSO

**Theme:** User experience completeness, enterprise auth
**Focus:** Profile page, OAuth/SSO, notification preferences, accessibility

### Objectives
1. Create user profile and preferences (P1-004)
2. Implement OAuth providers (P0-004)
3. Notification preferences (P2-002)
4. Accessibility audit and fixes

### Tasks

| ID | Stream | Task | Effort | Dependencies |
|---|---|---|---|---|
| S5-01 | A | Create Profile page (name, email, avatar) | 2 days | None |
| S5-02 | A | Create Password change form | 1 day | None |
| S5-03 | A | Create Notification preferences | 2 days | S5-01 |
| S5-04 | A | Create API tokens (personal) page | 2 days | None |
| S5-05 | A | Migrate Security page to Profile sub-section | 1 day | S5-01 |
| S5-06 | B | Configure OAuth providers (Google, GitHub, Microsoft) | 3 days | None |
| S5-07 | B | Implement SAML/OIDC authentication | 4 days | None |
| S5-08 | B | JIT provisioning for SSO users | 2 days | S5-07 |
| S5-09 | C | Create domain layer for Tariff module | 2 days | S3-11 |
| S5-10 | C | Create domain layer for Admin module | 2 days | S5-09 |
| S5-11 | C | Create repository for Tariff + Admin | 2 days | S5-10 |
| S5-12 | D | WCAG AA audit — automated (axe-core) | 2 days | None |
| S5-13 | D | Fix ARIA labels, roles, descriptions | 2 days | S5-12 |
| S5-14 | D | Keyboard navigation optimization | 2 days | S5-13 |
| S5-15 | D | Add density mode switcher | 1 day | None |

### Acceptance Criteria

```
[ ] Profile page shows/edits name, email, avatar
[ ] Password change works end-to-end
[ ] Notification preferences saved per user
[ ] Personal API tokens can be created/revoked
[ ] Google OAuth sign-in works
[ ] SAML/OIDC authentication works with IdP
[ ] JIT provisions user + org on first SSO login
[ ] Tariff + Admin modules have domain interfaces
[ ] Axe-core audit passes WCAG AA (0 critical, 0 serious)
[ ] Keyboard shortcuts: g+c → cargo, g+t → tracking
[ ] Density switcher changes control heights globally
```

### Expected Outcome

- Complete user profile management
- Enterprise SSO capability
- WCAG AA compliance
- 8 of 10 modules refactored to layered architecture

---

## Sprint 6: Quality & Polish

**Theme:** Final push to 95+/100
**Focus:** Remaining modules, API versioning, Storybook, documentation, final audit

### Objectives
1. Complete layered architecture for remaining modules (P1-008)
2. API versioning deployment (P1-007)
3. Component documentation with Storybook
4. Final enterprise scorecard certification

### Tasks

| ID | Stream | Task | Effort | Dependencies |
|---|---|---|---|---|
| S6-01 | A | Create Help/Documentation center page | 2 days | None |
| S6-02 | A | Create Changelog page | 1 day | None |
| S6-03 | A | Polish: responsive tuning, print styles | 2 days | None |
| S6-04 | A | i18n infrastructure setup | 3 days | None |
| S6-06 | B | Add Feature Flag system | 3 days | None |
| S6-07 | B | Final SSO testing + edge cases | 2 days | S5-07 |
| S6-08 | C | Create domain layer for remaining modules (Integrations, Reports, Notifications) | 4 days | S5-11 |
| S6-09 | C | Implement API versioning (`/v1/rpc/`) | 2 days | None |
| S6-10 | C | Backward compatibility layer | 2 days | S6-09 |
| S6-11 | D | Set up Storybook with all 53 components | 3 days | None |
| S6-12 | D | Write component documentation | 2 days | S6-11 |
| S6-13 | D | Screen reader E2E tests | 2 days | None |
| S6-14 | D | Final enterprise scorecard audit | 1 day | None |

### Acceptance Criteria

```
[ ] All 10 backend modules have domain/application/infrastructure layers
[ ] API has /v1/rpc/ prefix with backward compatibility
[ ] Feature flags toggle via admin UI (per org)
[ ] Help center has 20+ articles covering all modules
[ ] Changelog shows release history
[ ] Storybook documents all 53 components with interactive examples
[ ] i18n infrastructure extracts all strings to JSON
[ ] Print styles defined for reports
[ ] Screen reader tests pass (NVDA, VoiceOver)
[ ] Enterprise scorecard shows 95+/100 in all categories
```

### Expected Outcome

- Complete enterprise SaaS platform
- 95+/100 in all enterprise readiness categories
- Production-ready for multi-tenant deployment
- Comprehensive component documentation

---

## Post-Sprint Backlog (P2/P3 items)

| Item | Priority | Effort | When |
|---|---|---|---|
| Real-time notifications (SSE) | P2 | 3 weeks | Post-Sprint 6 |
| Mobile app (Expo) | P3 | 8 weeks | Q1 2027 |
| Terraform IaC | P2 | 4 weeks | Post-Sprint 6 |
| Sentry integration | P2 | 1 week | Post-Sprint 6 |
| Log aggregation (Loki) | P2 | 2 weeks | Post-Sprint 6 |
| Audit retention policy | P2 | 1 week | Post-Sprint 6 |
| Batch operations | P2 | 3 weeks | Post-Sprint 6 |
| Advanced analytics | P2 | 4 weeks | Q4 2026 |
| AI-assisted logistics | P3 | 12 weeks | 2027 |
| PDF report generation | P2 | 2 weeks | Post-Sprint 6 |
| Onboarding wizard | P3 | 2 weeks | Post-Sprint 6 |
| Rate limiting per-endpoint | P3 | 1 week | Post-Sprint 6 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stripe integration complexity | Medium | High | Start with minimal billing (Free/Pro only) |
| SSO SAML configuration | High | Medium | Use Better Auth built-in SSO support |
| Team model migration | Low | High | Additive only — no breaking schema changes |
| Layered architecture velocity | Medium | Medium | Module-by-module, not big bang |
| Storybook + existing CSS | Low | Medium | Use same Tailwind config |
| Developer capacity | Medium | High | Parallelize streams A-D across team |

---

## Success Criteria (95+/100)

| Category | Current | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Sprint 5 | Sprint 6 |
|---|---|---|---|---|---|---|---|
| Product Strategy | 82 | 82 | 83 | 85 | 88 | 92 | **95** |
| UX | 79 | 82 | 86 | 88 | 90 | 93 | **95** |
| UI | 84 | 86 | 88 | 90 | 92 | 94 | **96** |
| SaaS | 52 | 55 | 60 | 65 | 78 | 88 | **95** |
| Engineering | 86 | 87 | 88 | 89 | 91 | 93 | **95** |
| **Composite** | **77.5** | **79.5** | **82.3** | **85.0** | **88.2** | **92.0** | **95.2** |
