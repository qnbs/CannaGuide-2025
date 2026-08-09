import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const RECOVERY_COMMAND = '`corepack pnpm install --frozen-lockfile`'
const MARKER_VERSION = 2
const MARKER_NAME = '.cannaguide-dependency-state.json'
const INSTALL_LIFECYCLE_SCRIPTS = ['preinstall', 'install', 'postinstall', 'prepare']
const MANIFEST_FIELDS = [
    'name',
    'version',
    'packageManager',
    'engines',
    'os',
    'cpu',
    'libc',
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
    'peerDependenciesMeta',
    'dependenciesMeta',
    'bundledDependencies',
    'bundleDependencies',
    'pnpm',
]

function parseYamlScalar(value) {
    const trimmed = value.trim()
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).replaceAll("''", "'")
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed)
    return trimmed
}

export function parseWorkspacePatterns(contents) {
    const patterns = []
    let insidePackages = false
    for (const line of contents.replaceAll('\r\n', '\n').split('\n')) {
        if (/^packages\s*:\s*(?:#.*)?$/.test(line)) {
            insidePackages = true
            continue
        }
        if (!insidePackages || /^\s*#/.test(line) || line.trim() === '') continue
        if (/^\S/.test(line)) break
        const match = line.match(/^\s+-\s+(.+)$/)
        if (match) patterns.push(parseYamlScalar(match[1]))
    }
    return patterns
}

export function installedManagerFor(packageManager) {
    const match =
        typeof packageManager === 'string'
            ? packageManager.match(/^pnpm@([^+\s]+)(?:\+.+)?$/)
            : null
    return match ? `pnpm@${match[1]}` : null
}

export function assertInstallLifecycle(environment = process.env) {
    const installCommand = ['install', 'ci'].includes(environment.npm_command)
    if (environment.npm_lifecycle_event !== 'prepare' || !installCommand) {
        throw new Error(
            `The dependency stamp is written only by the prepare phase of a package-manager ` +
                `install. Run ${RECOVERY_COMMAND} deliberately.`,
        )
    }
}

function runGit(repoRoot, args) {
    const result = spawnSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (result.status !== 0) {
        throw new Error(`Cannot read dependency state from Git: ${(result.stderr || '').trim()}`)
    }
    return result.stdout
}

function treeCandidateFiles(repoRoot, source, pathspecs) {
    const queryPaths = [
        ...new Set(
            pathspecs.map((pathspec) => {
                const wildcard = pathspec.search(/[?*[]/)
                return wildcard < 0
                    ? pathspec
                    : pathspec.slice(0, wildcard).replace(/\/$/, '') || '.'
            }),
        ),
    ]
    return runGit(repoRoot, ['ls-tree', '-r', '--name-only', source, '--', ...queryPaths])
        .trim()
        .split('\n')
        .filter(Boolean)
        .filter((path) =>
            pathspecs.some((pathspec) => {
                if (/[?*[]/.test(pathspec)) return globPattern(pathspec).test(path)
                return path === pathspec || path.startsWith(`${pathspec}/`)
            }),
        )
}

function repositoryReader(repoRoot, source) {
    if (source === 'worktree') {
        return {
            label: 'working tree',
            listFiles: (pathspecs) =>
                runGit(repoRoot, [
                    'ls-files',
                    '--cached',
                    '--others',
                    '--exclude-standard',
                    '--',
                    ...pathspecs,
                ])
                    .trim()
                    .split('\n')
                    .filter(Boolean)
                    .filter((path) => existsSync(join(repoRoot, path))),
            read: (path) => readFileSync(join(repoRoot, path), 'utf8'),
        }
    }
    const index = source === 'index'
    return {
        label: index ? 'Git index' : `Git tree ${source}`,
        listFiles: (pathspecs) =>
            index
                ? runGit(repoRoot, ['ls-files', '--cached', '--', ...pathspecs])
                      .trim()
                      .split('\n')
                      .filter(Boolean)
                : treeCandidateFiles(repoRoot, source, pathspecs),
        read: (path) => runGit(repoRoot, ['show', index ? `:${path}` : `${source}:${path}`]),
    }
}

function globPattern(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('**', '\0')
    return new RegExp(`^${escaped.replaceAll('*', '[^/]*').replaceAll('\0', '.*')}$`)
}

function workspaceManifestPaths(files, workspaceContents) {
    const patterns = parseWorkspacePatterns(workspaceContents)
    const positive = patterns.filter((pattern) => !pattern.startsWith('!')).map(globPattern)
    const negative = patterns
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => globPattern(pattern.slice(1)))
    return [
        'package.json',
        ...[...files]
            .filter((path) => path.endsWith('/package.json'))
            .filter((path) => {
                const directory = dirname(path).split(sep).join('/')
                return (
                    positive.some((pattern) => pattern.test(directory)) &&
                    !negative.some((pattern) => pattern.test(directory))
                )
            }),
    ].sort()
}

function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue)
    if (!value || typeof value !== 'object') return value
    return Object.fromEntries(
        Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, nested]) => [key, stableValue(nested)]),
    )
}

function dependencyManifest(contents) {
    const manifest = JSON.parse(contents)
    const dependencyInputs = Object.fromEntries(
        MANIFEST_FIELDS.filter((field) => manifest[field] !== undefined).map((field) => [
            field,
            stableValue(manifest[field]),
        ]),
    )
    const installScripts = Object.fromEntries(
        INSTALL_LIFECYCLE_SCRIPTS.filter((name) => manifest.scripts?.[name] !== undefined).map(
            (name) => [name, manifest.scripts[name]],
        ),
    )
    if (Object.keys(installScripts).length > 0) dependencyInputs.scripts = installScripts
    return dependencyInputs
}

function hashRecords(records) {
    const hash = createHash('sha256')
    for (const [path, contents] of records.sort(([left], [right]) => left.localeCompare(right))) {
        const normalized = contents.replaceAll('\r\n', '\n')
        hash.update(`${path}\0${Buffer.byteLength(normalized)}\0${normalized}\0`)
    }
    return hash.digest('hex')
}

function sourceState(reader) {
    const workspaceContents = reader.read('pnpm-workspace.yaml')
    const workspacePatterns = parseWorkspacePatterns(workspaceContents)
    if (!workspacePatterns.some((pattern) => !pattern.startsWith('!'))) {
        throw new Error('pnpm-workspace.yaml must declare at least one supported package pattern.')
    }
    const pathspecs = [
        'package.json',
        '.npmrc',
        '.pnpmfile.cjs',
        '.pnpmfile.mjs',
        'patches',
        '.pnpm-patches',
        ...workspacePatterns
            .filter((pattern) => !pattern.startsWith('!'))
            .map((pattern) => `${pattern}/package.json`),
    ]
    const files = new Set(reader.listFiles(pathspecs))
    const records = [
        ['pnpm-lock.yaml', reader.read('pnpm-lock.yaml')],
        ['pnpm-workspace.yaml', workspaceContents],
    ]
    for (const path of workspaceManifestPaths(files, workspaceContents)) {
        records.push([path, JSON.stringify(dependencyManifest(reader.read(path)))])
    }
    for (const path of ['.npmrc', '.pnpmfile.cjs', '.pnpmfile.mjs']) {
        if (files.has(path)) records.push([path, reader.read(path)])
    }
    for (const path of [...files].filter((name) => /^(?:patches|\.pnpm-patches)\//.test(name))) {
        records.push([path, reader.read(path)])
    }
    const rootManifest = JSON.parse(reader.read('package.json'))
    return {
        expectedManager: installedManagerFor(rootManifest.packageManager),
        fingerprint: hashRecords(records),
    }
}

function installedManager(modulesPath) {
    return readFileSync(modulesPath, 'utf8').match(
        /^\s*["']?packageManager["']?\s*:\s*["']?([^"',\s]+)["']?,?\s*$/m,
    )?.[1]
}

function installedPaths(repoRoot) {
    return {
        installedLockPath: join(repoRoot, 'node_modules', '.pnpm', 'lock.yaml'),
        markerPath: join(repoRoot, 'node_modules', MARKER_NAME),
        modulesPath: join(repoRoot, 'node_modules', '.modules.yaml'),
    }
}

function requireInstalledFiles(paths) {
    for (const path of Object.values(paths)) {
        if (!existsSync(path)) {
            throw new Error(
                `Dependency metadata is missing: ${path}. Run ${RECOVERY_COMMAND} deliberately.`,
            )
        }
    }
}

export function writeDependencyStateMarker({ repoRoot } = {}) {
    const paths = installedPaths(repoRoot)
    requireInstalledFiles({
        installedLockPath: paths.installedLockPath,
        modulesPath: paths.modulesPath,
    })
    const state = sourceState(repositoryReader(repoRoot, 'worktree'))
    const manager = installedManager(paths.modulesPath)
    if (!state.expectedManager || manager !== state.expectedManager) {
        throw new Error(
            `Dependencies were installed with ${manager ?? 'an unknown pnpm version'}; ` +
                `the repository requires ${state.expectedManager ?? 'a pinned package manager'}. ` +
                `Run ${RECOVERY_COMMAND} deliberately.`,
        )
    }
    const marker = {
        version: MARKER_VERSION,
        packageManager: manager,
        sourceFingerprint: state.fingerprint,
        installedLockFingerprint: hashRecords([
            ['installed-lock.yaml', readFileSync(paths.installedLockPath, 'utf8')],
        ]),
    }
    const token = `${process.pid}-${randomUUID()}`
    const candidate = `${paths.markerPath}.candidate-${token}`
    const previous = `${paths.markerPath}.previous-${token}`
    let previousMoved = false
    try {
        writeFileSync(candidate, `${JSON.stringify(marker, null, 2)}\n`, { mode: 0o600 })
        if (existsSync(paths.markerPath)) {
            renameSync(paths.markerPath, previous)
            previousMoved = true
        }
        try {
            renameSync(candidate, paths.markerPath)
        } catch (error) {
            if (previousMoved && !existsSync(paths.markerPath)) {
                try {
                    renameSync(previous, paths.markerPath)
                } catch (restoreError) {
                    throw new Error(
                        `Could not replace the dependency marker; its previous value remains at ${previous}.`,
                        { cause: restoreError },
                    )
                }
            }
            throw error
        }
        if (previousMoved) {
            rmSync(previous, { force: true })
        }
    } finally {
        rmSync(candidate, { force: true })
    }
    return marker
}

export function assertDependencyMetadataSynchronized({ repoRoot, source = 'worktree' } = {}) {
    const paths = installedPaths(repoRoot)
    requireInstalledFiles(paths)
    const reader = repositoryReader(repoRoot, source)
    let state
    let marker
    try {
        state = sourceState(reader)
        marker = JSON.parse(readFileSync(paths.markerPath, 'utf8'))
    } catch (error) {
        throw new Error(`${reader.label} dependency metadata is missing or unreadable.`, {
            cause: error,
        })
    }
    const manager = installedManager(paths.modulesPath)
    if (
        marker.version !== MARKER_VERSION ||
        !state.expectedManager ||
        marker.packageManager !== state.expectedManager ||
        manager !== state.expectedManager
    ) {
        throw new Error(
            `Dependencies were installed with ${manager ?? 'an unknown pnpm version'}; ` +
                `${reader.label} requires ${state.expectedManager ?? 'a pinned package manager'}. ` +
                `Run ${RECOVERY_COMMAND} deliberately.`,
        )
    }
    const currentInstalledLock = hashRecords([
        ['installed-lock.yaml', readFileSync(paths.installedLockPath, 'utf8')],
    ])
    if (
        marker.sourceFingerprint !== state.fingerprint ||
        marker.installedLockFingerprint !== currentInstalledLock
    ) {
        throw new Error(
            `${reader.label} dependency inputs or the installed lock snapshot changed since the ` +
                `last successful install. Hooks never install implicitly. Run ${RECOVERY_COMMAND} ` +
                `deliberately, then retry.`,
        )
    }
    return { expectedManager: state.expectedManager, sourceLabel: reader.label }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
    const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
    if (process.argv[2] !== '--write-after-install') {
        console.error(
            'This command is install-managed. Run `corepack pnpm install --frozen-lockfile`.',
        )
        process.exitCode = 2
    } else {
        try {
            assertInstallLifecycle()
            const marker = writeDependencyStateMarker({ repoRoot })
            console.log(
                `[dependency-state] recorded ${marker.packageManager} install metadata ` +
                    `(${marker.sourceFingerprint.slice(0, 12)})`,
            )
        } catch (error) {
            console.error(`[dependency-state] ${error instanceof Error ? error.message : error}`)
            process.exitCode = 1
        }
    }
}
