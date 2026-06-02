# Automation Catalog

## Local scripts

- `scripts/New-AITaskBundle.ps1`: generates task bundles and Jira/Linear payloads
- `scripts/New-AIDiagnostic.ps1`: generates a structured diagnostic artifact
- `scripts/New-AITaskFromDiagnostic.ps1`: converts a diagnostic into a task bundle
- `scripts/New-AITestPlan.ps1`: generates validation scope by task
- `scripts/New-AIDocumentationPack.ps1`: generates documentation update packs
- `scripts/New-AIPullRequestDraft.ps1`: generates branch, commit, and PR draft artifacts
- `scripts/New-AIGovernanceReview.ps1`: generates gate review evidence for a task
- `scripts/New-AIChangelog.ps1`: generates or updates changelog sections
- `scripts/Invoke-AIWorkflow.ps1`: orchestrates full workflows
- `scripts/Test-AIOS.ps1`: validates structure, JSON files, domain packs, and PowerShell syntax

## CI/CD automations

- `.github/workflows/ai-ci.yml`: validates operating system structure and can run delivery artifact generation
- `.github/workflows/ai-release.yml`: generates release changelog and stabilization artifacts
- `.github/workflows/ai-backlog-sync.yml`: generates task and test artifacts from dispatch or schedule
