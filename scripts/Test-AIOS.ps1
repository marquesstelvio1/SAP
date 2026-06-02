param(
    [switch]$Strict
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$failures = New-Object System.Collections.Generic.List[string]
$domains = @(
    "frontend",
    "backend",
    "auth",
    "mobile",
    "infra",
    "qa",
    "observability",
    "performance",
    "design-system"
)

function Add-Failure {
    param([string]$Message)
    $failures.Add($Message) | Out-Null
}

function Test-RequiredPath {
    param([string]$RelativePath)
    $path = Join-Path $repoRoot $RelativePath
    if (-not (Test-Path -LiteralPath $path)) {
        Add-Failure "Missing required path: $RelativePath"
    }
}

function Test-JsonFile {
    param([string]$RelativePath)
    $path = Join-Path $repoRoot $RelativePath
    Test-RequiredPath $RelativePath
    if (Test-Path -LiteralPath $path) {
        try {
            Get-Content -LiteralPath $path -Raw | ConvertFrom-Json | Out-Null
        } catch {
            Add-Failure "Invalid JSON: $RelativePath - $($_.Exception.Message)"
        }
    }
}

function Test-PowerShellFile {
    param([string]$RelativePath)
    $path = Join-Path $repoRoot $RelativePath
    Test-RequiredPath $RelativePath
    if (Test-Path -LiteralPath $path) {
        $tokens = $null
        $errors = $null
        [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$errors) | Out-Null
        foreach ($error in $errors) {
            Add-Failure "PowerShell parse error in $RelativePath at line $($error.Extent.StartLineNumber): $($error.Message)"
        }
    }
}

$requiredFiles = @(
    "README.md",
    "CHANGELOG.md",
    ".ai/operating-system.json",
    ".ai/automations/matrix.json",
    ".ai/agents/registry.json",
    ".ai/skills/registry.json",
    ".ai/rules/rule-index.json",
    ".ai/routing.json",
    ".ai/policies/risk-matrix.json",
    ".ai/policies/governance-gates.json",
    "docs/architecture/ai-engineering-os.md",
    "docs/governance/operating-model.md",
    "docs/standards/commit-standards.md",
    "docs/standards/branch-standards.md",
    "docs/standards/testing-standards.md",
    "docs/standards/documentation-standards.md",
    "docs/standards/security-standards.md",
    "docs/standards/observability-standards.md",
    ".github/PULL_REQUEST_TEMPLATE.md"
)

foreach ($file in $requiredFiles) {
    Test-RequiredPath $file
}

$diagnosticEntrypoint = Get-ChildItem -LiteralPath $repoRoot -File |
    Where-Object { $_.Name -like "diagn*stico.md" -or $_.Name -eq "diagnostico.md" } |
    Select-Object -First 1

if (-not $diagnosticEntrypoint) {
    Add-Failure "Missing required diagnostic entrypoint: diagnostico.md or accented equivalent"
}

$jsonFiles = @(
    ".ai/operating-system.json",
    ".ai/automations/matrix.json",
    ".ai/agents/registry.json",
    ".ai/skills/registry.json",
    ".ai/rules/rule-index.json",
    ".ai/routing.json",
    ".ai/pipelines/diagnostic-pipeline.json",
    ".ai/pipelines/execution-pipeline.json",
    ".ai/pipelines/stabilization-pipeline.json",
    ".ai/policies/risk-matrix.json",
    ".ai/policies/governance-gates.json",
    ".ai/schemas/task.schema.json",
    ".ai/schemas/diagnostic.schema.json",
    ".ai/schemas/execution-report.schema.json",
    "workflows/diagnostic-to-backlog.json",
    "workflows/feature-delivery.json",
    "workflows/release-governance.json",
    "jira/task-payload-template.json",
    "linear/issue-payload-template.json"
)

foreach ($file in $jsonFiles) {
    Test-JsonFile $file
}

$scriptFiles = @(
    "scripts/Invoke-AIWorkflow.ps1",
    "scripts/New-AITaskBundle.ps1",
    "scripts/New-AITestPlan.ps1",
    "scripts/New-AIDocumentationPack.ps1",
    "scripts/New-AIPullRequestDraft.ps1",
    "scripts/New-AIChangelog.ps1",
    "scripts/New-AIDiagnostic.ps1",
    "scripts/New-AITaskFromDiagnostic.ps1",
    "scripts/New-AIGovernanceReview.ps1",
    "scripts/Test-AIOS.ps1"
)

foreach ($file in $scriptFiles) {
    Test-PowerShellFile $file
}

foreach ($domain in $domains) {
    Test-RequiredPath "docs/rules/domains/$domain.md"
    Test-RequiredPath "docs/skills/domains/$domain.md"
    Test-RequiredPath "docs/workflows/domains/$domain.md"
    Test-RequiredPath ".ai/prompts/domains/$domain.md"
    Test-RequiredPath "docs/diagnostics/domains/$domain.md"
    Test-RequiredPath ".ai/tasks/$domain"
}

if ($Strict) {
    Test-RequiredPath ".git"
}

if ($failures.Count -gt 0) {
    Write-Output "AI OS validation failed:"
    foreach ($failure in $failures) {
        Write-Output "- $failure"
    }
    exit 1
}

Write-Output "AI OS validation passed."
Write-Output "Validated domains: $($domains -join ', ')"
