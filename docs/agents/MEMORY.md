# MEMORY SYSTEM — SAPTM

> Enterprise memory for agent decision history.
> Updated after every significant architectural or implementation change.

---

## 2026-06-22: Initial Enterprise MESH Audit

**Action:** Full system audit of SAPTM monorepo.
**Scope:** All 12 packages, 2 apps, 47 scripts, 9 CI/CD workflows, K8s configs.
**Method:** MESH validation — compare docs vs codebase vs runtime assumptions.

### Key Discoveries

1. **Documentation is exceptional** (98/100) — the most well-documented monorepo in audit history
2. **Code quality is high** — strict TypeScript, clean modules, proper patterns
3. **Previous audits exist** — multiple enterprise reports, remediation plans already generated
4. **Doc-code drift detected** — design tokens defined but not consumed in components
5. **Frontend testing gap** — no unit test framework for web/ui packages
6. **Architecture modules missing** — OrganizationsModule, DocumentsModule not created yet
7. **Event bus is data-driven** — services write directly to outbox table
8. **API versioning absent** — all routes flat at `/rpc`
9. **Loading/error boundaries missing** — 11 domain routes lack error recovery UI
10. **Windows development broken** — Turbopack crashes, Webpack fails to resolve paths

### Outputs Generated

- `docs/enterprise/SYSTEM_HEALTH_SCORE.md` — 92.5/100 composite score
- `docs/enterprise/CRITICAL_ISSUES.md` — 6 P0 issues
- `docs/enterprise/HIGH_RISK_ISSUES.md` — 8 P1 issues
- `docs/enterprise/STRUCTURAL_GAPS.md` — 12 structural gaps
- `docs/enterprise/CLEANUP_PLAN.md` — 15 removals, 14 fixes, 8 alignments
- `docs/enterprise/TARGET_ARCHITECTURE.md` — Ideal final architecture
- `docs/agents/AGENT_MAP.md` — Agent responsibility definitions
- `docs/agents/AGENT_DECISION_RULES.md` — Pre/post implementation rules
- `docs/agents/MEMORY.md` — This file
- `docs/enterprise/STACK_INVENTORY.md` — Technology inventory
- `docs/enterprise/DEPENDENCY_RULES.md` — Version governance
- `docs/enterprise/PACKAGE_MAP.md` — Package dependency map
- `docs/enterprise/AGENT_TECH_MATRIX.md` — Agent technology alignment
- `docs/enterprise/TECH_DEBT_DEPENDENCIES.md` — Outdated code detection
- Updated `AGENTS.md` — Enhanced with agent system context

### Decisions Made

| Decision | Rationale |
|---|---|
| Keep modular monolith, defer microservices | Current scale doesn't justify extraction cost |
| Keep oRPC contract-first approach | Type safety, shared contracts, audit metadata |
| Keep Node `--test` runner for API/RPC tests | Consistent with existing patterns, no migration needed |
| Keep Prisma v7 (not revert to v6) | Already migrated, driver adapter pattern is correct |
| Consolidate enterprise reports into `docs/enterprise/` | Root-level audit artifacts create noise |
| Add Vitest for frontend tests (separate from backend) | React testing library requires Jest/Vitest-compatible runner |
| Keep Better Auth, enhance with org plugin | Identity is correct, authorization is custom and intentional |

### Open Questions

- Should PowerShell workflow scripts be rewritten in Node.js? (Blocked by CI Linux requirement)
- Should organizations logic be extracted from admin/auth into own module? (Yes — documented in gaps)
- Should Sentry DSN validation be added to config? (Yes — current config checks for presence only)

---

## Memory Update Protocol

After any significant change, agents must:

1. Add entry to this file with date and action
2. Summarize discoveries, decisions, and open questions
3. Reference related documentation and file paths
4. Update AGENTS.md if project context changed
