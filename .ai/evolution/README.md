# Self-Evolution Engine

This directory powers the Continuous Improvement Loop (Article XI of the AI Constitution).

## Quick Start

```bash
# Check documentation freshness
node scripts/validate-doc-freshness.mjs

# Recompile AGENTS.md
# (Manual — run when docs/ knowledge changes significantly)
```

## Pipeline

```
Code Change → PR → docs-freshness.yml → Drift Report → Fix → Merge → Updated Docs → Recompile AGENTS.md
```

## Files

- `self-evolution-system.md` — Full system documentation
- `validate-doc-freshness.mjs` — Structural drift detection script
- `.github/workflows/docs-freshness.yml` — CI workflow

## Rules

- If you change code, update the relevant doc in the same PR
- If you find drift, fix it before the PR merges
- If you update docs, verify with `validate-doc-freshness.mjs`
