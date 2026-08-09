import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
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
    resolveLocalTool,
} from './hook-runtime.mjs'
import {
    assertInstallLifecycle,
    installedManagerFor,
    parseWorkspacePatterns,
    writeDependencyStateMarker,
} from './dependency-state.mjs'

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

autoInstallPeers: true

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
        manifest = {
            packageManager: manager,
            devDependencies: { eslint: '^9.0.0' },
        },
    } = {},
) {
    git(root, ['init', '--quiet'])
    mkdirSync(join(root, 'node_modules', '.pnpm'), { recursive: true })
    writeFileSync(join(root, 'pnpm-lock.yaml'), wantedLock)
    writeFileSync(join(root, 'pnpm-workspace.yaml'), BASE_WORKSPACE)
    writeFileSync(join(root, 'node_modules', '.pnpm', 'lock.yaml'), installedLock)
    writeFileSync(join(root, 'node_modules', '.modules.yaml'), `packageManager: ${manager}\n`)
    writeFileSync(join(root, 'package.json'), `${JSON.stringify(manifest)}\n`)
    writeDependencyStateMarker({ repoRoot: root })
}

function git(root, args) {
    const env = Object.fromEntries(
        Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
    )
    Object.assign(env, {
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: join(root, 'isolated-global.gitconfig'),
        GIT_AUTHOR_NAME: 'Hook Test',
        GIT_AUTHOR_EMAIL: 'hook@example.invalid',
        GIT_COMMITTER_NAME: 'Hook Test',
        GIT_COMMITTER_EMAIL: 'hook@example.invalid',
    })
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', env })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
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
        const second = acquireHookLock({
            hookName: 'pre-commit',
            gitCommonDir,
            bootIdentity: 'boot-a',
            pid: 202,
        })
        second.release()
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

test('dependency preflight accepts a platform-filtered installed lock snapshot', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root, {
            wantedLock: BASE_LOCKFILE.replace(
                'packages:\n',
                'packages:\n  optional-darwin@1.0.0: {}\n',
            ),
            installedLock: BASE_LOCKFILE,
        })
        writeDependencyStateMarker({ repoRoot: root })
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight accepts auto-installed peer metadata after a successful install', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root, {
            manifest: {
                packageManager: REQUIRED_PACKAGE_MANAGER,
                devDependencies: { eslint: '^9.0.0' },
                peerDependencies: { react: '^19.0.0' },
            },
            wantedLock: BASE_LOCKFILE.replace(
                '      eslint:\n',
                '      react:\n        specifier: ^19.0.0\n        version: 19.2.4\n      eslint:\n',
            ),
        })
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('workspace parsing accepts a commented packages key and fails closed without patterns', () => {
    assert.deepEqual(parseWorkspacePatterns("packages: # workspace roots\n    - 'apps/*'\n"), [
        'apps/*',
    ])
    assert.equal(
        installedManagerFor(`${REQUIRED_PACKAGE_MANAGER}+sha512.deadbeef`),
        REQUIRED_PACKAGE_MANAGER,
    )
    assert.equal(installedManagerFor({ packageManager: REQUIRED_PACKAGE_MANAGER }), null)
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages: ['apps/*']\n")
        assert.throws(
            () => writeDependencyStateMarker({ repoRoot: root }),
            /supported package pattern/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight accepts an integrity-pinned Corepack locator', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root, {
            manifest: {
                packageManager: `${REQUIRED_PACKAGE_MANAGER}+sha512.deadbeef`,
                devDependencies: { eslint: '^9.0.0' },
            },
        })
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('dependency stamp authorization accepts installs and rejects manual prepare runs', () => {
    assert.doesNotThrow(() =>
        assertInstallLifecycle({ npm_command: 'install', npm_lifecycle_event: 'prepare' }),
    )
    assert.throws(
        () =>
            assertInstallLifecycle({
                npm_command: 'run-script',
                npm_lifecycle_event: 'prepare',
            }),
        /written only by the prepare phase.*install/,
    )
})

test('dependency fingerprints normalize CRLF worktree text to Git-normalized LF', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        for (const path of ['pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
            writeFileSync(
                join(root, path),
                readFileSync(join(root, path), 'utf8').replaceAll('\n', '\r\n'),
            )
        }
        writeDependencyStateMarker({ repoRoot: root })
        for (const path of ['pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
            writeFileSync(
                join(root, path),
                readFileSync(join(root, path), 'utf8').replaceAll('\r\n', '\n'),
            )
        }
        assert.doesNotThrow(() =>
            assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects a missing successful-install stamp', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        rmSync(join(root, 'node_modules', '.cannaguide-dependency-state.json'))
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /Dependency metadata is missing/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects transitive installed-lock drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(
            join(root, 'node_modules', '.pnpm', 'lock.yaml'),
            BASE_LOCKFILE.replace('eslint@9.39.4: {}', 'eslint@9.39.5: {}'),
        )
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /installed lock snapshot changed/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects a workspace manifest added after install', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        mkdirSync(join(root, 'apps', 'new'), { recursive: true })
        writeFileSync(join(root, 'apps', 'new', 'package.json'), '{}\n')
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /dependency inputs.*changed since the last successful install/,
        )
    } finally {
        cleanup()
    }
})

test('dependency stamp excludes a tracked workspace manifest deleted from the worktree', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        const manifestPath = join(root, 'apps', 'deleted', 'package.json')
        mkdirSync(join(root, 'apps', 'deleted'), { recursive: true })
        writeFileSync(manifestPath, '{"name":"deleted"}\n')
        git(root, ['add', 'apps/deleted/package.json'])
        rmSync(manifestPath)

        assert.doesNotThrow(() => writeDependencyStateMarker({ repoRoot: root }))
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
            /dependency inputs.*changed since the last successful install/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects install lifecycle script drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        const manifest = {
            packageManager: REQUIRED_PACKAGE_MANAGER,
            devDependencies: { eslint: '^9.0.0' },
            scripts: { prepare: 'node scripts/prepare-v1.mjs', test: 'node --test' },
        }
        writeDependencyMetadata(root, { manifest })
        writeFileSync(
            join(root, 'package.json'),
            `${JSON.stringify({
                ...manifest,
                scripts: { ...manifest.scripts, prepare: 'node scripts/prepare-v2.mjs' },
            })}\n`,
        )
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /dependency inputs.*changed since the last successful install/,
        )
    } finally {
        cleanup()
    }
})

test('dependency preflight rejects any workspace configuration drift without installing', () => {
    const { root, cleanup } = fixture()
    try {
        writeDependencyMetadata(root)
        writeFileSync(
            join(root, 'pnpm-workspace.yaml'),
            BASE_WORKSPACE.replace('autoInstallPeers: true', 'autoInstallPeers: false'),
        )
        assert.throws(
            () => assertDependenciesSynchronized({ repoRoot: root, requiredTools: [] }),
            /dependency inputs.*changed since the last successful install/,
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
            /Git index dependency inputs.*changed since the last successful install/,
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
            /Git tree HEAD dependency inputs.*changed since the last successful install/,
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
    assert.throws(
        () =>
            assertSafeResourcePressure({
                readStatus: () => ({
                    availableMb: 4096,
                    swapFreeMb: null,
                    swapTotalMb: null,
                    cgroupAvailableMb: 300,
                    cgroupTotalAvailableMb: null,
                }),
            }),
        /cgroup 300 MB memory \/ unbounded MB total headroom/,
    )
})

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

test('actual pre-push rejects ref deletions and releases its repository lock', () => {
    const deletionUpdate = `(delete) ${'0'.repeat(40)} refs/heads/obsolete ${'1'.repeat(40)}\n`
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const result = spawnSync(resolve(REPO_ROOT, '.husky/pre-push'), [], {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            input: deletionUpdate,
        })
        assert.notEqual(result.status, 0)
        assert.match(
            `${result.stdout || ''}${result.stderr || ''}`,
            /refusing an unvalidated remote-ref deletion/,
        )
    }
})
