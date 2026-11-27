#!/usr/bin/env node
// Runs the native TypeScript CLI serially and filters one documented RTK TS2719.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveLocalTool } from './git-hooks/hook-runtime.mjs'

export function buildNativeTscArgs(args = []) {
    const requestedArgs = args.length > 0 ? [...args] : ['--noEmit']
    if (!requestedArgs.includes('--singleThreaded')) requestedArgs.push('--singleThreaded')
    return requestedArgs
}

export function formatCompilerTermination(result) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trimEnd()
    const reason =
        result.error?.message ||
        `TypeScript compiler terminated without an exit code${result.signal ? ` (${result.signal})` : ''}.`
    return output ? `${output}\n${reason}` : reason
}

function runNativeTsc(args = process.argv.slice(2)) {
    const tsc = resolveLocalTool('tsc')
    const compilerArgs = buildNativeTscArgs(args)
    const result = spawnSync(tsc.command, [...tsc.argsPrefix, ...compilerArgs], {
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: false,
    })

    const output = (result.stdout || '') + (result.stderr || '')
    const isBuild = compilerArgs.includes('--build') || compilerArgs.includes('-b')
    const operation = isBuild ? 'TypeScript build' : 'Typecheck'

    if (result.status === 0) {
        console.log(`[OK] ${operation} passed`)
        return 0
    }

    if (result.error || typeof result.status !== 'number') {
        console.error(formatCompilerTermination(result))
        return 1
    }

    const lines = output.split('\n')
    const isKnownRtkError = (line) => line.includes('TS2719') && line.includes('store.ts')
    const unknownErrors = lines.filter(
        (line) => line.includes('error TS') && !isKnownRtkError(line),
    )

    if (unknownErrors.length > 0) {
        console.error(output)
        return 1
    }

    const filtered = lines.filter((line) => isKnownRtkError(line)).length
    if (filtered === 0) {
        console.error(output || `TypeScript compiler exited with status ${result.status}.`)
        return 1
    }

    console.log(`[OK] ${operation} passed (${filtered} known RTK TS2719 in store.ts filtered)`)
    return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = runNativeTsc()
}
