param(
    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [Parameter(Mandatory = $true)]
    [string]$Title,

    [string]$CommitType = "feat",
    [string]$Summary = "AI-generated delivery artifact"
)

function Convert-ToSlug {
    param([string]$Value)

    $slug = $Value.ToLowerInvariant() -replace "[^a-z0-9]+", "-"
    $slug = $slug.Trim("-")
    if ($slug.Length -gt 32) {
        $slug = $slug.Substring(0, 32).Trim("-")
    }
    return $slug
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$prDir = Join-Path $repoRoot ".ai/reports/pr-drafts"
$commitDir = Join-Path $repoRoot ".ai/commits"
$slug = Convert-ToSlug -Value $Title
$branchName = "$CommitType/$Domain/$($TaskId.ToLower())-$slug"
$commitSummary = "$CommitType($Domain): $Summary"
$prPath = Join-Path $prDir "$TaskId-pr.md"
$commitPath = Join-Path $commitDir "$TaskId.commit.md"

New-Item -ItemType Directory -Force -Path $prDir, $commitDir | Out-Null

$prContent = @"
# $Title

## Context

AI-generated PR draft for task $TaskId.

## Linked task

- $TaskId

## Change summary

$Summary

## Impacted domains

- $Domain

## Validation

- tests generated or updated
- docs generated or updated
- governance gates checked

## Risk

- review domain-specific rules before merge

## Rollout and rollback

- Branch: $branchName
- Rollback: revert commit and redeploy previous known-good state
"@

$commitContent = @"
$commitSummary

Task: $TaskId
Branch: $branchName
Validation: tests, docs, changelog, and governance review expected
"@

Set-Content -LiteralPath $prPath -Value $prContent -Encoding UTF8
Set-Content -LiteralPath $commitPath -Value $commitContent -Encoding UTF8

Write-Output $prPath
Write-Output $commitPath

