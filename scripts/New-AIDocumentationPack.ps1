param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [string]$Summary = "Update technical memory and operational guidance"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $repoRoot ".ai/reports/docs"
$outputPath = Join-Path $outputDir "$TaskId-docs.md"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$content = @"
# Documentation Pack - $TaskId

## Summary

$Summary

## Updated architecture

- confirm whether the domain flow for $Domain changed
- record new dependencies or boundaries

## Updated business rules

- confirm whether docs/business-rules/global.md or domain rules require an update

## Updated runbooks

- add rollout, rollback, and operational notes when needed

## Follow-up docs

- user-facing docs if behavior changed
- observability docs if metrics or alerts changed
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding UTF8
Write-Output $outputPath

