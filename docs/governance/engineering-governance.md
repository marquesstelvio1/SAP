# Governance: Engineering

**Phase:** 9 — Governance

---

## Decision Ownership

| Decision Type | Owner | Requires Approval |
|---|---|---|
| Architecture change | Architect | Human lead |
| Dependency addition | Architect | — |
| Schema change | Database agent | Architect |
| Permission change | Security agent | Architect |
| Auth mode change | Security agent | Architect |
| CI/CD change | DevOps agent | Architect |
| Deployment | DevOps agent | Architect |

## Approval Flows

### Feature Implementation
1. Feature specification → Architect review
2. RPC contract definition → Security review (auth/permissions)
3. Implementation → Code review (frontend/backend agent)
4. Tests → QA review
5. Documentation → Architect review
6. PR → Git manager → Merge

### Bug Fix
1. Bug report → QA verification
2. Fix implementation → Relevant agent
3. Test → QA agent
4. PR → Git manager → Merge

## Risk Management

| Risk Level | Response |
|---|---|
| Critical | Immediate escalation to human lead. Stop all work. |
| High | Fix within current sprint. Daily progress review. |
| Medium | Schedule within 2 sprints. Weekly review. |
| Low | Backlog. Monthly review. |

## Change Management

1. All changes must have a corresponding task or issue
2. Architecture changes require ADR
3. Breaking changes require version bump and migration plan
4. Security changes require security agent approval
5. All changes must pass CI gates

## Escalation Process

```
Agent → Senior Agent → Human Lead
```

- Day-to-day: Agent handles
- Cross-domain: Senior agent (Architect/Security) decides
- Strategic: Human lead decides
- Emergency: Human lead immediately

## Audit Process

- Weekly: Code review sampling
- Monthly: Architecture review
- Quarterly: Full security audit
- Per-release: Release evidence generation
