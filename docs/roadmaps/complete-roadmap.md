# Phases 9–11 — Complete Roadmap, Backlog, Sprint Plan

## Roadmap Principles

- Build foundation before features.
- Execute one module, one feature, one task per run.
- Security and observability are not post-release add-ons.
- AI capabilities are advisory until workflow approval and audit are mature.

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

Recommended first feature:

- Tenant organization setup and membership management.

Reason:

- It validates auth, RBAC, ABAC, audit, database, oRPC, design system, observability, and CI without entering complex logistics planning prematurely.

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

