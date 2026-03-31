#!/usr/bin/env node
// Runs tsc --noEmit and filters known upstream errors (RTK TS2719).
// Exits 0 if no unknown errors remain, 1 otherwise.
import { spawnSync } from 'node:child_process'

const result = spawnSync('npx', ['tsc', '--noEmit'], {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe'],
})

const output = (result.stdout || '') + (result.stderr || '')

if (result.status === 0) {
    console.log('[OK] Typecheck passed')
    process.exit(0)
}

const lines = output.split('\n')
const unknownErrors = lines.filter((l) => l.includes('error TS') && !l.includes('TS2719'))

if (unknownErrors.length > 0) {
    // Print full output so developers see all context
    console.error(output)
    process.exit(1)
}

const filtered = lines.filter((l) => l.includes('TS2719')).length
console.log(`[OK] Typecheck passed (${filtered} known RTK TS2719 filtered)`)
