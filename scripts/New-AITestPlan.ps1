param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [string]$CriticalPath = "core journey"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $repoRoot ".ai/reports/tests"
$outputPath = Join-Path $outputDir "$TaskId-test-plan.md"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$content = @"
# Test Plan - $TaskId

## Scope

- Domain: $Domain
- Critical path: $CriticalPath

## Critical paths

- happy path
- error handling
- permission and boundary checks
- rollback-sensitive behavior

## Test types

- unit
- integration
- smoke
- regression

## Required fixtures

- representative domain data
- failure mode inputs
- monitoring expectations for critical flows

## Automation strategy

- automate high-risk and repeated checks first
- keep smoke coverage for release protection

## Exit criteria

- critical-path checks pass
- no unresolved blocker remains
- residual risk is documented
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding UTF8
Write-Output $outputPath

