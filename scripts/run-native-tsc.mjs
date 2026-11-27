#!/usr/bin/env node
// Runs the native TypeScript CLI serially and filters one documented RTK TS2719.
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveLocalTool } from './git-hooks/hook-runtime.mjs'

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEB_WORKSPACE = resolve(REPOSITORY_ROOT, 'apps/web')
const KNOWN_RTK_DIAGNOSTIC_FILE = resolve(REPOSITORY_ROOT, 'apps/web/stores/store.ts')

export function buildNativeTscArgs(args = []) {
    const requestedArgs = args.length > 0 ? [...args] : ['--noEmit']
    if (!requestedArgs.includes('--singleThreaded')) requestedArgs.push('--singleThreaded')
    return requestedArgs
}

export function shouldDelegateRootTypecheck(cwd = process.cwd(), args = []) {
    const plainTypecheck = args.every((argument) =>
        ['--noEmit', '--singleThreaded'].includes(argument),
    )
    return resolve(cwd) === REPOSITORY_ROOT && plainTypecheck
}

export function isWebTypecheck(cwd = process.cwd(), compilerArgs = []) {
    return (
        resolve(cwd) === WEB_WORKSPACE &&
        compilerArgs.includes('--noEmit') &&
        !compilerArgs.includes('--build') &&
        !compilerArgs.includes('-b')
    )
}

function isKnownRtkDiagnostic(line, cwd) {
    const match = /^(.+?)\(\d+,\d+\):\s+error TS2719:/.exec(line)
    return match && resolve(cwd, match[1].trim()) === KNOWN_RTK_DIAGNOSTIC_FILE
}

export function findUnexpectedTypeScriptErrors(
    lines,
    { allowKnownRtkError = false, cwd = process.cwd() } = {},
) {
    return lines.filter(
        (line) =>
            line.includes('error TS') &&
            !(allowKnownRtkError && isKnownRtkDiagnostic(line, cwd)),
    )
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
    if (shouldDelegateRootTypecheck(process.cwd(), args)) {
        const result = spawnSync(
            process.execPath,
            [resolve(REPOSITORY_ROOT, 'scripts/scoped-verify.mjs'), 'typecheck'],
            { stdio: 'inherit', shell: false },
        )
        if (result.error) {
            console.error(result.error.message)
            return 1
        }
        return typeof result.status === 'number' ? result.status : 1
    }

    const compilerArgs = buildNativeTscArgs(args)
    const allowKnownRtkError = isWebTypecheck(process.cwd(), compilerArgs)
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
    const unknownErrors = findUnexpectedTypeScriptErrors(lines, {
        allowKnownRtkError,
        cwd: process.cwd(),
    })

    if (unknownErrors.length > 0) {
        console.error(output)
        return 1
    }

    const filtered = allowKnownRtkError
        ? lines.filter((line) => isKnownRtkDiagnostic(line, process.cwd())).length
        : 0
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
