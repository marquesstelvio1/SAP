# SAPTM Gap Analysis — P0–P3 Classification

> Analysis Date: 2026-06-22
> Total Gaps Identified: **47** (P0: 5, P1: 14, P2: 18, P3: 10)
> Gates to 95/100: **22 critical/high gaps** must be resolved

---

## Classification System

| Priority | Definition | Action Required |
|---|---|---|
| **P0** | Production-blocking. Security vulnerability, data loss risk, or complete feature absence for core business model | Fix immediately before any release |
| **P1** | High business/UX/technical impact. Major missing feature or significant user friction | Must be in current/next sprint |
| **P2** | Medium impact. Enhancement or missing but non-critical feature | Schedule within next 3 sprints |
| **P3** | Low impact. Nice-to-have, polish, or long-term capability | Backlog, re-evaluate quarterly |

---

## P0 — Critical (5 gaps)

### P0-001: No Billing/Subscriptions System
| Attribute | Detail |
|---|---|
| Domain | SaaS / Business |
| Severity | **Critical** |
| Business Impact | Cannot charge customers. Zero revenue capability. |
| UX Impact | Users cannot manage plans, see invoices, or upgrade |
| Technical Impact | Architectural: needs subscription model, payment gateway, webhook handling, metering |
| Risk | Business model unviable without this |
| Effort | 8-12 weeks (Stripe integration, plans, metering, invoicing) |
| Depends On | Organization management, user roles |
| Fix | Implement Stripe integration with tiered plans, usage metering, invoice generation |

---

### P0-002: No Organization Self-Service Management
| Attribute | Detail |
|---|---|
| Domain | SaaS / Multi-Tenant |
| Severity | **Critical** |
| Business Impact | Organizations created only via seed script. No signup flow, no org creation UI. |
| UX Impact | Admins cannot edit org name, branding, or settings |
| Technical Impact | Org status (active/suspended) exists but no UI to manage transitions |
| Risk | Every new tenant requires manual DB seeding |
| Effort | 4-6 weeks |
| Fix | Org creation during signup, org settings page, org branding/logo, org deletion |

---

### P0-003: No Teams/Sub-Organizations
| Attribute | Detail |
|---|---|
| Domain | SaaS / Multi-Tenant |
| Severity | **Critical** |
| Business Impact | Enterprise logistics requires teams (warehouse team, tracking team, finance team) |
| UX Impact | All members flat — no team-based access control |
| Technical Impact | RBAC roles exist but no team scoping |
| Risk | Not viable for enterprises with >20 users |
| Effort | 4-6 weeks |
| Depends On | Organization management, role improvements |
| Fix | Team model, team-scoped roles, team membership management UI |

---

### P0-004: No SSO/SAML/OAuth Login
| Attribute | Detail |
|---|---|
| Domain | Auth / Security |
| Severity | **Critical** |
| Business Impact | Enterprise customers require SSO. No SSO = no enterprise deal. |
| UX Impact | Users must use email/password — no Google, Microsoft, or SAML login |
| Technical Impact | Better Auth supports OAuth, but configuration is absent |
| Risk | Unsellable to mid-market and enterprise |
| Effort | 4-6 weeks (Google, Microsoft, GitHub OAuth + SAML configuration) |
| Fix | Configure OAuth providers in Better Auth, add SAML/JIT provisioning |

---

### P0-005: No Error Boundaries on Any Route Segment
| Attribute | Detail |
|---|---|
| Domain | Frontend / UX |
| Severity | **Critical** |
| Business Impact | RPC failures crash entire pages. Operators lose access to operational data. |
| UX Impact | Blank error screen with no recovery action |
| Technical Impact | No `error.tsx`, `not-found.tsx`, or `global-error.tsx` at any route level |
| Risk | Single failed API call takes down the entire app experience |
| Effort | 2-3 days |
| Fix | Add `error.tsx` to all route segments, `not-found.tsx`, `global-error.tsx`, with retry mechanism |

---

## P1 — High (14 gaps)

### P1-001: No Loading States on Any Route Segment
| Attribute | Detail |
|---|---|
| Domain | Frontend / UX |
| Severity | High |
| Impact | Pages show blank/empty during async data fetches |
| UX Impact | Operator sees nothing while waiting for data |
| Technical Impact | `force-dynamic` ensures no stale data but no skeleton shown during fetch |
| Effort | 3-5 days |
| Fix | Add `loading.tsx` with skeleton components matching page layout to all route segments |

---

### P1-002: No Spacing Token Adoption
| Attribute | Detail |
|---|---|
| Domain | Design System |
| Severity | High |
| Impact | Components use arbitrary Tailwind spacing values instead of `var(--space-*)` |
| UX Impact | Inconsistent visual rhythm across the platform |
| Technical Impact | Spacing tokens defined but not consumed anywhere |
| Effort | 3-5 days across all components |
| Fix | Migrate all `p-*`, `px-*`, `py-*`, `m-*`, `gap-*` to use design token CSS variables |

---

### P1-003: No Breadcrumb Component or Implementation
| Attribute | Detail |
|---|---|
| Domain | Frontend / Navigation |
| Severity | High |
| Impact | Users cannot navigate up the hierarchy. No sense of location in deep routes. |
| UX Impact | Disorienting in deep pages like `/app/tracking/[shipmentId]` |
| Technical Impact | Breadcrumb component missing from design system entirely |
| Effort | 2-3 days |
| Fix | Create Breadcrumb component (with shadcn), add to platform shell, implement auto-breadcrumb from route segments |

---

### P1-004: No Profile/Account Settings Page
| Attribute | Detail |
|---|---|
| Domain | Frontend / UX |
| Severity | High |
| Impact | Users cannot change name, email, avatar, password, or preferences |
| UX Impact | User must edit database directly for basic profile changes |
| Technical Impact | Profile update API may not exist |
| Effort | 1-2 weeks |
| Fix | Profile page with name/email/avatar editing, password change, notification preferences |

---

### P1-005: No Tenant Switcher
| Attribute | Detail |
|---|---|
| Domain | SaaS / Multi-Tenant |
| Severity | High |
| Impact | Users belonging to multiple orgs have no way to switch between them |
| UX Impact | Stuck in one org unless admin reassigns |
| Technical Impact | Session resolves single org — no multi-org session model |
| Effort | 1-2 weeks |
| Fix | Multi-org membership, org switcher component in shell, session org resolution |

---

### P1-006: Client-Side Data Fetching (TanStack Query) Not Used
| Attribute | Detail |
|---|---|
| Domain | Frontend / Architecture |
| Severity | High |
| Impact | No data caching, no deduplication, no background refetching, no optimistic updates |
| UX Impact | Every navigation re-fetches all data. Slow for operators. |
| Technical Impact | `force-dynamic` + no client cache = slow perceived performance |
| Effort | 2-3 weeks |
| Depends On | Loading states |
| Fix | Set up TanStack Query provider, migrate interactive data displays to client components with TQ hooks |

---

### P1-007: No API Versioning Strategy
| Attribute | Detail |
|---|---|
| Domain | Backend / API |
| Severity | High |
| Impact | Future breaking changes will break existing clients |
| Technical Impact | No `/v1/` prefix, no content negotiation |
| Risk | Every API change is a breaking change |
| Effort | 1 week |
| Fix | Add `/v1/rpc/` prefix, maintain backward compatibility layer, document versioning policy |

---

### P1-008: No Layered Architecture (Domain/Application/Infrastructure)
| Attribute | Detail |
|---|---|
| Domain | Backend / Architecture |
| Severity | High |
| Impact | Business logic mixed with Prisma queries. Hard to test, hard to evolve. |
| Technical Impact | No repository abstraction, no domain events, no use-case separation |
| Effort | 6-8 weeks (refactor module-by-module) |
| Fix | Extract domain interfaces, application services, infrastructure implementations per module |

---

### P1-009: No Event Bus / Domain Events
| Attribute | Detail |
|---|---|
| Domain | Backend / Architecture |
| Severity | High |
| Impact | Outbox is data-driven (services write directly to outbox table), not event-driven |
| Technical Impact | Tight coupling between business logic and outbox implementation |
| Effort | 4-6 weeks |
| Depends On | Layered architecture |
| Fix | Implement NestJS event bus, emit domain events, subscribe outbox handler + notification handler |

---

### P1-010: No Password Reset Flow
| Attribute | Detail |
|---|---|
| Domain | Auth / UX |
| Severity | High |
| Impact | Users who forget password cannot reset it. Must contact admin. |
| UX Impact | Locked out of the system |
| Technical Impact | Better Auth has email/password and password reset configured, but no UI route |
| Effort | 2-3 days |
| Fix | Create `/forgot-password` and `/reset-password` routes with forms |

---

### P1-011: MetricTile/ContextRow/AccessState Duplicated Inline
| Attribute | Detail |
|---|---|
| Domain | Frontend / Components |
| Severity | High |
| Impact | Same components redefined in 10+ page files with slight variations |
| Technical Impact | Changes require editing every page. Inconsistent behavior. |
| Effort | 2-3 days |
| Fix | Extract into shared `packages/ui` components, replace all inline usages |

---

### P1-012: No Webhook/Outbound Event System
| Attribute | Detail |
|---|---|
| Domain | SaaS / Integration |
| Severity | High |
| Impact | External systems cannot subscribe to SAPTM events |
| Business Impact | Enterprises need event-driven integrations |
| Technical Impact | Outbox pattern generates events but no delivery mechanism to external endpoints |
| Effort | 3-4 weeks |
| Fix | Webhook model, delivery worker, retry/dead-letter, webhook configuration UI |

---

### P1-013: No Feature Flag System
| Attribute | Detail |
|---|---|
| Domain | SaaS / Release Management |
| Severity | High |
| Impact | Cannot gradually roll out features, cannot A/B test, cannot kill-switch |
| Business Impact | Every feature release is all-or-nothing |
| Technical Impact | RBAC is used as proxy but is not designed for feature flags |
| Effort | 2-3 weeks |
| Fix | Feature flag provider (e.g., Unleash or LaunchDarkly), flag evaluation middleware, admin UI |

---

### P1-014: No Frontend Unit/Component Tests
| Attribute | Detail |
|---|---|
| Domain | Testing / Frontend |
| Severity | High |
| Impact | Form actions, rendering logic, business rules have zero test coverage |
| Technical Impact | Only E2E tests exist for frontend (slow, fragile, low coverage) |
| Effort | 4-6 weeks (establish pattern, write tests for critical paths) |
| Fix | Add Vitest (or equivalent), write component tests for all forms, server action tests |

---

## P2 — Medium (18 gaps)

### P2-001: No Dark Mode Toggle UI
| Detail: ThemeProvider and ThemeToggle component exist, but not wired into shell. Users cannot switch theme. |

### P2-002: No i18n Infrastructure
| Detail: All 500+ UI strings hardcoded in Portuguese. No string extraction, no translation files. |

### P2-003: No Pagination on Any Data Table
| Detail: Tables truncate data. No page navigation, no page size control, no total count display. |

### P2-004: Components Directory is Flat (55 files)
| Detail: All form components in single flat directory. No domain subdirectories. Becomes unmanageable at scale. |

### P2-005: No Tooltip Component (Raw CSS Used)
| Detail: Tooltips implemented with `group-hover` CSS. Not accessible, not consistent. |

### P2-006: Pages Exceed 500 Lines (cargo: 859, tracking: 596)
| Detail: Large page components violate single-responsibility principle. Hard to test, maintain, understand. |

### P2-007: No Log Aggregation Pipeline (Loki/ELK)
| Detail: OTEL collector + Prometheus + Grafana exist but no log pipeline. Debugging requires `docker logs`. |

### P2-008: No Terraform/Pulumi IaC
| Detail: Kubernetes configs are script-generated. No cloud infrastructure-as-code. |

### P2-009: No Sentry/Error Tracking Integration
| Detail: Sentry config vars exist in env but no initialization in `main.ts`. |

### P2-010: No Password Change UI
| Detail: Security page shows MFA and sessions but no password change form. |

### P2-011: No Export/Download for Individual Records
| Detail: Reports page has CSV export. Individual records (cargo, shipment) have no download/print. |

### P2-012: No Batch Operations
| Detail: Cannot select multiple cargo items and perform bulk operations (register, release, etc.) |

### P2-013: No WebSocket/SSE/Real-Time Updates
| Detail: Notifications are pull-based. No push delivery to connected clients. |

### P2-014: No Audit Retention Policy
| Detail: Audit records accumulate indefinitely. No archival, no purge, no retention configuration. |

### P2-015: No Invitation Expiry Display
| Detail: Invitations have 48h TTL but UI does not show expiry countdown. |

### P2-016: No Keyboard Shortcuts (Beyond Cmd+K)
| Detail: Single search shortcut. No navigation shortcuts (`g + c` for cargo, etc.) |

### P2-017: No Density Mode Switcher
| Detail: Density tokens defined but no UI to switch between comfortable/compact/operational modes. |

### P2-018: No PWA Manifest or Offline Support
| Detail: All pages force-dynamic. No service worker, no offline capability. |

---

## P3 — Low (10 gaps)

### P3-001: No Storybook/Component Documentation
| Detail: Components exist but no visual documentation, no interactive playground. |

### P3-002: No Mobile App (Expo/React Native)
| Detail: No mobile app. Web responsive shell is functional but not mobile-native. |

### P3-003: No Print Styles
| Detail: No `@media print` CSS. Pages print with default browser styling. |

### P3-004: No Changelog/What's New Page
| Detail: No release notes, no changelog, no in-app update notification. |

### P3-005: No Onboarding Wizard/First-Time Flow
| Detail: New users land directly on Control Center with no guidance. |

### P3-006: No Help/Support/Documentation Center
| Detail: No in-app help, no knowledge base, no support ticket system. |

### P3-007: No Contextual Help Tooltips on Forms
| Detail: Complex form fields have no help text, no examples, no hints. |

### P3-008: No Rate Limiting Per-Endpoint
| Detail: Global 200 req/min throttle only. No per-endpoint or per-user rate limits. |

### P3-009: No Service Mesh / mTLS
| Detail: No mutual TLS between services. Communication over plain HTTP internally. |

### P3-010: No Canary/Blue-Green Deployment
| Detail: No deployment strategy beyond container restart. |

---

## Gap Closure Impact Matrix

| Priority | Count | Effort Estimate | Business Impact if Unresolved |
|---|---|---|---|
| P0 | 5 | 22-32 weeks | Product cannot be sold as SaaS |
| P1 | 14 | 32-52 weeks | Enterprise deals blocked, poor UX |
| P2 | 18 | 16-24 weeks | Operational efficiency reduced |
| P3 | 10 | 8-12 weeks | Polish and competitive parity |

**Total Effort: 78-120 weeks (parallelizable across 3-4 streams)**

---

## Dependency Graph for P0/P1 Resolution

```
P0-001 (Billing) ─── depends on ───→ P0-002 (Organizations)
                                          │
     P0-004 (SSO) ─────────────────────────┤
                                          │
     P0-003 (Teams) ──────────────────────┤
                                          │
P0-005 (Error Boundaries) ─── no deps    │
                                          ▼
P1-002 (Spacing Tokens) ─── no deps
    │
P1-001 (Loading States) ─── no deps
    │
P1-003 (Breadcrumbs) ──── no deps
    │
P1-004 (Profile) ──────── depends on auth session
    │
P1-005 (Tenant Switcher) ── depends on P0-002
    │
P1-006 (TanStack Query) ── depends on P1-001
    │
P1-007 (API Versioning) ── no deps
    │
P1-008 (Layered Arch) ──── no deps (refactoring)
    │
P1-009 (Event Bus) ─────── depends on P1-008
    │
P1-010 (Password Reset) ── depends on auth routes
    │
P1-011 (Duplicated Components) ── no deps
    │
P1-012 (Webhooks) ──────── depends on P1-009
    │
P1-013 (Feature Flags) ─── no deps
    │
P1-014 (Frontend Tests) ── depends on P1-011
```

---

## Quick Wins (Can Be Done in Parallel, < 1 Week Each)

1. P1-011: Extract MetricTile/ContextRow/AccessState to `packages/ui`
2. P1-003: Breadcrumb component + implementation
3. P1-002: Start spacing token migration (1-2 components per PR)
4. P2-004: Organize `/components/` into subdirectories
5. P2-005: Build Tooltip component
6. P2-015: Add invitation expiry display
7. P2-001: Wire ThemeToggle into shell
8. P1-010: Password reset routes
9. P0-005: Error boundaries (2-3 days)
10. P1-001: Loading states (3-5 days)
