import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

const UNSUPPORTED_WORKSPACE_GLOB_MARKERS = ['!', '?', '{', '}', '[', ']', '(', ')']
const RUNTIME_EXPORT_CONDITIONS = new Set([
    'browser',
    process.env.NODE_ENV === 'production' ? 'production' : 'development',
    'import',
    'module',
])

function isWithin(root, candidate) {
    const pathFromRoot = relative(root, candidate)
    return (
        pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`) && !isAbsolute(pathFromRoot)
    )
}

function readWorkspacePackage(packageRoot) {
    const manifestPath = resolve(packageRoot, 'package.json')
    if (!existsSync(manifestPath)) return null
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (typeof manifest.name !== 'string') return null
    return { packageRoot, manifestPath, manifest }
}

function parseWorkspacePattern(line) {
    const entry = line.match(/^\s*-\s*(?:'([^']+)'|"([^"]+)"|([^\s#]+))\s*(?:#.*)?$/)
    if (!entry) throw new Error(`Unsupported pnpm workspace entry: ${line.trim()}`)
    return entry[1] ?? entry[2] ?? entry[3]
}

function isBlankOrComment(line) {
    return line.trim() === '' || line.trim().startsWith('#')
}

function isTopLevelConfiguration(line) {
    return !/^\s/.test(line)
}

function workspacePatterns(contents) {
    const lines = contents.split(/\r?\n/)
    const sectionStart = lines.findIndex((line) => /^packages:\s*$/.test(line))
    if (sectionStart < 0) throw new Error('pnpm-workspace.yaml has no packages section')
    const patterns = []
    for (const line of lines.slice(sectionStart + 1)) {
        if (isBlankOrComment(line)) continue
        if (isTopLevelConfiguration(line)) break
        patterns.push(parseWorkspacePattern(line))
    }
    if (patterns.length === 0) throw new Error('pnpm-workspace.yaml has no package patterns')
    return patterns
}

function workspacePackageContainers(root) {
    const contents = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8')
    return workspacePatterns(contents).map((pattern) => workspacePackageContainer(root, pattern))
}

function isSafeWorkspaceContainer(root, container) {
    if (!container) return false
    if (container.includes('*')) return false
    return isWithin(root, resolve(root, container))
}

function workspacePackageContainer(root, pattern) {
    if (
        UNSUPPORTED_WORKSPACE_GLOB_MARKERS.some((marker) => pattern.includes(marker)) ||
        !pattern.endsWith('/*')
    ) {
        throw new Error(`Unsupported pnpm workspace pattern for runtime fingerprinting: ${pattern}`)
    }
    const container = pattern.slice(0, -2)
    if (!isSafeWorkspaceContainer(root, container)) {
        throw new Error(`Unsafe pnpm workspace pattern for runtime fingerprinting: ${pattern}`)
    }
    return container
}

function discoverWorkspacePackages(root) {
    return workspacePackageContainers(root).flatMap((container) => {
        const directory = resolve(root, container)
        if (!existsSync(directory)) return []
        return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
            if (!entry.isDirectory()) return []
            const workspacePackage = readWorkspacePackage(resolve(directory, entry.name))
            return workspacePackage ? [workspacePackage] : []
        })
    })
}

function packageSpecifierMatches(workspacePackage, specifier) {
    const { name } = workspacePackage.manifest
    return specifier === name || specifier.startsWith(`${name}/`)
}

function findWorkspacePackage(packages, specifier) {
    const matches = packages.filter((candidate) => packageSpecifierMatches(candidate, specifier))
    if (matches.length === 1) return { workspacePackage: matches[0], error: null }
    if (matches.length > 1)
        return { workspacePackage: null, error: `duplicate workspace package name ${specifier}` }
    return { workspacePackage: null, error: null }
}

function replaceExportPattern(value, capture) {
    if (typeof value === 'string') return value.replaceAll('*', capture)
    if (Array.isArray(value)) return value.map((entry) => replaceExportPattern(entry, capture))
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [
                key,
                replaceExportPattern(entry, capture),
            ]),
        )
    }
    return value
}

function isExportMap(value) {
    if (!value) return false
    if (typeof value !== 'object') return false
    return !Array.isArray(value)
}

function hasExportSubpaths(exports) {
    return Object.keys(exports).some((key) => key.startsWith('.'))
}

function rootExportOrNull(exports, subpath) {
    return subpath === '.' ? exports : null
}

function matchingExportPattern(exports, subpath) {
    const patterns = Object.keys(exports)
        .filter((key) => key.includes('*'))
        .sort((left, right) => {
            const leftPrefixLength = left.indexOf('*')
            const rightPrefixLength = right.indexOf('*')
            return (
                rightPrefixLength - leftPrefixLength ||
                right.length - left.length ||
                (left < right ? -1 : left > right ? 1 : 0)
            )
        })
    const pattern = patterns.find((candidate) => {
        const wildcard = candidate.indexOf('*')
        const prefix = candidate.slice(0, wildcard)
        const suffix = candidate.slice(wildcard + 1)
        return subpath.startsWith(prefix) && subpath.endsWith(suffix)
    })
    if (!pattern) return null

    const wildcard = pattern.indexOf('*')
    const prefix = pattern.slice(0, wildcard)
    const suffix = pattern.slice(wildcard + 1)
    const end = suffix ? subpath.length - suffix.length : undefined
    return replaceExportPattern(exports[pattern], subpath.slice(prefix.length, end))
}

function packageExportValue(exports, subpath) {
    if (!isExportMap(exports)) return rootExportOrNull(exports, subpath)
    if (!hasExportSubpaths(exports)) return rootExportOrNull(exports, subpath)
    if (Object.hasOwn(exports, subpath)) return exports[subpath]
    return matchingExportPattern(exports, subpath)
}

function workspaceSubpath(manifest, specifier) {
    if (specifier === manifest.name) return '.'
    return `.${specifier.slice(manifest.name.length)}`
}

function isActiveRuntimeCondition(condition, requestKind) {
    if (condition === 'default') return true
    if (condition === requestKind) return true
    if (condition === 'import' || condition === 'require') return false
    return RUNTIME_EXPORT_CONDITIONS.has(condition)
}

function runtimeExportTargets(value, requestKind = 'import') {
    if (typeof value === 'string') return [value]
    if (Array.isArray(value)) return fallbackRuntimeTargets(value, requestKind)
    if (!value || typeof value !== 'object') return []
    for (const [condition, target] of Object.entries(value)) {
        if (condition.startsWith('types')) continue
        if (isActiveRuntimeCondition(condition, requestKind)) {
            return runtimeExportTargets(target, requestKind)
        }
    }
    return []
}

function fallbackRuntimeTargets(fallbacks, requestKind) {
    for (const fallback of fallbacks) {
        const targets = runtimeExportTargets(fallback, requestKind)
        if (targets.length === 0) continue
        if (targets.every((target) => isValidPackageTargetForFallback(target))) return targets
    }
    return []
}

function isValidPackageTargetForFallback(target) {
    if (!target.startsWith('./')) return false
    const segments = target.split('/').slice(1)
    if (segments.some(isForbiddenPackageTargetSegment)) return false
    return true
}

function isForbiddenPackageTargetSegment(segment) {
    let decoded
    try {
        decoded = decodeURIComponent(segment)
    } catch {
        return true
    }
    const normalized = decoded.toLowerCase()
    return (
        normalized === '.' ||
        normalized === '..' ||
        normalized === 'node_modules' ||
        normalized.includes('/') ||
        normalized.includes('\\')
    )
}

function workspaceRuntimeTargets(workspacePackage, specifier, requestKind) {
    const { manifest } = workspacePackage
    const subpath = workspaceSubpath(manifest, specifier)
    if (Object.hasOwn(manifest, 'exports')) {
        return runtimeExportTargets(packageExportValue(manifest.exports, subpath), requestKind)
    }
    if (subpath !== '.') return []
    return ['browser', 'module', 'main', 'source'].flatMap((field) => {
        const target = manifest[field]
        if (typeof target !== 'string' || target.length === 0) return []
        return [target.startsWith('./') ? target : `./${target}`]
    })
}

function isDeclarationPath(file) {
    return /\.d\.(?:ts|mts|cts)$/i.test(file)
}

function isPackageRuntimePath(packageRoot, runtimePath) {
    if (!isWithin(packageRoot, runtimePath)) return false
    return !isDeclarationPath(runtimePath)
}

function workspaceRuntimePath(packageRoot, target) {
    if (!target.startsWith('./')) return null
    const runtimePath = resolve(packageRoot, target)
    if (!isPackageRuntimePath(packageRoot, runtimePath)) return null
    if (!existsSync(runtimePath) || !statSync(runtimePath).isFile()) return null
    return runtimePath
}

/**
 * Resolve runtime exports separately from TypeScript's declaration-file resolution.
 * Package manifests are discovered once per fingerprint calculation, never across calls.
 */
export function createWorkspaceRuntimeResolver(root) {
    const packages = discoverWorkspacePackages(root)
    return (resolution, specifier, runtimeRequired, requestKind = 'import') => {
        const { workspacePackage, error } = findWorkspacePackage(packages, specifier)
        if (!workspacePackage) return error ? { error } : null

        const result = {
            manifestPath: workspacePackage.manifestPath,
            runtimePaths: [],
            errors: [],
        }
        if (!resolution) result.errors.push(`${specifier} TypeScript resolution is missing`)
        else if (!isWithin(root, resolve(resolution))) {
            result.errors.push(`${specifier} TypeScript resolution is outside the repository`)
        }
        if (!runtimeRequired) return result

        const targets = [
            ...new Set(workspaceRuntimeTargets(workspacePackage, specifier, requestKind)),
        ]
        if (targets.length === 0)
            result.errors.push(`${specifier} (workspace package has no runtime export)`)
        for (const target of targets) {
            const runtimePath = workspaceRuntimePath(workspacePackage.packageRoot, target)
            if (runtimePath) result.runtimePaths.push(runtimePath)
            else result.errors.push(`${specifier} runtime export ${target}`)
        }
        return result
    }
}
