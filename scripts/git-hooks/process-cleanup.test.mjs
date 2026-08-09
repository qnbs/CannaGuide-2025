import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { REPO_ROOT, runStep } from './hook-runtime.mjs'

function fixture() {
    let root
    try {
        root = mkdtempSync(join(tmpdir(), 'cannaguide-process-test-'))
    } catch (error) {
        if (
            !error ||
            typeof error !== 'object' ||
            !['EACCES', 'ENOENT', 'EROFS'].includes(error.code)
        ) {
            throw error
        }
        root = mkdtempSync(join(REPO_ROOT, '.hook-test-'))
    }
    return {
        root,
        cleanup: () => rmSync(root, { recursive: true, force: true }),
    }
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
            if (error && typeof error === 'object' && ['ESRCH', 'ENOENT'].includes(error.code)) {
                return
            }
            throw error
        }
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 25))
    }
    assert.fail(`process ${pid} remained alive after process-group termination`)
}

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
            /timed out after .*; child (?:terminated by|exited with code)/,
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

test(
    'standalone runner remains alive for forced descendant cleanup',
    { skip: process.platform === 'win32' },
    () => {
        const runtimeUrl = new URL('./hook-runtime.mjs', import.meta.url).href
        const grandchild = "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)"
        const supervisor = [
            "const { spawn } = require('node:child_process')",
            `spawn(process.execPath, ['-e', ${JSON.stringify(grandchild)}], { stdio: 'ignore' })`,
            'setInterval(() => {}, 1000)',
        ].join(';')
        const program = [
            `import { runStep } from ${JSON.stringify(runtimeUrl)}`,
            `try { await runStep('standalone timeout', process.execPath, ['-e', ${JSON.stringify(supervisor)}], { timeoutMs: 200, terminationGraceMs: 100, heartbeatMs: 60_000 }) } catch (error) { if (/timed out/.test(error.message)) process.exit(0); console.error(error); process.exit(2) }`,
            'process.exit(3)',
        ].join(';')

        const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], {
            encoding: 'utf8',
            timeout: 5_000,
        })
        assert.equal(result.status, 0, result.stderr || result.stdout)
    },
)

test(
    'SIGHUP terminates the active process group',
    { skip: process.platform === 'win32' },
    async () => {
        const { root, cleanup } = fixture()
        const pidFile = join(root, 'hangup-child.pid')
        let childPid
        try {
            const signalEmitter = new EventEmitter()
            const childProgram = [
                "const { writeFileSync } = require('node:fs')",
                `writeFileSync(${JSON.stringify(pidFile)}, String(process.pid))`,
                "process.on('SIGHUP', () => {})",
                "process.on('SIGTERM', () => {})",
                'setInterval(() => {}, 1000)',
            ].join(';')
            const step = runStep('hangup regression', process.execPath, ['-e', childProgram], {
                heartbeatMs: 60_000,
                terminationGraceMs: 100,
                signalEmitter,
            })

            const deadline = Date.now() + 2_000
            while (!childPid && Date.now() < deadline) {
                try {
                    childPid = Number(readFileSync(pidFile, 'utf8'))
                } catch {
                    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25))
                }
            }
            assert.ok(childPid, 'child process did not start')
            signalEmitter.emit('SIGHUP')
            await assert.rejects(step, /hangup regression interrupted by SIGHUP/)
            await waitForProcessTermination(childPid)
        } finally {
            if (childPid) {
                try {
                    process.kill(childPid, 'SIGKILL')
                } catch {
                    // Expected when SIGHUP process-group termination worked.
                }
            }
            cleanup()
        }
    },
)
