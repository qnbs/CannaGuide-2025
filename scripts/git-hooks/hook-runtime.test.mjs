import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import test from 'node:test'

import {
    REPO_ROOT,
    acquireHookLock,
    assertDependenciesSynchronized,
    assertSafeResourcePressure,
    parseCgroupHeadroomMb,
    parseMemoryStatus,
    readCgroupStatus,
    resolveLocalTool,
    runStep,
} from './hook-runtime.mjs'
import { parseLockfileImporterSpecifiers, parseTopLevelScalarMap } from './dependency-state.mjs'

const REQUIRED_PACKAGE_MANAGER = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
).packageManager
const BASE_LOCKFILE = `lockfileVersion: '9.0'

overrides:
  postcss: '>=8.5.23 <9'

importers:
  .:
    devDependencies:
      eslint:
        specifier: ^9.0.0
        version: 9.39.4

packages:
  eslint@9.39.4: {}
`
const BASE_WORKSPACE = `packages:
    - 'apps/*'

overrides:
    postcss: '>=8.5.23 <9'
`

function fixture() {
    let root
    try {
        root = mkdtempSync(join(tmpdir(), 'cannaguide-hook-test-'))
    } catch (error) {
        if (
            !error ||
            typeof error !== 'object' ||
            !['EACCES', 'ENOENT', 'EROFS'].includes(error.code)
        ) {
            throw error
        }
        // Some agent sandboxes mount the system temp directory read-only.
        root = mkdtempSync(join(REPO_ROOT, '.hook-test-'))
    }
    const gitCommonDir = join(root, '.git')
    mkdirSync(gitCommonDir)
    return {
        root,
        gitCommonDir,
        cleanup: () => rmSync(root, { recursive: true, force: true }),
    }
}

function writeDependencyMetadata(
    root,
    {
        wantedLock = BASE_LOCKFILE,
        installedLock = wantedLock,
        manager = REQUIRED_PACKAGE_MANAGER,
    } = {},
) {
    mkdirSync(join(root, 'node_modules', '.pnpm'), { recursive: true })
    writeFileSync(join(root, 'pnpm-lock.yaml'), wantedLock)
    writeFileSync(join(root, 'pnpm-workspace.yaml'), BASE_WORKSPACE)
    writeFileSync(join(root, 'node_modules', '.pnpm', 'lock.yaml'), installedLock)
    writeFileSync(join(root, 'node_modules', '.modules.yaml'), `packageManager: ${manager}\n`)
    writeFileSync(
        join(root, 'package.json'),
        `${JSON.stringify({
            packageManager: manager,
            devDependencies: { eslint: '^9.0.0' },
        })}\n`,
    )
}

function writeJsonStyleDependencyMetadata(root, manager) {
    writeFileSync(
        join(root, 'node_modules', '.modules.yaml'),
        `  "packageManager": "${manager}",\n`,
    )
}

function git(root, args) {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
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

test('same-boot hook contention fails fast and preserves the active lock', () => {
    const { gitCommonDir, cleanup } = fixture()
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

test('a changed boot identity uses a new lock without deleting crash evidence', () => {
    const { gitCommonDir, cleanup } = fixture()
    try {
        const previousBoot = acquireHookLock({
            hookName: 'pre-push',
            gitCommonDir,
            bootIdentity: 'boot-before-crash',
            pid: 101,
        })
        const currentBoot = acquireHookLock({
            hookName: 'pre-commit',
            gitCommonDir,
            bootIdentity: 'boot-after-crash',
            pid: 202,
        })
        assert.notEqual(previousBoot.lockDirectory, currentBoot.lockDirectory)
        assert.equal(currentBoot.owner.hookName, 'pre-commit')
        currentBoot.release()
        assert.equal(
            JSON.parse(readFileSync(join(previousBoot.lockDirectory, 'owner.json'))).pid,
            101,
        )
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
                    bootIdentity: null,
                }),
            /metadata is unreadable/,
        )
        assert.equal(readFileSync(join(lockDirectory, 'owner.json'), 'utf8'), '{not-json')
    } finally {
        cleanup()
    }
})

test('dependency preflight accepts matching importer resolutions', () => {
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

test('lockfile importer parsing preserves exact manifest specifiers', () => {
    assert.deepEqual(Object.fromEntries(parseLockfileImporterSpecifiers(BASE_LOCKFILE)), {
        '.': { devDependencies: { eslint: '^9.0.0' } },
    })
})

test('workspace and lockfile override parsing preserve exact values', () => {
    assert.deepEqual(parseTopLevelScalarMap(BASE_LOCKFILE, 'overrides', 2), {
        postcss: '>=8.5.23 <9',
    })
    assert.deepEqual(parseTopLevelScalarMap(BASE_WORKSPACE, 'overrides', 4), {
        postcss: '>=8.5.23 <9',
    })
})

test('dependency preflight accepts valid non-resolution current lock metadata', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root, {
            installedLock: BASE_LOCKFILE.replace(
                'overrides:\n',
                'currentInstallMetadata: true\n\noverrides:\n',
            ),
        })
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
        writeJsonStyleDependencyMetadata(root, REQUIRED_PACKAGE_MANAGER)
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
        writeFileSync(
            join(root, 'node_modules', '.pnpm', 'lock.yaml'),
            BASE_LOCKFILE.replace('version: 9.39.4', 'version: 9.0.0'),
        )
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /Hooks never install implicitly/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects transitive package drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root, {
            installedLock: BASE_LOCKFILE.replace('eslint@9.39.4: {}', 'eslint@9.39.5: {}'),
        })
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /packages resolutions do not match installed dependencies/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects workspace manifests absent from the lockfile', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        mkdirSync(join(root, 'apps', 'new'), { recursive: true })
        writeFileSync(join(root, 'apps', 'new', 'package.json'), '{}\n')
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /workspace manifests do not match pnpm-lock.yaml importers/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects manifest specifier drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(
            join(root, 'package.json'),
            `${JSON.stringify({
                packageManager: REQUIRED_PACKAGE_MANAGER,
                devDependencies: { eslint: '^10.0.0' },
            })}\n`,
        )
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /package.json devDependencies do not match pnpm-lock.yaml/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects workspace override drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(join(root, 'pnpm-workspace.yaml'), BASE_WORKSPACE.replace('8.5.23', '8.5.24'))
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /pnpm-workspace.yaml overrides do not match pnpm-lock.yaml/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight reads the Git index instead of a masking working tree', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        git(root, ['init', '--quiet'])
        git(root, ['add', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({
                packageManager: REQUIRED_PACKAGE_MANAGER,
                devDependencies: { eslint: '^10.0.0' },
            }),
        )
        git(root, ['add', 'package.json'])
        writeDependencyMetadata(root)
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
        assert.throws(
            () =>
                assertDependenciesSynchronized({
                    repoRoot: root,
                    requiredTools: [],
                    source: 'index',
                }),
            /Git index package.json devDependencies do not match pnpm-lock.yaml/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight reads the pushed commit instead of a masking working tree', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        git(root, ['init', '--quiet'])
        git(root, ['add', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'])
        git(root, [
            '-c',
            'user.name=Hook Test',
            '-c',
            'user.email=hook@example.invalid',
            '-c',
            'commit.gpgsign=false',
            'commit',
            '--quiet',
            '-m',
            'test: baseline',
        ])
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({
                packageManager: REQUIRED_PACKAGE_MANAGER,
                devDependencies: { eslint: '^10.0.0' },
            }),
        )
        git(root, ['add', 'package.json'])
        git(root, [
            '-c',
            'user.name=Hook Test',
            '-c',
            'user.email=hook@example.invalid',
            '-c',
            'commit.gpgsign=false',
            'commit',
            '--quiet',
            '-m',
            'test: stale lock',
        ])
        writeDependencyMetadata(root)
        assert.throws(
            () =>
                assertDependenciesSynchronized({
                    repoRoot: root,
                    requiredTools: [],
                    source: 'HEAD',
                }),
            /Git tree HEAD package.json devDependencies do not match pnpm-lock.yaml/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects a package-manager mismatch', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(join(root, 'node_modules', '.modules.yaml'), 'packageManager: pnpm@0.0.0\n')
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            (error) =>
                error instanceof Error &&
                error.message.includes(`requires ${REQUIRED_PACKAGE_MANAGER}`),
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
            /Required installed local tool 'eslint' is unavailable/,
        )
    } finally {
        cleanup()
    }
})

test('local tool resolution uses its installed declared entrypoint and never pnpm', () => {
    const { root, cleanup } = fixture()
    try {
        const packageDirectory = join(root, 'node_modules', 'eslint')
        const entrypoint = join(packageDirectory, 'bin', 'eslint.js')
        mkdirSync(join(packageDirectory, 'bin'), { recursive: true })
        writeFileSync(
            join(packageDirectory, 'package.json'),
            JSON.stringify({ bin: { eslint: './bin/eslint.js' } }),
        )
        writeFileSync(entrypoint, 'process.exit(0)\n')
        assert.deepEqual(resolveLocalTool('eslint', { repoRoot: root }), {
            command: process.execPath,
            argsPrefix: [entrypoint],
            displayPath: entrypoint,
        })
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
    assert.equal(parseCgroupHeadroomMb('1073741824', '268435456'), 768)
    assert.equal(parseCgroupHeadroomMb('max', '268435456'), null)
    assert.equal(parseCgroupHeadroomMb('9223372036854771712', '0'), null)
    assert.throws(
        () =>
            assertSafeResourcePressure({
                readStatus: () => ({
                    availableMb: 700,
                    swapFreeMb: 2048,
                    swapTotalMb: 4096,
                    cgroupAvailableMb: 700,
                    cgroupTotalAvailableMb: 700,
                }),
            }),
        /cgroup 700 MB memory \/ 700 MB total headroom/,
    )
})

test('cgroup v2 headroom resolves through the current process path', () => {
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 / /sys/fs/cgroup rw - cgroup2 cgroup rw\n'],
        ['/sys/fs/cgroup/slice/app/memory.max', '1073741824\n'],
        ['/sys/fs/cgroup/slice/app/memory.current', '268435456\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.max', '268435456\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.current', '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 1024,
            version: 2,
        },
    )
})

test('cgroup membership equal to the mount root maps directly to the mount point', () => {
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 /slice/app /sys/fs/cgroup rw - cgroup2 cgroup rw\n'],
        ['/sys/fs/cgroup/memory.max', '1073741824\n'],
        ['/sys/fs/cgroup/memory.current', '268435456\n'],
        ['/sys/fs/cgroup/memory.swap.max', '0\n'],
        ['/sys/fs/cgroup/memory.swap.current', '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 768,
            version: 2,
        },
    )
})

test('cgroup v1 memsw is treated as combined headroom', () => {
    const directory = '/sys/fs/cgroup/memory/docker/app'
    const files = new Map([
        ['/proc/self/cgroup', '5:memory:/docker/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 / /sys/fs/cgroup/memory rw - cgroup cgroup rw,memory\n'],
        [`${directory}/memory.limit_in_bytes`, '1073741824\n'],
        [`${directory}/memory.usage_in_bytes`, '268435456\n'],
        [`${directory}/memory.memsw.limit_in_bytes`, '1610612736\n'],
        [`${directory}/memory.memsw.usage_in_bytes`, '536870912\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 1024,
            version: 1,
        },
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

test('active hook path contains no pnpm process launch', () => {
    const files = [
        '.husky/pre-commit',
        '.husky/commit-msg',
        '.husky/pre-push',
        'scripts/git-hooks/run-hook.mjs',
        'scripts/git-hooks/dependency-state.mjs',
        'scripts/scoped-verify.mjs',
        'scripts/typecheck-filter.mjs',
        'scripts/lint-scopes.mjs',
    ]
    for (const file of files) {
        const source = readFileSync(resolve(REPO_ROOT, file), 'utf8')
        assert.doesNotMatch(
            source,
            /(?:spawnSync|spawn|execFileSync|execFile|execSync|exec)\s*\(\s*['"`](?:corepack |npx )?pnpm\b/,
            file,
        )
        if (file.startsWith('.husky/')) {
            assert.doesNotMatch(source, /(?:^|[;&|]\s*)(?:corepack |npx )?pnpm\s/m, file)
        }
    }
})
