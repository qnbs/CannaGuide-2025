# CannaGuide Windows bootstrap — uv (Graphify MCP) + optional tools.
# Usage: pnpm run setup:windows
$ErrorActionPreference = 'Stop'

Write-Host '=== CannaGuide Windows Setup ===' -ForegroundColor Cyan

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot
$packageManager = (Get-Content (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json).packageManager
if ($packageManager -match '^pnpm@([^+\s]+)(?:\+.+)?$') {
    $requiredPnpm = $Matches[1]
} else {
    throw "package.json must declare packageManager as pnpm@<version>; found '$packageManager'."
}

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command 'node')) {
    Write-Warning 'Node.js not found. Install Node 24+ from https://nodejs.org or use fnm-windows.'
}

# Do not trust a global pnpm on PATH. Corepack resolves the repository's exact
# packageManager declaration from package.json.
if (-not (Test-Command 'corepack')) {
    Write-Host 'Corepack not bundled with this Node; installing from npm...'
    npm install -g corepack@latest
}
corepack enable pnpm
$activePnpm = (corepack pnpm --version 2>$null)
if ($activePnpm -ne $requiredPnpm) {
    throw "Corepack must resolve $packageManager, but returned '$activePnpm'."
}

if (-not (Test-Command 'uv')) {
    Write-Host 'Installing uv (Graphify MCP dependency)...'
    irm https://astral.sh/uv/install.ps1 | iex
    $uvPath = Join-Path $env:USERPROFILE '.local\bin'
    if (Test-Path $uvPath) {
        $env:Path = "$uvPath;$env:Path"
        Write-Host "Added $uvPath to PATH for this session. Add permanently via System Environment Variables if needed."
    }
} else {
    Write-Host "uv already installed: $(uv --version)"
}

if (-not (Test-Command 'gh')) {
    Write-Warning 'GitHub CLI not found. Install: winget install GitHub.cli'
}

if (-not (Test-Command 'gk')) {
    Write-Warning 'GitKraken CLI not found. Install: winget install GitKraken.cli — then: gk auth login'
    Write-Warning 'Or use Cursor: GitLens: Install GitKraken MCP Server'
}

Write-Host ''
Write-Host 'Installing dependencies with the repository-pinned pnpm...'
corepack pnpm install --frozen-lockfile

Write-Host ''
Write-Host 'Running Windows doctor...'
corepack pnpm run windows:doctor

Write-Host ''
Write-Host 'Done. Reload Cursor MCP: Settings -> Tools & MCP -> Reload' -ForegroundColor Green
