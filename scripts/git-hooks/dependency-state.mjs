import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']
const RECOVERY_COMMAND = '`corepack pnpm install --frozen-lockfile`'

function parseYamlScalar(value) {
    const trimmed = value.trim()
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).replaceAll("''", "'")
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed)
    return trimmed
}

export function parseLockfileImporterSpecifiers(contents) {
    const importers = new Map()
    let importer = null
    let dependencyField = null
    let dependencyName = null
    let insideImporters = false

    for (const line of contents.replaceAll('\r\n', '\n').split('\n')) {
        if (line === 'importers:') {
            insideImporters = true
            continue
        }
        if (!insideImporters) continue
        if (/^[^\s#].*:$/.test(line)) break
        const importerMatch = line.match(/^  (\S.*?):(?: \{\})?$/)
        if (importerMatch) {
            importer = parseYamlScalar(importerMatch[1])
            importers.set(importer, {})
            dependencyField = null
            dependencyName = null
            continue
        }
        const fieldMatch = line.match(/^    (dependencies|devDependencies|optionalDependencies):$/)
        if (fieldMatch && importer !== null) {
            dependencyField = fieldMatch[1]
            importers.get(importer)[dependencyField] = {}
            dependencyName = null
            continue
        }
        const dependencyMatch = line.match(/^      (\S.*):$/)
        if (dependencyMatch && dependencyField !== null) {
            dependencyName = parseYamlScalar(dependencyMatch[1])
            continue
        }
        const specifierMatch = line.match(/^        specifier: (.+)$/)
        if (specifierMatch && dependencyName !== null) {
            importers.get(importer)[dependencyField][dependencyName] = parseYamlScalar(
                specifierMatch[1],
            )
        }
    }
    if (importers.size === 0) throw new Error('pnpm-lock.yaml has no readable importer metadata.')
    return importers
}

export function parseTopLevelScalarMap(contents, sectionName, indentation) {
    const values = {}
    let insideSection = false
    const entryPattern = new RegExp(`^ {${indentation}}(\\S.*?):\\s+(.+)$`)
    for (const line of contents.replaceAll('\r\n', '\n').split('\n')) {
        if (line === `${sectionName}:`) {
            insideSection = true
            continue
        }
        if (!insideSection || /^\s*#/.test(line) || line.trim() === '') continue
        if (/^\S/.test(line)) break
        const match = line.match(entryPattern)
        if (match) values[parseYamlScalar(match[1])] = parseYamlScalar(match[2])
    }
    return values
}

export function parseWorkspacePatterns(contents) {
    const patterns = []
    let insidePackages = false
    for (const line of contents.replaceAll('\r\n', '\n').split('\n')) {
        if (line === 'packages:') {
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

function normalizeSection(contents, sectionName) {
    const lines = contents.replaceAll('\r\n', '\n').split('\n')
    const start = lines.findIndex((line) => line === `${sectionName}:`)
    if (start === -1) return ''
    const end = lines.findIndex((line, index) => index > start && /^[^\s#].*:$/.test(line))
    return lines
        .slice(start, end === -1 ? undefined : end)
        .map((line) => line.trimEnd())
        .join('\n')
        .trimEnd()
}

function listWorktreeFiles(root) {
    const files = []
    const visit = (directory) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (entry.isDirectory() && ['.git', 'node_modules'].includes(entry.name)) continue
            const path = join(directory, entry.name)
            if (entry.isDirectory()) visit(path)
            else files.push(relative(root, path).split(sep).join('/'))
        }
    }
    visit(root)
    return files
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

function repositoryReader(repoRoot, source) {
    if (source === 'worktree') {
        return {
            label: 'working tree',
            listFiles: () => listWorktreeFiles(repoRoot),
            read: (path) => readFileSync(join(repoRoot, path), 'utf8'),
        }
    }
    const index = source === 'index'
    return {
        label: index ? 'Git index' : `Git tree ${source}`,
        listFiles: () =>
            runGit(
                repoRoot,
                index ? ['ls-files', '--cached'] : ['ls-tree', '-r', '--name-only', source],
            )
                .trim()
                .split('\n')
                .filter(Boolean),
        read: (path) => runGit(repoRoot, ['show', index ? `:${path}` : `${source}:${path}`]),
    }
}

function globPattern(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('**', '\0')
    return new RegExp(`^${escaped.replaceAll('*', '[^/]*').replaceAll('\0', '.*')}$`)
}

function workspaceImporterPaths(reader, workspaceContents) {
    const patterns = parseWorkspacePatterns(workspaceContents)
    const positive = patterns.filter((pattern) => !pattern.startsWith('!')).map(globPattern)
    const negative = patterns
        .filter((pattern) => pattern.startsWith('!'))
        .map((pattern) => globPattern(pattern.slice(1)))
    const paths = reader
        .listFiles()
        .filter((path) => path.endsWith('/package.json'))
        .map((path) => dirname(path).split(sep).join('/'))
        .filter(
            (path) =>
                positive.some((pattern) => pattern.test(path)) &&
                !negative.some((pattern) => pattern.test(path)),
        )
    return ['.', ...paths].sort()
}

function sortedMap(values = {}) {
    return Object.fromEntries(
        Object.entries(values).sort(([left], [right]) => left.localeCompare(right)),
    )
}

function assertManifests(reader, lockContents, workspaceContents) {
    const importers = parseLockfileImporterSpecifiers(lockContents)
    const configuredPaths = workspaceImporterPaths(reader, workspaceContents)
    const lockedPaths = [...importers.keys()].sort()
    if (JSON.stringify(configuredPaths) !== JSON.stringify(lockedPaths)) {
        throw new Error(
            `${reader.label} workspace manifests do not match pnpm-lock.yaml importers. ` +
                `Configured: ${configuredPaths.join(', ')}; locked: ${lockedPaths.join(', ')}.`,
        )
    }
    const lockedOverrides = sortedMap(parseTopLevelScalarMap(lockContents, 'overrides', 2))
    const configuredOverrides = sortedMap(parseTopLevelScalarMap(workspaceContents, 'overrides', 4))
    if (JSON.stringify(lockedOverrides) !== JSON.stringify(configuredOverrides)) {
        throw new Error('pnpm-workspace.yaml overrides do not match pnpm-lock.yaml.')
    }
    for (const [importer, lockedFields] of importers) {
        const manifestPath = importer === '.' ? 'package.json' : `${importer}/package.json`
        const manifest = JSON.parse(reader.read(manifestPath))
        for (const field of DEPENDENCY_FIELDS) {
            const locked = sortedMap(lockedFields[field])
            const declared = sortedMap(manifest[field])
            const names = Object.keys(declared)
            const incompatible =
                JSON.stringify(Object.keys(locked)) !== JSON.stringify(names) ||
                names.some(
                    (name) =>
                        locked[name] !== declared[name] &&
                        locked[name] !== configuredOverrides[name],
                )
            if (incompatible) {
                throw new Error(
                    `${reader.label} ${manifestPath} ${field} do not match pnpm-lock.yaml.`,
                )
            }
        }
    }
}

export function assertDependencyMetadataSynchronized({ repoRoot, source = 'worktree' } = {}) {
    const installedLockPath = join(repoRoot, 'node_modules', '.pnpm', 'lock.yaml')
    const modulesPath = join(repoRoot, 'node_modules', '.modules.yaml')
    for (const path of [installedLockPath, modulesPath]) {
        if (!existsSync(path)) {
            throw new Error(
                `Dependency metadata is missing: ${path}. Run ${RECOVERY_COMMAND} deliberately.`,
            )
        }
    }
    const reader = repositoryReader(repoRoot, source)
    let lockContents
    let workspaceContents
    let rootManifest
    try {
        lockContents = reader.read('pnpm-lock.yaml')
        workspaceContents = reader.read('pnpm-workspace.yaml')
        rootManifest = JSON.parse(reader.read('package.json'))
    } catch (error) {
        throw new Error(`${reader.label} dependency metadata is missing or unreadable.`, {
            cause: error,
        })
    }
    const installedLock = readFileSync(installedLockPath, 'utf8')
    for (const section of ['importers', 'packages', 'snapshots']) {
        if (normalizeSection(lockContents, section) !== normalizeSection(installedLock, section)) {
            throw new Error(
                `${reader.label} ${section} resolutions do not match installed dependencies. ` +
                    `Hooks never install implicitly. Run ${RECOVERY_COMMAND} deliberately, then retry.`,
            )
        }
    }
    try {
        assertManifests(reader, lockContents, workspaceContents)
    } catch (error) {
        throw new Error(
            `${error instanceof Error ? error.message : String(error)} ` +
                `Hooks never install implicitly. Correct the repository metadata, run ${RECOVERY_COMMAND} deliberately, then retry.`,
            { cause: error },
        )
    }
    const expectedManager = rootManifest.packageManager
    const installedManager = readFileSync(modulesPath, 'utf8').match(
        /^\s*["']?packageManager["']?\s*:\s*["']?([^"',\s]+)["']?,?\s*$/m,
    )?.[1]
    if (!expectedManager || installedManager !== expectedManager) {
        throw new Error(
            `Dependencies were installed with ${installedManager ?? 'an unknown pnpm version'}; ` +
                `${reader.label} requires ${expectedManager ?? 'a pinned package manager'}. ` +
                `Run ${RECOVERY_COMMAND} deliberately, then retry.`,
        )
    }
    return { expectedManager, sourceLabel: reader.label }
}
