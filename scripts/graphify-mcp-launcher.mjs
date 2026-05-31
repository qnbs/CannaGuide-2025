#!/usr/bin/env node
/**
 * Cross-platform Graphify MCP stdio launcher for Cursor.
 * Replaces bash/cmd wrappers — requires `uv` on PATH.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const graphJson = join(root, 'graphify-out', 'graph.json')

if (!existsSync(graphJson)) {
    console.error(
        `graphify-mcp: missing ${graphJson} — run from repo root: graphify update .`,
    )
    process.exit(2)
}

const uvCheck = spawnSync('uv', ['--version'], { encoding: 'utf8' })
if (uvCheck.status !== 0) {
    console.error(
        'graphify-mcp: uv not on PATH. Install: https://docs.astral.sh/uv/getting-started/installation/',
    )
    process.exit(127)
}

const result = spawnSync(
    'uv',
    [
        'run',
        '--with',
        'graphifyy',
        '--with',
        'mcp',
        'python',
        '-m',
        'graphify.serve',
        graphJson,
    ],
    { cwd: root, stdio: 'inherit' },
)

process.exit(result.status ?? 1)
