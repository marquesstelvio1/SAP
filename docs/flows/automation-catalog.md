# Automation Catalog

## Local scripts

- `scripts/new-ai-task-bundle.mjs`: generates task bundles and Jira/Linear payloads
- `scripts/new-ai-diagnostic.mjs`: generates a structured diagnostic artifact
- `scripts/new-ai-task-from-diagnostic.mjs`: converts a diagnostic into a task bundle
- `scripts/new-ai-test-plan.mjs`: generates validation scope by task
- `scripts/new-ai-documentation-pack.mjs`: generates documentation update packs
- `scripts/new-ai-pull-request-draft.mjs`: generates branch, commit, and PR draft artifacts
- `scripts/new-ai-governance-review.mjs`: generates gate review evidence for a task
- `scripts/new-ai-changelog.mjs`: generates or updates changelog sections
- `scripts/invoke-ai-workflow.mjs`: orchestrates full workflows
- `scripts/test-aios.mjs`: validates structure, JSON files, domain packs, and script syntax

## CI/CD automations

- `.github/workflows/ai-ci.yml`: validates operating system structure and can run delivery artifact generation
- `.github/workflows/ai-release.yml`: generates release changelog and stabilization artifacts
- `.github/workflows/ai-backlog-sync.yml`: generates task and test artifacts from dispatch or schedule
