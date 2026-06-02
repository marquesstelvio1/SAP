# SAPTM Enterprise Logistics Platform — Foundation Index

## Status

Foundation-first bootstrap for a greenfield enterprise SaaS platform for rail, port, logistics, cargo tracking, operational automation, analytics, and AI-assisted logistics decisions.

No product pages, CRUDs, or business features are authorized before the foundation gates in this index are accepted.

## Mandatory Deliverables

| # | Deliverable | Source |
| --- | --- | --- |
| 1 | Domain Map | `docs/enterprise/discovery.md` |
| 2 | Business Architecture | `docs/enterprise/business-architecture.md` |
| 3 | Technical Architecture | `docs/enterprise/technical-architecture.md` |
| 4 | Monorepo Structure | `docs/workspace/monorepo-strategy.md` |
| 5 | Workspace Strategy | `docs/workspace/monorepo-strategy.md` |
| 6 | Auth Strategy | `docs/security/auth-security-strategy.md` |
| 7 | Database Strategy | `docs/database/database-strategy.md` |
| 8 | RPC Strategy | `docs/rpc/rpc-strategy.md` |
| 9 | Design System Strategy | `docs/design-system/design-system-strategy.md` |
| 10 | DevOps Strategy | `docs/devops/devops-strategy.md` |
| 11 | Security Strategy | `docs/security/auth-security-strategy.md` |
| 12 | Testing Strategy | `docs/testing/testing-strategy.md` |
| 13 | Observability Strategy | `docs/observability/observability-strategy.md` |
| 14 | Complete Backlog | `docs/roadmaps/complete-roadmap.md` |
| 15 | Complete Roadmap | `docs/roadmaps/complete-roadmap.md` |
| 16 | Sprint Plan | `docs/roadmaps/complete-roadmap.md` |
| 17 | Agent Responsibilities | `docs/agents/saptm-agent-responsibilities.md` |
| 18 | Rules | `.ai/rules/` |
| 19 | Skills | `.ai/skills/` |
| 20 | Governance Framework | `docs/governance/saptm-governance-framework.md` |

## Required Execution Order

1. Monorepo foundation.
2. Tooling and quality gates.
3. Auth and security model.
4. Database and tenancy model.
5. RPC contract layer.
6. Shared packages.
7. Design system.
8. Observability.
9. First business feature.
10. First release.

## Foundation Gates

- Architecture gate: bounded contexts, contracts, and ADRs exist.
- Security gate: RBAC, ABAC, session, audit, and permission matrix exist.
- Data gate: tenancy, migration, and data retention strategy exist.
- Contract gate: oRPC contract versioning and error model exist.
- Design gate: tokens and shadcn/ui composition rules exist.
- Observability gate: logs, traces, metrics, and alert taxonomy exist.
- Delivery gate: backlog, roadmap, sprint plan, and agent responsibilities exist.

