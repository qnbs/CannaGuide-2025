# CannaGuide Windows bootstrap — uv (Graphify MCP) + optional tools.
# Usage: pnpm run setup:windows
$ErrorActionPreference = 'Stop'

Write-Host '=== CannaGuide Windows Setup ===' -ForegroundColor Cyan

function Test-Command($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command 'node')) {
    Write-Warning 'Node.js not found. Install Node 24+ from https://nodejs.org or use fnm-windows.'
}

if (-not (Test-Command 'pnpm')) {
    Write-Host 'Enabling Corepack for pnpm...'
    corepack enable
    corepack prepare pnpm@11.13.0 --activate
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
Write-Host 'Installing npm dependencies...'
Set-Location $PSScriptRoot\..
pnpm install

Write-Host ''
Write-Host 'Running Windows doctor...'
pnpm run windows:doctor

Write-Host ''
Write-Host 'Done. Reload Cursor MCP: Settings -> Tools & MCP -> Reload' -ForegroundColor Green
