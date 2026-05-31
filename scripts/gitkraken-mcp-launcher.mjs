#!/usr/bin/env node
/**
 * GitKraken MCP launcher with clear error when `gk` is missing (Windows-friendly).
 */
import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const check = spawnSync(isWindows ? 'where' : 'which', ['gk'], {
    encoding: 'utf8',
    shell: isWindows,
})

if (check.status !== 0) {
    console.error(
        'gitkraken-mcp: gk CLI not on PATH.\n' +
            '  Install: winget install GitKraken.cli\n' +
            '  Auth:    gk auth login\n' +
            '  Or:      Cursor palette → GitLens: Install GitKraken MCP Server',
    )
    process.exit(127)
}

const result = spawnSync('gk', ['mcp'], { stdio: 'inherit', shell: isWindows })
process.exit(result.status ?? 1)
