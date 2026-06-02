param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$Title,

    [ValidateSet("critical", "high", "medium", "low")]
    [string]$Severity = "medium",

    [Parameter(Mandatory = $true)]
    [string]$Impact,

    [Parameter(Mandatory = $true)]
    [string]$Evidence,

    [string]$RecommendedAction = "Generate task bundle and route through governance gates.",
    [string]$DiagnosticId
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot ".ai/operating-system.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Missing operating system manifest at $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$domains = $manifest.domains.PSObject.Properties.Name

if ($domains -notcontains $Domain) {
    throw "Unknown domain '$Domain'. Allowed values: $($domains -join ', ')"
}

if ([string]::IsNullOrWhiteSpace($DiagnosticId)) {
    $DiagnosticId = "DIAG-{0}" -f (Get-Date -Format "yyyyMMdd-HHmmss")
}

$ownerAgent = $manifest.domains.$Domain.ownerAgent
$outputDir = Join-Path $repoRoot "docs/diagnostics/domains"
$outputPath = Join-Path $outputDir "$DiagnosticId-$Domain.md"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$content = @"
---
id: $DiagnosticId
domain: $Domain
severity: $Severity
ownerAgent: $ownerAgent
title: $Title
---

# $DiagnosticId - $Title

## Domain

$Domain

## Severity

$Severity

## Impact

$Impact

## Evidence

$Evidence

## Recommended action

$RecommendedAction

## Suggested task conversion

Run:

````powershell
powershell -ExecutionPolicy Bypass -File .\scripts\New-AITaskFromDiagnostic.ps1 -DiagnosticPath "$outputPath"
````
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding UTF8
Write-Output $outputPath

