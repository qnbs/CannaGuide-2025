#!/usr/bin/env node

import {
    HookRuntimeError,
    acquireHookLock,
    assertDependenciesSynchronized,
    assertNodeVersion,
    assertSafeResourcePressure,
    runLocalTool,
    runNodeScript,
} from './hook-runtime.mjs'

const hookName = process.argv[2]
const hookArguments = process.argv.slice(3)
const supportedHooks = new Set(['pre-commit', 'commit-msg', 'pre-push'])
const requiredToolsByHook = {
    'pre-commit': ['lint-staged', 'anti-trojan-source', 'eslint', 'prettier'],
    'commit-msg': ['commitlint'],
    'pre-push': ['turbo', 'tsc', 'eslint'],
}

if (!supportedHooks.has(hookName)) {
    console.error(
        `[hook] Unknown hook '${hookName ?? ''}'. Expected: ${[...supportedHooks].join(', ')}`,
    )
    process.exit(2)
}

let lock
let interruptedSignal = null
const rememberInterrupt = (signal) => {
    interruptedSignal ??= signal
}
const onInterrupt = () => rememberInterrupt('SIGINT')
const onTerminate = () => rememberInterrupt('SIGTERM')
const onHangup = () => rememberInterrupt('SIGHUP')
process.on('SIGINT', onInterrupt)
process.on('SIGTERM', onTerminate)
process.on('SIGHUP', onHangup)

function assertNotInterrupted() {
    if (interruptedSignal) {
        throw new HookRuntimeError(`${hookName} interrupted by ${interruptedSignal}`)
    }
}

try {
    assertNodeVersion()
    lock = acquireHookLock({ hookName })
    console.log(`[hook] acquired repository lock for ${hookName}`)
    assertDependenciesSynchronized({ requiredTools: requiredToolsByHook[hookName] })
    assertNotInterrupted()

    if (hookName === 'pre-commit') {
        await runNodeScript('scripts/check-commit-identity.mjs', [], {
            label: 'commit identity',
            timeoutMs: 60_000,
        })
        assertNotInterrupted()
        await runLocalTool('lint-staged', ['--concurrent', '1'], {
            label: 'staged security, lint and formatting checks',
            timeoutMs: 10 * 60_000,
        })
    }

    if (hookName === 'commit-msg') {
        if (hookArguments.length !== 1) {
            throw new HookRuntimeError('commit-msg requires exactly one message-file argument.')
        }
        await runLocalTool('commitlint', ['--edit', hookArguments[0]], {
            label: 'commit message',
            timeoutMs: 60_000,
        })
    }

    if (hookName === 'pre-push') {
        assertSafeResourcePressure()
        assertNotInterrupted()
        await runNodeScript('scripts/scoped-verify.mjs', ['typecheck'], {
            label: 'affected-workspace typecheck',
            timeoutMs: 20 * 60_000,
        })
        assertNotInterrupted()
        await runNodeScript('scripts/lint-scopes.mjs', ['--changed'], {
            label: 'changed strict-scope lint',
            timeoutMs: 20 * 60_000,
        })
        assertNotInterrupted()
        await runNodeScript('scripts/check-file-budget.mjs', [], {
            label: 'changed-file budget',
            timeoutMs: 2 * 60_000,
        })
        assertNotInterrupted()
        await runNodeScript('scripts/check-doc-metrics.mjs', [], {
            label: 'doc-metric truth',
            timeoutMs: 2 * 60_000,
        })
    }

    assertNotInterrupted()
    console.log(`[hook] ${hookName} completed successfully`)
} catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[hook] ${hookName} FAILED: ${message}`)
    process.exitCode = 1
} finally {
    process.removeListener('SIGINT', onInterrupt)
    process.removeListener('SIGTERM', onTerminate)
    process.removeListener('SIGHUP', onHangup)
    if (lock) {
        try {
            lock.release()
            console.log(`[hook] released repository lock for ${hookName}`)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`[hook] failed to release repository lock: ${message}`)
            process.exitCode = 1
        }
    }
}
