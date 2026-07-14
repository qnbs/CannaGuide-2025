#!/usr/bin/env node
/**
 * Fail when a workspace imports a package it does not declare.
 *
 * pnpm-workspace.yaml sets `shamefullyHoist: true`, which flattens transitive
 * dependencies into the root node_modules. An undeclared import therefore still
 * resolves -- until the package that dragged it in drops it, or hoisting is
 * turned off, and then it breaks at runtime with nothing in the diff to explain
 * why. `@sentry/browser` reached exactly that state: removed from apps/web by a
 * dependency bump while five source files still imported it directly.
 *
 * This walks every workspace, extracts the external imports from its sources,
 * and checks each one against that workspace's own package.json -- never against
 * whatever happens to be present in node_modules.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = '[check:phantom-deps]'
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const WORKSPACE_DIRS = ['apps', 'packages']
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'])
const SKIP_DIRS = new Set([
    'node_modules',
    'dist',
    'build',
    'coverage',
    'test-results',
    'playwright-report',
    '.turbo',
    '.vite',
])

/** Files whose imports may legitimately come from devDependencies. */
const DEV_FILE =
    /(\.(test|spec|bench|stories)\.[cm]?[jt]sx?$)|(\.(config|setup)\.[cm]?[jt]s$)|(^|\/)(tests?|e2e|__mocks__|__tests__)\//

/**
 * A well-formed bare specifier, so a regex that wandered across a line boundary
 * produces no finding rather than a nonsense package name.
 */
const BARE_SPECIFIER = /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(\/[\w.-]+)*$/i

const BUILTINS = new Set(builtinModules)

/**
 * Specifiers that never map to a package.json entry: relative and absolute
 * paths, the `@/*` tsconfig alias (which points back into the workspace), node
 * builtins with or without the `node:` prefix, and Vite virtual modules.
 */
const isInternal = (specifier) =>
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('@/') ||
    specifier.startsWith('~/') ||
    specifier.startsWith('node:') ||
    specifier.startsWith('virtual:') ||
    specifier.startsWith('\0') ||
    BUILTINS.has(specifier)

/** `@scope/name/deep/path` -> `@scope/name`; `name/deep/path` -> `name`. */
function packageNameOf(specifier) {
    const withoutQuery = specifier.split('?')[0]
    const segments = withoutQuery.split('/')
    return withoutQuery.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]
}

/**
 * Import specifiers, via regex rather than a parser: the repo's other check
 * scripts stay dependency-free, and the shapes below cover every form in use.
 */
const IMPORT_PATTERNS = [
    /(?:^|[^\w$])import\s+(?:type\s+)?[\w*{},\s]*\s*from\s*['"]([^'"]+)['"]/g,
    /(?:^|[^\w$])import\s*['"]([^'"]+)['"]/g,
    /(?:^|[^\w$])export\s+(?:type\s+)?[\w*{},\s]*\s*from\s*['"]([^'"]+)['"]/g,
    /(?:^|[^\w$])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /(?:^|[^\w$])require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

/**
 * Comments are not runtime imports: a commented-out import, or a JSDoc
 * `@type {import('x')}`, must not count as a dependency.
 */
const stripComments = (source) =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*(\/\/|\*).*$/gm, '')

function importedPackages(source) {
    const code = stripComments(source)
    const found = new Set()
    for (const pattern of IMPORT_PATTERNS) {
        pattern.lastIndex = 0
        let match
        while ((match = pattern.exec(code)) !== null) {
            const specifier = match[1]
            if (isInternal(specifier) || !BARE_SPECIFIER.test(specifier)) continue
            found.add(packageNameOf(specifier))
        }
    }
    return found
}

function sourceFilesIn(dir) {
    const files = []
    for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) files.push(...sourceFilesIn(path))
        else if (SOURCE_EXTENSIONS.has(entry.slice(entry.lastIndexOf('.')))) files.push(path)
    }
    return files
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

function workspacePackages() {
    const packages = []
    for (const group of WORKSPACE_DIRS) {
        let entries
        try {
            entries = readdirSync(join(ROOT, group))
        } catch {
            continue // group absent
        }
        for (const entry of entries) {
            const dir = join(ROOT, group, entry)
            try {
                packages.push({ dir, manifest: readJson(join(dir, 'package.json')) })
            } catch {
                // no package.json -- not a workspace
            }
        }
    }
    return packages
}

const declaredIn = (manifest, ...fields) =>
    new Set(fields.flatMap((field) => Object.keys(manifest[field] ?? {})))

const workspaces = workspacePackages()
const workspaceNames = new Set(workspaces.map(({ manifest }) => manifest.name))

const phantom = [] // imported, declared nowhere
const misplaced = [] // runtime code reaching into a devDependency

for (const { dir, manifest } of workspaces) {
    const runtimeDeps = declaredIn(
        manifest,
        'dependencies',
        'optionalDependencies',
        'peerDependencies',
    )
    const devDeps = declaredIn(manifest, 'devDependencies')

    for (const file of sourceFilesIn(dir)) {
        const isDevFile = DEV_FILE.test(relative(ROOT, file))

        for (const pkg of importedPackages(readFileSync(file, 'utf8'))) {
            if (pkg === manifest.name) continue // self-reference via own exports
            if (runtimeDeps.has(pkg)) continue
            if (devDeps.has(pkg)) {
                if (!isDevFile) misplaced.push({ file, pkg, owner: manifest.name })
                continue
            }
            phantom.push({ file, pkg, owner: manifest.name })
        }
    }
}

function report(entries) {
    const grouped = new Map()
    for (const { file, pkg, owner } of entries) {
        const key = `${owner} -> ${pkg}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(relative(ROOT, file))
    }
    for (const [key, files] of [...grouped].sort()) {
        console.error(`${TAG}   ${key}`)
        for (const file of files.slice(0, 5)) console.error(`${TAG}       ${file}`)
        if (files.length > 5) console.error(`${TAG}       ... and ${files.length - 5} more`)
    }
}

if (phantom.length === 0 && misplaced.length === 0) {
    console.log(`${TAG} OK -- every imported package is declared by the workspace importing it.`)
    process.exit(0)
}

if (phantom.length > 0) {
    console.error(`${TAG} Undeclared imports (these resolve only through shamefullyHoist):`)
    report(phantom)
}
if (misplaced.length > 0) {
    console.error(`${TAG} Runtime code importing a devDependency:`)
    report(misplaced)
}
console.error(
    `${TAG} Declare each package in the importing workspace's package.json, or stop importing it.`,
)
process.exit(1)
