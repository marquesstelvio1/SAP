# Self-Evolution System

**Phase:** 13 — Continuous Improvement Loop

---

## Purpose

Automatically detect documentation drift when code changes occur, ensuring AGENTS.md, roadmaps, diagnostics, skills, governance, and standards always reflect repository reality.

## Detection Triggers

| Trigger | Detection Method | Action |
|---|---|---|
| Architecture change | Module directory diff + drift scan | Update architecture docs + AGENTS.md |
| Dependency change | pnpm-workspace.yaml catalog diff | Update relevant standards docs |
| Database schema change | Prisma schema model diff | Update database.md + business rules |
| Business rule change | Auth permission file diff | Update business-rules/ docs |
| CI/CD change | Workflow file diff | Update deployment.md |
| Any code change | PR path filter | Run docs-freshness workflow |

## Automated Workflows

### Pre-Commit (manual)
```bash
node scripts/validate-doc-freshness.mjs
```

### PR Gate
`.github/workflows/docs-freshness.yml` runs on every PR touching:
- `apps/**`
- `packages/**`  
- `.github/workflows/**`
- `pnpm-workspace.yaml`
- `docs/**`
- `.ai/**`

Fails CI if structural drift is detected.

### Weekly Audit
Every Monday at 6am — stale doc warning (no failure).

## Recompilation Process

When drift is detected:

1. **Diagnose** — `validate-doc-freshness.mjs` identifies exact mismatches
2. **Plan** — Determine which docs need updating
3. **Update** — Edit the specific docs/ files
4. **Recompile** — Generate new AGENTS.md from all docs/ knowledge
5. **Verify** — Run validate-doc-freshness.mjs again → confirm clean
6. **Commit** — Semantic commit with docs: prefix

## Ownership

| Artifact | Owner | Review Cadence |
|---|---|---|
| AGENTS.md | Architect | Every PR with structural changes |
| architecture/ | Architect | Monthly |
| diagnostics/ | All agents | Every diagnostic cycle |
| business-rules/ | Backend + Auth | On auth/permission changes |
| standards/ | Architect | On dependency changes |
| rules/ | Architect + Security | On security changes |
| skills/ | All agents | On workflow changes |
| agents/ | Architect | On agent role changes |
| roadmaps/ | Planner | Every sprint |
| governance/ | Architect | Quarterly |
| flows/ | All agents | On workflow changes |
| .ai/ context/ | Architect | On architecture changes |
| .ai/ memory/ | All agents | On decisions |

## Reality Enforcement

- Repository reality always wins over documented intent
- If code and docs disagree, update docs to match code
- No doc-only architecture changes — code must change first
- `validate-doc-freshness.mjs` is the single source of truth for drift detection
