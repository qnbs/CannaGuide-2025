#!/usr/bin/env node
/**
 * Preflight for all project MCP servers (Graphify + GitKraken).
 * Usage: `pnpm run mcp:doctor`
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mcpJson = join(root, '.mcp.json')
const isWindows = process.platform === 'win32'

let failed = false
const ok = (msg) => console.log(`ok   ${msg}`)
const warn = (msg) => console.warn(`warn ${msg}`)
const bad = (msg) => {
    console.error(`fail ${msg}`)
    failed = true
}

console.log('=== MCP Preflight (Graphify + GitKraken) ===\n')

if (!existsSync(mcpJson)) {
    bad('.mcp.json missing')
} else {
    ok('.mcp.json exists')
    try {
        const parsed = JSON.parse(readFileSync(mcpJson, 'utf8'))
        const servers = parsed.mcpServers ?? {}
        if (servers.graphify) {
            ok('graphify server configured')
            const cmd = servers.graphify.command
            if (isWindows && cmd === 'bash') {
                warn(
                    'graphify uses bash on Windows — prefer cmd + scripts/graphify-mcp-stdio-windows.cmd',
                )
            }
        } else {
            bad('graphify server missing in mcp.json')
        }
        if (servers.gitkraken) {
            ok('gitkraken server configured')
            const cmd = servers.gitkraken.command
            if (cmd === 'node') ok('gitkraken uses node launcher (Windows-friendly)')
        } else {
            warn('gitkraken server missing — add { "command": "gk", "args": ["mcp"] }')
        }
    } catch (e) {
        bad(`mcp.json parse error: ${e.message}`)
    }
}

const gk = spawnSync(isWindows ? 'where' : 'which', isWindows ? ['gk'] : ['gk'], {
    encoding: 'utf8',
    shell: isWindows,
})
if (gk.status === 0) {
    ok(`gk CLI on PATH (${gk.stdout.trim().split('\n')[0]})`)
    const gkVer = spawnSync('gk', ['--version'], { encoding: 'utf8', shell: isWindows })
    if (gkVer.status === 0) {
        ok(gkVer.stdout.trim())
    }
} else {
    warn(
        'gk CLI not on PATH — install GitKraken CLI (winget install GitKraken.cli) then run: gk auth login',
    )
    warn('Alternative: Cursor command palette → GitLens: Install GitKraken MCP Server')
}

console.log('\n--- Graphify MCP doctor ---\n')
const graphifyDoctor = spawnSync('node', ['./scripts/graphify-mcp-doctor.mjs'], {
    cwd: root,
    stdio: 'inherit',
    shell: isWindows,
})
if (graphifyDoctor.status !== 0) {
    failed = true
}

console.log('\n=== MCP setup hints ===')
console.log('- Windows graphify: cmd + scripts/graphify-mcp-stdio-windows.cmd (requires uv)')
console.log('- Linux/macOS graphify: bash scripts/graphify-mcp-stdio.sh')
console.log('- GitKraken: gk auth login, then reload MCP in Cursor Settings → Tools & MCP')
console.log('- Install uv: https://docs.astral.sh/uv/getting-started/installation/')

process.exit(failed ? 1 : 0)
