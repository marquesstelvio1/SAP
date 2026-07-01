# Governance: AI

**Phase:** 9 — Governance

---

## AI Agent Principles

1. **Constitutional** — All agents obey AGENTS.md
2. **Collaborative** — Minimum 2 agents per task
3. **Documented** — All decisions recorded
4. **Auditable** — All actions tracked
5. **Escalatable** — Clear escalation paths to human lead

## Agent Collaboration Rules

| Task Type | Required Agents |
|---|---|
| Architecture change | Architect + Security |
| Feature implementation | Backend/Frontend + QA |
| Security change | Security + Auth |
| Database change | Database + Architect |
| UI change | Frontend + Design System |
| Bug fix | Relevant agent + QA |
| Release | DevOps + QA + Security |

## Quality Gates for AI Work

| Gate | Check |
|---|---|
| Architecture | Follows patterns, no boundary violations |
| Security | Auth/permissions correct, no vulnerabilities |
| Testing | Tests pass, coverage adequate |
| Documentation | Corresponding docs updated |
| TypeScript | Typecheck passes |
| Build | Build succeeds |

## AI Decision Recording

All significant decisions must be recorded:
- Architecture decisions → docs/adr/
- Security decisions → docs/security/
- Rule changes → docs/rules/

## Escalation

When AI agents cannot resolve:
1. Try cross-agent collaboration
2. Escalate to Architect agent
3. Escalate to Security agent (if security-related)
4. Escalate to human lead

## Audit Trail

- All agent actions logged in `.ai/executions/`
- All decisions recorded in documentation
- All changes tracked via git
- Release evidence generated per release
