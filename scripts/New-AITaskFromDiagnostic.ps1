param(
    [Parameter(Mandatory = $true)]
    [string]$DiagnosticPath,

    [string]$TaskId,
    [string]$Priority
)

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not [System.IO.Path]::IsPathRooted($DiagnosticPath)) {
    $DiagnosticPath = Join-Path $repoRoot $DiagnosticPath
}

if (-not (Test-Path -LiteralPath $DiagnosticPath)) {
    throw "Diagnostic not found: $DiagnosticPath"
}

$raw = Get-Content -LiteralPath $DiagnosticPath -Raw

function Get-FrontMatterValue {
    param(
        [string]$Content,
        [string]$Key
    )

    $pattern = "(?m)^$([regex]::Escape($Key)):\s*(.+)$"
    $match = [regex]::Match($Content, $pattern)
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }
    return $null
}

$domain = Get-FrontMatterValue -Content $raw -Key "domain"
$title = Get-FrontMatterValue -Content $raw -Key "title"
$severity = Get-FrontMatterValue -Content $raw -Key "severity"

if ([string]::IsNullOrWhiteSpace($domain)) {
    throw "Diagnostic is missing front matter value: domain"
}

if ([string]::IsNullOrWhiteSpace($title)) {
    $title = [System.IO.Path]::GetFileNameWithoutExtension($DiagnosticPath)
}

if ([string]::IsNullOrWhiteSpace($Priority)) {
    if ([string]::IsNullOrWhiteSpace($severity)) {
        $Priority = "medium"
    } else {
        $Priority = $severity
    }
}

& (Join-Path $PSScriptRoot "New-AITaskBundle.ps1") -Domain $domain -Feature $title -Priority $Priority -TaskId $TaskId

