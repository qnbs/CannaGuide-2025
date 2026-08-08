import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import test from 'node:test'

import {
    REPO_ROOT,
    acquireHookLock,
    assertDependenciesSynchronized,
    assertSafeResourcePressure,
    parseMemoryStatus,
    resolveLocalBinary,
    runStep,
} from './hook-runtime.mjs'

function fixture() {
    const root = mkdtempSync(join(REPO_ROOT, '.hook-test-'))
    const gitCommonDir = join(root, '.git')
    mkdirSync(gitCommonDir)
    return {
        root,
        gitCommonDir,
        cleanup: () => rmSync(root, { recursive: true, force: true }),
    }
}

function writeDependencyMetadata(root, { lock = 'lock\n', manager = 'pnpm@11.19.0' } = {}) {
    mkdirSync(join(root, 'node_modules', '.pnpm'), { recursive: true })
    writeFileSync(join(root, 'pnpm-lock.yaml'), lock)
    writeFileSync(join(root, 'node_modules', '.pnpm', 'lock.yaml'), lock)
    writeFileSync(join(root, 'node_modules', '.modules.yaml'), `packageManager: ${manager}\n`)
    writeFileSync(join(root, 'package.json'), `${JSON.stringify({ packageManager: manager })}\n`)
}

function writeJsonStyleDependencyMetadata(root, manager) {
    writeFileSync(
        join(root, 'node_modules', '.modules.yaml'),
        `  "packageManager": "${manager}",\n`,
    )
}

async function waitForProcessTermination(pid, timeoutMs = 2_000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        try {
            process.kill(pid, 0)
            if (process.platform === 'linux') {
                const state = readFileSync(`/proc/${pid}/stat`, 'utf8').split(' ')[2]
                if (state === 'Z') return
            }
        } catch (error) {
            if (error && typeof error === 'object' && error.code === 'ESRCH') return
            throw error
        }
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 25))
    }
    assert.fail(`process ${pid} remained alive after process-group termination`)
}

test('same-boot hook contention fails fast and preserves the active lock', () => {
    const { root, gitCommonDir, cleanup } = fixture()
    try {
        const first = acquireHookLock({
            hookName: 'pre-push',
            gitCommonDir,
            bootIdentity: 'boot-a',
            pid: 101,
        })
        assert.throws(
            () =>
                acquireHookLock({
                    hookName: 'pre-commit',
                    gitCommonDir,
                    bootIdentity: 'boot-a',
                    pid: 202,
                }),
            /Another repository hook is already active: pre-push/,
        )
        assert.equal(JSON.parse(readFileSync(join(first.lockDirectory, 'owner.json'))).pid, 101)
        first.release()
    } finally {
        cleanup()
    }
})

test('a changed boot identity proves and recovers a stale lock', () => {
    const { gitCommonDir, cleanup } = fixture()
    try {
        acquireHookLock({
            hookName: 'pre-push',
            gitCommonDir,
            bootIdentity: 'boot-before-crash',
            pid: 101,
        })
        const recovered = acquireHookLock({
            hookName: 'pre-commit',
            gitCommonDir,
            bootIdentity: 'boot-after-crash',
            pid: 202,
        })
        assert.equal(recovered.owner.hookName, 'pre-commit')
        recovered.release()
    } finally {
        cleanup()
    }
})

test('an unreadable lock is never deleted speculatively', () => {
    const { gitCommonDir, cleanup } = fixture()
    try {
        const lockDirectory = join(gitCommonDir, 'cannaguide-hook.lock')
        mkdirSync(lockDirectory)
        writeFileSync(join(lockDirectory, 'owner.json'), '{not-json')
        assert.throws(
            () =>
                acquireHookLock({
                    hookName: 'pre-commit',
                    gitCommonDir,
                    bootIdentity: 'boot-a',
                }),
            /metadata is unreadable/,
        )
        assert.equal(readFileSync(join(lockDirectory, 'owner.json'), 'utf8'), '{not-json')
    } finally {
        cleanup()
    }
})

test('dependency preflight accepts a byte-identical pinned install', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight accepts pnpm 11 quoted install metadata', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeJsonStyleDependencyMetadata(root, 'pnpm@11.19.0')
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects lockfile drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(join(root, 'node_modules', '.pnpm', 'lock.yaml'), 'different\n')
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /Hooks never install implicitly/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects a package-manager mismatch', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(join(root, 'node_modules', '.modules.yaml'), 'packageManager: pnpm@11.11.0\n')
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /repository requires pnpm@11\.19\.0/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects a missing required local tool', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: ['eslint'] }),
            /Required local tool 'eslint' is unavailable/,
        )
    } finally {
        cleanup()
    }
})

test('local binary resolution never consults pnpm', () => {
    const { root, cleanup } = fixture()
    try {
        const binDirectory = join(root, 'node_modules', '.bin')
        mkdirSync(binDirectory, { recursive: true })
        const binary = join(binDirectory, 'eslint')
        writeFileSync(binary, '#!/bin/sh\nexit 0\n')
        chmodSync(binary, 0o755)
        assert.equal(resolveLocalBinary('eslint', { repoRoot: root, platform: 'linux' }), binary)
    } finally {
        cleanup()
    }
})

test('resource guard warns on low memory but fails only under dangerous pressure', () => {
    assert.deepEqual(
        parseMemoryStatus(
            'MemAvailable: 1048576 kB\nSwapTotal: 2097152 kB\nSwapFree: 1048576 kB\n',
        ),
        { availableMb: 1024, swapFreeMb: 1024, swapTotalMb: 2048 },
    )
    assert.doesNotThrow(() =>
        assertSafeResourcePressure({
            readStatus: () => ({ availableMb: 500, swapFreeMb: 1024, swapTotalMb: 2048 }),
        }),
    )
    assert.throws(
        () =>
            assertSafeResourcePressure({
                readStatus: () => ({ availableMb: 300, swapFreeMb: 100, swapTotalMb: 2048 }),
            }),
        /Dangerous resource pressure/,
    )
})

test('a timed-out step terminates its entire process group', async () => {
    const { root, cleanup } = fixture()
    const pidFile = join(root, 'grandchild.pid')
    let grandchildPid
    try {
        const grandchildProgram = "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"
        const supervisorProgram = [
            "const { spawn } = require('node:child_process')",
            "const { writeFileSync } = require('node:fs')",
            `const child = spawn(process.execPath, ['-e', ${JSON.stringify(grandchildProgram)}], { stdio: 'ignore' })`,
            `writeFileSync(${JSON.stringify(pidFile)}, String(child.pid))`,
            'setInterval(() => {}, 1000)',
        ].join(';')

        await assert.rejects(
            runStep('timeout regression', process.execPath, ['-e', supervisorProgram], {
                timeoutMs: 1_500,
                terminationGraceMs: 100,
                heartbeatMs: 60_000,
            }),
            /timed out after .*; child exited via/,
        )
        grandchildPid = Number(readFileSync(pidFile, 'utf8'))
        await waitForProcessTermination(grandchildPid)
    } finally {
        if (grandchildPid) {
            try {
                process.kill(grandchildPid, 'SIGKILL')
            } catch {
                // Expected when process-group termination worked.
            }
        }
        cleanup()
    }
})

test('active hook path contains no pnpm process launch', () => {
    const files = [
        '.husky/pre-commit',
        '.husky/commit-msg',
        '.husky/pre-push',
        'scripts/git-hooks/run-hook.mjs',
        'scripts/scoped-verify.mjs',
        'scripts/typecheck-filter.mjs',
        'scripts/lint-scopes.mjs',
    ]
    for (const file of files) {
        const source = readFileSync(resolve(REPO_ROOT, file), 'utf8')
        assert.doesNotMatch(source, /(?:spawnSync|spawn|execFileSync)\s*\(\s*['"]pnpm['"]/, file)
        if (file.startsWith('.husky/')) assert.doesNotMatch(source, /^\s*pnpm\s/m, file)
    }
})
