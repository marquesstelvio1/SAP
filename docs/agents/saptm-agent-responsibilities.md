# SAPTM Agent Responsibilities

## Agent Catalog

| Agent | Responsibility | Handoff |
| --- | --- | --- |
| Architect | Bounded contexts, ADRs, dependency direction, technical decisions | Planner, Backend, DevOps |
| Planner | Roadmap, epics, tasks, sprint slicing, acceptance criteria | All implementation agents |
| Frontend | Next.js, TanStack Query, UI composition using approved design system | Design System, Backend |
| Backend | NestJS modules, oRPC implementation, domain services | Architect, Database, QA |
| Auth | Better Auth, RBAC, ABAC, session strategy, audit requirements | Backend, Security, QA |
| DevOps | PNPM, Turbo, CI/CD, environments, release workflow | QA, Architect |
| QA | Test strategy, test gates, regression plans, release evidence | Planner, DevOps |
| Security | Threat model, permission matrix, secrets, compliance, audit | Auth, Architect |
| Performance | Latency, throughput, database/query profiling, scaling plans | Backend, Observability |
| Observability | Logs, traces, metrics, alerts, runbooks | DevOps, Backend |
| Design System | Tokens, shadcn/ui composition, accessibility, visual rules | Frontend |

## Agent Operating Rules

- Agents must consume the foundation index before execution.
- Agents must check applicable `.ai/rules/` files.
- Agents must not cross their domain boundary without handoff.
- Agents must emit assumptions, risks, tests, and rollback notes.
- Agents must refuse feature work when security or design gates are missing.

## First Execution Assignment

| Order | Agent | Task |
| --- | --- | --- |
| 1 | Architect | Accept foundation and ADRs |
| 2 | DevOps | Validate workspace tooling |
| 3 | Auth | Implement auth/security baseline |
| 4 | Backend | Implement database and oRPC baseline |
| 5 | Design System | Implement tokens and primitives |
| 6 | Observability | Implement telemetry foundation |
| 7 | Planner | Authorize first feature task |

