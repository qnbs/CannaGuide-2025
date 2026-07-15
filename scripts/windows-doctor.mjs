#!/usr/bin/env node
/**
 * Windows environment preflight for CannaGuide local dev + MCP + GitHub CLI.
 * Usage: `pnpm run windows:doctor`
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'

if (!isWindows) {
    console.log('windows:doctor — skipped (not win32); use devcontainer:doctor on Linux/macOS')
    process.exit(0)
}

let failed = false
let warned = false
const ok = (msg) => console.log(`ok   ${msg}`)
const warn = (msg) => {
    console.warn(`warn ${msg}`)
    warned = true
}
const bad = (msg) => {
    console.error(`fail ${msg}`)
    failed = true
}

const run = (cmd, args, opts = {}) =>
    spawnSync(cmd, args, { encoding: 'utf8', shell: true, ...opts })

console.log('=== CannaGuide Windows Doctor ===\n')

const nodeVer = process.version
const major = Number(nodeVer.slice(1).split('.')[0])
if (major >= 24) {
    ok(`Node ${nodeVer} (matches engines >=24)`)
} else {
    warn(`Node ${nodeVer} — CI uses Node 24; install nvm-windows or fnm and switch to 24.x`)
}

const pnpm = run('pnpm', ['--version'])
if (pnpm.status === 0) ok(`pnpm ${pnpm.stdout.trim()}`)
else bad('pnpm not found -- corepack enable && corepack prepare pnpm@11.13.0 --activate')

const git = run('git', ['--version'])
if (git.status === 0) ok(git.stdout.trim())
else bad('git not found')

const gh = run('gh', ['--version'])
if (gh.status === 0) {
    ok(gh.stdout.trim().split('\n')[0])
    const auth = run('gh', ['auth', 'status'])
    if (auth.status === 0) ok('gh auth: logged in')
    else warn('gh not authenticated — run: gh auth login')
} else {
    warn('gh CLI missing — winget install GitHub.cli')
}

const uv = run('uv', ['--version'])
if (uv.status === 0) ok(uv.stdout.trim())
else warn('uv missing (Graphify MCP) — pnpm run setup:windows or: irm https://astral.sh/uv/install.ps1 | iex')

const gk = run('where', ['gk'])
if (gk.status === 0) {
    ok(`gk on PATH: ${gk.stdout.trim().split('\n')[0]}`)
    const gkVer = run('gk', ['--version'])
    if (gkVer.status === 0) ok(gkVer.stdout.trim())
} else {
    warn('GitKraken CLI (gk) missing — winget install GitKraken.cli OR GitLens: Install GitKraken MCP Server')
}

if (existsSync(join(root, 'node_modules'))) ok('node_modules present')
else warn('node_modules missing — run: pnpm install')

const mcpJson = join(root, '.mcp.json')
if (existsSync(mcpJson)) {
    try {
        const cfg = JSON.parse(readFileSync(mcpJson, 'utf8'))
        const graphify = cfg.mcpServers?.graphify
        if (graphify?.command === 'node') ok('.mcp.json uses cross-platform graphify launcher')
        else if (graphify?.command === 'bash')
            warn('.mcp.json uses bash — prefer node scripts/graphify-mcp-launcher.mjs on Windows')
        if (cfg.mcpServers?.gitkraken) ok('gitkraken MCP entry configured')
    } catch (e) {
        bad(`.mcp.json invalid: ${e.message}`)
    }
} else {
    bad('.mcp.json missing')
}

if (existsSync(join(root, '.vscode', 'settings.json'))) ok('.vscode/settings.json present')
else warn('.vscode/settings.json missing')

console.log('\n--- MCP doctor ---\n')
const mcp = run('node', ['./scripts/mcp-doctor.mjs'], { cwd: root, stdio: 'inherit' })
if (mcp.status !== 0) failed = true

console.log('\n=== Quick fixes ===')
console.log('  pnpm run setup:windows     # uv + PATH hints')
console.log('  pnpm install               # deps')
console.log('  pnpm run mcp:doctor        # Graphify + GitKraken MCP')
console.log('  gh auth login              # GitHub CLI')
console.log('  gk auth login              # GitKraken MCP (after gk install)')

process.exit(failed ? 1 : warned ? 0 : 0)
