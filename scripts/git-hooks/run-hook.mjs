#!/usr/bin/env node

import { accessSync, constants, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

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

function dependencySources() {
    if (hookName !== 'pre-push') return ['index']
    let updates = ''
    if (!process.stdin.isTTY) {
        try {
            updates = readFileSync(0, 'utf8')
        } catch {}
    }
    const sourceTokens = updates
        .trim()
        .split('\n')
        .map((line) => line.trim().split(/\s+/)[1])
        .filter((sha) => /^[0-9a-f]{40}$/i.test(sha))
    if (sourceTokens.some((sha) => /^0+$/.test(sha))) {
        throw new HookRuntimeError(
            'pre-push only verifies the checked-out HEAD; refusing an unvalidated remote-ref deletion.',
        )
    }
    const sources = sourceTokens.filter((sha) => !/^0+$/.test(sha))
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (head.status !== 0) throw new HookRuntimeError('pre-push cannot resolve the current HEAD.')
    const headSha = head.stdout.trim()
    if (sources.length === 0) return [headSha]
    const commits = [...new Set(sources)].map((source) => {
        const commit = spawnSync('git', ['rev-parse', `${source}^{commit}`], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        })
        if (commit.status !== 0) {
            throw new HookRuntimeError(
                `pre-push cannot resolve local object ${source} as a commit.`,
            )
        }
        return commit.stdout.trim()
    })
    const unsupported = [...new Set(commits)].filter((source) => source !== headSha)
    if (unsupported.length > 0) {
        throw new HookRuntimeError(
            `pre-push only verifies the checked-out HEAD (${headSha}); refusing to push ` +
                `different local commit(s): ${unsupported.join(', ')}. Check out each ref and push it separately.`,
        )
    }
    return [headSha]
}

function assertCleanOutgoingTree() {
    const status = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=normal'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (status.status !== 0) {
        const detail = (status.stderr || '').trim() || status.error?.message || 'unknown error'
        throw new HookRuntimeError(`pre-push cannot inspect the checkout: ${detail}`)
    }
    const changes = status.stdout.trim().split('\n').filter(Boolean)
    if (changes.length > 0) {
        const summary = changes.slice(0, 8).join(', ')
        const remainder = changes.length > 8 ? ` (+${changes.length - 8} more)` : ''
        throw new HookRuntimeError(
            `pre-push gates must inspect the exact outgoing HEAD; commit changes, or run ` +
                `"git stash push --include-untracked", first: ${summary}${remainder}`,
        )
    }
}

try {
    assertNodeVersion()
    lock = acquireHookLock({ hookName })
    console.log(`[hook] acquired repository lock for ${hookName}`)
    dependencySources().forEach((source, index) =>
        assertDependenciesSynchronized({
            source,
            requiredTools: index === 0 ? requiredToolsByHook[hookName] : [],
        }),
    )
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
        try {
            accessSync(hookArguments[0], constants.R_OK)
        } catch {
            throw new HookRuntimeError(
                `commit-msg message file is missing or unreadable: ${hookArguments[0]}`,
            )
        }
        await runLocalTool('commitlint', ['--edit', hookArguments[0]], {
            label: 'commit message',
            timeoutMs: 60_000,
        })
    }

    if (hookName === 'pre-push') {
        assertCleanOutgoingTree()
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
