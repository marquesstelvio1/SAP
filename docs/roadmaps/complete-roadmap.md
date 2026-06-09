# Phases 9–11 — Complete Roadmap, Backlog, Sprint Plan

## Roadmap Principles

- Build foundation before features.
- Execute one module, one feature, one task per run.
- Security and observability are not post-release add-ons.
- AI capabilities are advisory until workflow approval and audit are mature.

## Current Local Status

As of 2026-06-06, the local production-like foundation is closed.

- P0 local: zero open tasks.
- API, Web, PostgreSQL, and Redis run through Docker Compose.
- PostgreSQL host port is `25432`.
- Redis host port is `26379`.
- Local tenant admin onboarding exists through `pnpm auth:seed-local-admin`.
- Local validation, build, smoke, and E2E gates pass.
- The first protected read-only business slice is Operational Tracking Overview.
- The first backend business command is `tracking.event.record`.
- The first authenticated business UI write slice is event recording for operations users.
- The first shipment timeline UI slice is `tracking.shipment.detail.read`.
- The first governed exception command is `tracking.exception.manage`.
- The first exception-management UI slice is protected by `tracking.exception.manage`.
- The first governed exception-resolution command is `tracking.exception.resolve`.
- The first exception-resolution UI slice is protected by `tracking.exception.resolve`.
- The authenticated Control Center now renders real session, tenant, RBAC, and tracking overview states.
- Exception lifecycle changes now capture operator evidence and approval context.
- Exception workflows now expose completion states and close on approved release.
- Operational Tracking is included in generated release evidence as the first business module.
- Cargo Management includes governed P0 registration, P1 release/readiness, P2 Cargo-to-Tracking linkage, P3 compliance evidence, P4 departure lifecycle, P5 arrival/delivery lifecycle, P6 delivery exception lifecycle, P7 operational handoff lifecycle, and P8 claims settlement accounting locally.
- Capacity Management includes governed P9 resource registration, slot opening, slot reservation, reservation cancellation, no-overbooking checks, audit, outbox, and protected UI locally.
- Capacity Optimization Advisory P11 includes tenant-scoped rule-based recommendations, human approval policy, and no autonomous execution locally.
- Capacity Advisory Decision P12 includes human approval/rejection evidence, idempotency, audit, outbox, and no autonomous execution locally.
- Capacity Advisory Decision Analytics P20 includes tenant-scoped read-only approval metrics, recommendation-type groups, required-permission groups, recent decisions, and no autonomous execution locally.
- Integration Gateway P13 includes tenant-scoped service accounts, hash-only API keys, idempotent external event registration, audit, outbox, protected UI, and E2E coverage locally.
- Port TOS Adapter P14 includes local terminal movement processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Rail TMS Adapter P15 includes local railway movement processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Carrier TMS Adapter P16 includes local road carrier movement processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Telematics GPS Adapter P17 includes local GPS position processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Customs ERP Adapter P18 includes local customs clearance status processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Warehouse WMS Adapter P19 includes local warehouse, dock, yard, and handling-unit activity processing into Operational Tracking with active service account scope, idempotency, audit, outbox, protected UI, and E2E coverage locally.
- Real production still requires registry, managed secrets, cloud infrastructure, TLS, external observability, backup/DR, security tests, load tests, and release evidence.

## Milestones

| Milestone | Outcome |
| --- | --- |
| M0 — Foundation Accepted | Architecture, governance, roadmap, and tooling foundation exist |
| M1 — Workspace Ready | PNPM/Turbo/Biome/CI/shared packages are installable |
| M2 — Security Baseline | Better Auth, RBAC, ABAC, audit, permission matrix implemented |
| M3 — Data and RPC Baseline | Prisma and oRPC contract layer implemented |
| M4 — Design System Baseline | shadcn/ui tokens and enterprise primitives implemented |
| M5 — Observability Baseline | logs, traces, metrics, alerts, audit wiring implemented |
| M6 — First Operational Feature | first bounded-context feature delivered through full gates |
| M7 — First Release Candidate | release runbook, CI, tests, docs, changelog complete |

## EPIC 1 — Monorepo Foundation

### Feature 1.1 — Workspace Configuration

Tasks:

- Create root `package.json`, `pnpm-workspace.yaml`, and `turbo.json`.
- Define `apps/*` and `packages/*` workspace layout.
- Add root scripts for dev, build, lint, typecheck, test, e2e, changesets.

Acceptance criteria:

- Workspace structure exists.
- No business feature code exists.
- Root scripts are documented.

Dependencies:

- None.

Risks:

- Version drift across official stack.

Tests:

- Workspace file validation.
- Tooling dry-run once dependencies are installed.

### Feature 1.2 — Shared Package Skeletons

Tasks:

- Create `@saptm/ui`, `@saptm/auth`, `@saptm/database`, `@saptm/rpc`, `@saptm/types`, `@saptm/config`, `@saptm/testing`, `@saptm/tsconfig`.
- Document package ownership and forbidden dependencies.
- Add dependency-direction rules.

Subtasks:

- Add package manifests.
- Add package README files.
- Add TypeScript preset package.

Acceptance criteria:

- Package boundaries match architecture.
- No package owns a business feature prematurely.

## EPIC 2 — Tooling and Delivery Gates

### Feature 2.1 — Quality Tooling

Tasks:

- Configure Biome.
- Configure shared TypeScript.
- Configure tsup package build pattern.
- Configure Playwright skeleton.

Acceptance criteria:

- Formatting, linting, typechecking, and e2e strategy are available.

### Feature 2.2 — CI/CD Baseline

Tasks:

- Add GitHub Actions workflow for install, lint, typecheck, test, build.
- Add release workflow expectations.
- Add Changesets config.

Acceptance criteria:

- CI can become authoritative once dependencies are installed.
- Release gates are visible.

## EPIC 3 — Auth and Security Baseline

### Feature 3.1 — Better Auth Foundation

Tasks:

- Implement `@saptm/auth` config.
- Add Next.js auth route.
- Share session types.
- Define service account strategy.

Acceptance criteria:

- Browser session lifecycle works.
- API operations can validate authenticated context.

Dependencies:

- Workspace foundation.
- Database baseline.

Risks:

- Treating Better Auth session data as business authorization.

Tests:

- Login/session tests.
- Session revocation tests.
- API unauthenticated denial tests.

### Feature 3.2 — RBAC, ABAC, Audit

Tasks:

- Implement role and permission model.
- Implement ABAC policy evaluator.
- Implement audit record writer.
- Add permission matrix tests.

Acceptance criteria:

- No critical mutation bypasses policy and audit.

## EPIC 4 — Database Baseline

### Feature 4.1 — Prisma Foundation

Tasks:

- Create Prisma schema baseline.
- Add Better Auth tables.
- Add organization, membership, role, permission, audit, outbox tables.

Acceptance criteria:

- Tenant-scoped model exists before product data.

### Feature 4.2 — Migration and Seeding Governance

Tasks:

- Add migration scripts.
- Add local-only seed strategy.
- Add migration runbook.

Acceptance criteria:

- Migrations are repeatable and documented.

## EPIC 5 — RPC Layer

### Feature 5.1 — oRPC Contracts

Tasks:

- Define contract metadata.
- Define error model.
- Define auth and audit metadata.

Acceptance criteria:

- Contracts are typed and versioned.

### Feature 5.2 — NestJS Transport

Tasks:

- Add oRPC server adapter.
- Add auth and policy middleware.
- Add contract tests.

Acceptance criteria:

- API operations cannot execute before policy evaluation.

## EPIC 6 — Design System

### Feature 6.1 — shadcn/ui Foundation

Tasks:

- Initialize design system package.
- Define tokens and typography.
- Add base primitives.

Acceptance criteria:

- No product screen is created.
- UI package enforces shadcn/ui composition rules.

### Feature 6.2 — Enterprise Patterns

Tasks:

- Define form, table, dialog, sheet, navigation, and KPI patterns.
- Add accessibility rules.
- Add visual regression plan.

Acceptance criteria:

- First product screen can use approved patterns only.

## EPIC 7 — Observability

### Feature 7.1 — Request Telemetry

Tasks:

- Add correlation id propagation.
- Add structured logger.
- Add OpenTelemetry tracing.
- Add API metrics.

Acceptance criteria:

- Each API request is traceable.

### Feature 7.2 — Business Telemetry and Alerts

Tasks:

- Define business metrics.
- Add alert taxonomy.
- Add dashboards and runbooks.

Acceptance criteria:

- Critical operations have alert coverage.

## EPIC 8 — First Business Feature Candidate

The first feature is intentionally deferred until foundation gates pass.

Selected first feature:

- Operational Tracking / Gestão Operacional de Cargas.

Reason:

- It is the core logistics capability and validates tenant scoping, auth, RBAC, audit, database, oRPC, UI shell, observability, and CI through a small controlled slice.

Delivered first slice:

- Read-only tracking overview.
- Protected `/app/tracking` route.
- `tracking.overview.read` RPC contract.
- Backend permission enforcement with `tracking.shipment.read`.
- `tracking.event.record` RPC contract.
- Transactional event recording with idempotency, audit, outbox, and status update.
- Backend permission enforcement with `tracking.event.record`.
- Authenticated event-recording UI backed by `tracking.event.record`.
- `tracking.shipment.detail.read` RPC contract.
- Protected `/app/tracking/[shipmentId]` timeline route.
- Authenticated timeline UI linked from tracking overview.
- `tracking.exception.manage` RPC contract.
- Transactional exception command with idempotency, audit, outbox, and status impact.
- Backend permission enforcement with `tracking.exception.manage`.
- Authenticated exception-management UI on `/app/tracking/[shipmentId]`.
- `tracking.exception.resolve` RPC contract.
- Transactional exception resolution with idempotency, audit, outbox, and status recovery.
- Backend permission enforcement with `tracking.exception.resolve`.
- Authenticated exception-resolution UI on `/app/tracking/[shipmentId]`.
- Authenticated Control Center data states backed by the real tracking overview contract.
- Operator evidence and approval context for exception management and resolution.
- Exception workflow completion states and Operational Tracking release evidence.
- Operational analytics aggregates for SLA risk, events, modal distribution, and workflow states.
- Local AI advisory recommendations with mandatory human approval and no autonomous execution.
- Playwright visual regression for stable local UI states.
- Cargo Management P0: tenant-scoped overview and governed cargo registration.
- Cargo Management P1: governed cargo release/readiness through `cargo.release`.
- Cargo Management P2: governed transport planning through `cargo.transport.plan`.
- Cargo Management P3: governed compliance evidence through `cargo.compliance.evidence.record` and `cargo.compliance.evidence.verify`.
- Cargo Management P4: governed departure through `cargo.transport.depart`.
- Cargo Management P5: governed arrival through `cargo.transport.arrive` and delivery completion through `cargo.delivery.complete`.
- Cargo Management P6: governed delivery exception record/resolution through `cargo.delivery.exception.record` and `cargo.delivery.exception.resolve`.
- Cargo Management P7: governed operational custody handoff through `cargo.handoff.record`.
- Cargo Management P8: governed claim settlement accounting through `cargo.claim.settle`.
- Cargo business rules for hazardous cargo, customs holds, damaged cargo, inspections, release readiness, Cargo-to-Tracking linkage, compliance evidence, departure, operational handoff, accepted claim settlement, arrival, delivery completion, delivery exception lifecycle, idempotency, audit, and outbox.
- Capacity Management P9: governed capacity resources and slots through `capacity.resource.register` and `capacity.slot.open`.
- Capacity Management P9: governed reservations and cancellations through `capacity.slot.reserve` and `capacity.slot.cancel`.
- Capacity business rules for unique resource codes, valid slot windows, resource capacity limits, eligible cargo state, available slot units, duplicate reservation blocking, cancellation ordering, idempotency, audit, and outbox.
- Capacity Optimization Advisory P11: governed read through `capacity.optimization.advisory.read`.
- Capacity Optimization Advisory P11: rule-based recommendations for slot saturation, expiring slots, unused capacity, reservation imbalance, and cancellation review.
- Capacity Optimization Advisory P11: automation blocked, human approval required, and no operational mutation from advisory reads.
- Capacity Advisory Decision P12: governed decision command through `capacity.advisory.decision.record`.
- Capacity Advisory Decision P12: approval/rejection requires human evidence, duplicate decision blocking, idempotency, audit, and outbox.
- Capacity Advisory Decision P12: decision recording does not execute `capacity.manage`, `capacity.slot.reserve`, or `capacity.slot.cancel`.
- Capacity Advisory Decision Analytics P20: governed read through `capacity.advisory.decision.analytics.read`.
- Capacity Advisory Decision Analytics P20: tenant-scoped approval rate, recommendation-type groups, required-permission groups, and recent human decisions.
- Capacity Advisory Decision Analytics P20: read-only governance with automation blocked and no operational capacity command execution.
- Tariff / Pricing P10: governed rate cards and pricing rules through `tariff.rate_card.register` and `tariff.rate_rule.add`.
- Tariff / Pricing P10: governed quote calculation and approval through `tariff.quote.calculate` and `tariff.quote.approve`.
- Tariff business rules for unique rate card codes, valid tariff windows, basis-specific rates, active rate cards, applicable rules, required cargo metrics, positive quote amounts, calculated-state approval, human approval evidence, idempotency, audit, and outbox.
- Integration Gateway P13: governed service account and API key provisioning through `integration.service_account.create`.
- Integration Gateway P13: governed external event registration through `integration.event.record`.
- Integration Gateway business rules for active service account scope, hash-only secret storage, one-time plaintext display, tenant idempotency by organization/source/external ID, audit, and outbox.
- Port TOS Adapter P14: governed local terminal movement processing through `integration.adapter.port_tos.movement.process`.
- Port TOS Adapter P14: local movement mapping into Operational Tracking events without external provider calls.
- Port TOS Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.
- Rail TMS Adapter P15: governed local railway movement processing through `integration.adapter.rail_tms.movement.process`.
- Rail TMS Adapter P15: local railway movement mapping into Operational Tracking events without external provider calls.
- Rail TMS Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, train/corridor evidence, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.
- Carrier TMS Adapter P16: governed local road carrier movement processing through `integration.adapter.carrier_tms.movement.process`.
- Carrier TMS Adapter P16: local road movement mapping into Operational Tracking events without external provider calls.
- Carrier TMS Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, carrier/vehicle/driver/route evidence, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.
- Telematics GPS Adapter P17: governed local GPS position processing through `integration.adapter.telematics_gps.position.process`.
- Telematics GPS Adapter P17: local position/geofence/alert mapping into Operational Tracking events without external provider calls.
- Telematics GPS Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, coordinate/speed/heading validation, device/asset/geofence/route evidence, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.
- Customs ERP Adapter P18: governed local customs status processing through `integration.adapter.customs_erp.status.process`.
- Customs ERP Adapter P18: local documents/hold/inspection/duty/clearance/release/rejection mapping into Operational Tracking events without external provider calls.
- Customs ERP Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, customs/document/declaration/broker/authority evidence, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.
- Warehouse WMS Adapter P19: governed local warehouse activity processing through `integration.adapter.warehouse_wms.activity.process`.
- Warehouse WMS Adapter P19: local receipt/putaway/picking/loading/yard/exception/handover mapping into Operational Tracking events without external WMS provider calls.
- Warehouse WMS Adapter business rules for active service account integration/tracking scopes, shipment reference resolution, warehouse/zone/dock/container/handling-unit/operator/pallet evidence, tenant idempotency, transactional integration/tracking event creation, processed integration evidence, audit, and outbox.

Next required slice:

- Approval for the next business module or next external adapter implementation.
- Production/cloud cutover inputs remain external.

## Sprint Plan

| Sprint | Scope | Exit Criteria |
| --- | --- | --- |
| Sprint 0 | Foundation docs, monorepo config, governance | All mandatory deliverables exist |
| Sprint 1 | Workspace installability, Biome, Turbo, TypeScript, CI | Tooling runs locally and in CI |
| Sprint 2 | Auth package, Better Auth route, DB auth schema | Sessions and identity baseline work |
| Sprint 3 | Organizations, RBAC, ABAC, audit foundation | Tenant policy tests pass |
| Sprint 4 | Prisma operational baseline and oRPC contracts | Typed API foundation exists |
| Sprint 5 | Design-system tokens and primitives | UI foundation approved |
| Sprint 6 | Observability middleware and dashboards | Critical operation telemetry works |
| Sprint 7 | First feature implementation | Feature passes gates |
| Sprint 8 | Release hardening | RC accepted |

## Execution Backlog Rule

Every future task must include:

- Epic.
- Feature.
- Task.
- Subtasks.
- Acceptance criteria.
- Dependencies.
- Risks.
- Required tests.
- Required docs.
- Security classification.
- Observability requirements.
