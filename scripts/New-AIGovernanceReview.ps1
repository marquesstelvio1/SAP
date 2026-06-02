param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [ValidateSet("critical", "high", "medium", "low")]
    [string]$Risk = "medium"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot ".ai/operating-system.json"
$gatesPath = Join-Path $repoRoot ".ai/policies/governance-gates.json"
$riskPath = Join-Path $repoRoot ".ai/policies/risk-matrix.json"
$outputDir = Join-Path $repoRoot ".ai/reports/governance"
$outputPath = Join-Path $outputDir "$TaskId-governance.md"

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$gates = Get-Content -LiteralPath $gatesPath -Raw | ConvertFrom-Json
$riskMatrix = Get-Content -LiteralPath $riskPath -Raw | ConvertFrom-Json

if ($manifest.domains.PSObject.Properties.Name -notcontains $Domain) {
    throw "Unknown domain '$Domain'"
}

$ownerAgent = $manifest.domains.$Domain.ownerAgent
$requiredGates = foreach ($gate in $gates.gates) {
    if ($gate.requiredFor -contains "all" -or $gate.requiredFor -contains $Domain -or $gate.requiredFor -contains $Risk) {
        $gate
    }
}

$riskConfig = $riskMatrix.levels.$Risk
$approvalText = if ($riskConfig.approvalRequired) { "required" } else { "not required by default" }
$releaseBlockerText = if ($riskConfig.releaseBlocker) { "yes" } else { "no" }

$gateLines = foreach ($gate in $requiredGates) {
    "- $($gate.name): owner $($gate.owner)"
}

$content = @"
# Governance Review - $TaskId

## Domain

$Domain

## Owner agent

$ownerAgent

## Risk

- Level: $Risk
- Human approval: $approvalText
- Release blocker: $releaseBlockerText

## Required gates

$($gateLines -join "`r`n")

## Review checklist

- Scope is explicit.
- Contracts are protected.
- Auth and security impact is clear.
- Tests are planned or implemented.
- Docs and changelog are planned or updated.
- Release and rollback are known.

## Decision

Pending human or designated gate owner review.
"@

Set-Content -LiteralPath $outputPath -Value $content -Encoding UTF8
Write-Output $outputPath

