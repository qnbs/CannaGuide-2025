#!/usr/bin/env node
/**
 * Maps SARIF artifact locations to repository-relative paths, so code scanning can match each
 * result to a file. Grype's directory scans report Syft's root-relative paths
 * ("/pnpm-lock.yaml"); GitHub stores such a URI verbatim and cannot map it to a file.
 *
 * Only an `artifactLocation` with a string `uri` and no `uriBaseId` is considered, and it is
 * rewritten only when it resolves to a tracked file:
 *   - a plain root-relative path ("/pnpm-lock.yaml"), as Syft reports it;
 *   - an absolute path inside the workspace ("/home/runner/work/r/r/pnpm-lock.yaml"), plain or
 *     as a local `file:` URI;
 *   - a relative path with a "./" prefix or redundant segments.
 * Everything else is kept exactly as it was and counted as unmapped: absolute paths outside
 * the repository, `file:` URIs outside the workspace or on another host, other URI schemes,
 * malformed percent-encoding, paths that climb out of the repository, and paths of files
 * that are not tracked. No result, rule, fingerprint, level,
 * message or property is changed or dropped. The output is deterministic, and a second run
 * changes nothing.
 *
 * Usage: node scripts/security/normalize-sarif-locations.mjs --in <sarif> --out <sarif>
 *        [--workspace <dir>]   (default: the current directory)
 * Exit codes: 0 done (unmapped locations are reported, not fatal); 1 unreadable or invalid
 * SARIF, or the tracked-file listing failed; 2 usage error.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/

/** Every tracked file of the repository at `root`, as repository-relative POSIX paths. */
export function trackedFiles(root) {
    const result = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`git ls-files failed in ${root}`)
    return new Set(result.stdout.split('\0').filter(Boolean))
}

const decode = (value) => {
    try {
        return decodeURIComponent(value)
    } catch {
        return null
    }
}

/** A repository-relative path as a URI reference: spaces, non-ASCII, `?` and `#` encoded. */
const encodePath = (path) => encodeURI(path).replace(/[?#]/g, encodeURIComponent)

/** The path a local `file:` URI names, or null for another host or an unparsable URI. */
function fileUriPath(uri) {
    let url
    try {
        url = new URL(uri)
    } catch {
        return null
    }
    const local = url.host === '' || url.host === 'localhost'
    return local ? url.pathname : null
}

/** The path below the workspace, or null when `path` is not inside it. */
function insideWorkspace(path, workspace) {
    const root = workspace.replace(/\/+$/, '')
    return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : null
}

/**
 * A plain path relative to the repository root: inside the workspace, or root-relative as
 * Syft reports it ("/pnpm-lock.yaml"), or already relative.
 */
function plainRelative(uri, workspace) {
    const path = decode(uri)
    if (path === null) return null
    return insideWorkspace(path, workspace) ?? path.replace(/^\//, '')
}

/**
 * A `file:` URI relative to the repository root. It is an absolute path on this machine,
 * so only a path inside the workspace counts; `file:///pnpm-lock.yaml` is not ours.
 */
function fileUriRelative(uri, workspace) {
    if (!/^file:/i.test(uri)) return null
    const path = fileUriPath(uri)
    const decoded = path === null ? null : decode(path)
    return decoded === null ? null : insideWorkspace(decoded, workspace)
}

/** The POSIX-normalized path, or null when `..` would leave the repository. */
function normalizedPath(path) {
    const normal = posix.normalize(path)
    const escapes = normal === '..' || normal.startsWith('../')
    return escapes ? null : normal
}

const UNSAFE = /[\0\\]/

/**
 * The tracked repository-relative path a location URI names, or null when it names none.
 * `workspace` is the absolute checkout directory; `tracked` is the set of tracked files.
 */
export function repositoryPath(uri, { workspace, tracked }) {
    const relative = SCHEME.test(uri)
        ? fileUriRelative(uri, workspace)
        : plainRelative(uri, workspace)
    if (relative === null || UNSAFE.test(relative)) return null
    const path = normalizedPath(relative)
    return path && tracked.has(path) ? path : null
}

const resultLocations = (result) => [
    ...(result.locations ?? []),
    ...(result.relatedLocations ?? []),
]
const physicalArtifact = (location) => location?.physicalLocation?.artifactLocation

/** Every artifactLocation object in a run, results first, then the artifacts table. */
function artifactLocations(run) {
    const fromResults = (run.results ?? []).flatMap(resultLocations).map(physicalArtifact)
    const fromArtifacts = (run.artifacts ?? []).map((artifact) => artifact?.location)
    return [...fromResults, ...fromArtifacts].filter(Boolean)
}

/**
 * Rewrites the mappable locations of a parsed SARIF log in place and returns the counts:
 * `rewritten`, `unchanged` (already repository-relative), `unmapped` (kept as is, listed in
 * `unmappedUris`) and `skipped` (a `uriBaseId` or no string `uri`).
 * `context` is `{ workspace, tracked }`, as for repositoryPath.
 */
export function normalizeSarif(sarif, context) {
    const counts = { rewritten: 0, unchanged: 0, unmapped: 0, skipped: 0 }
    const unmapped = new Set()
    for (const location of sarifRuns(sarif).flatMap(artifactLocations)) {
        const outcome = mapLocation(location, context)
        counts[outcome] += 1
        if (outcome === 'unmapped') unmapped.add(location.uri)
    }
    return { ...counts, unmappedUris: [...unmapped] }
}

/** The runs of a parsed SARIF log; throws when it has none. */
function sarifRuns(sarif) {
    const runs = sarif?.runs
    if (!Array.isArray(runs)) throw new Error('not a SARIF log: no runs array')
    return runs
}

/** Only a plain string uri without a base is ours to map; a uriBaseId keeps its meaning. */
const isMappable = (location) => typeof location.uri === 'string' && !('uriBaseId' in location)

/** Maps one artifactLocation in place; returns which count it belongs to. */
function mapLocation(location, context) {
    if (!isMappable(location)) return 'skipped'
    const path = repositoryPath(location.uri, context)
    if (path === null) return 'unmapped'
    const uri = encodePath(path)
    if (uri === location.uri) return 'unchanged'
    location.uri = uri
    return 'rewritten'
}

const USAGE = 'usage: normalize-sarif-locations.mjs --in <sarif> --out <sarif> [--workspace <dir>]'

/** The validated CLI options; throws on an unknown, valueless or missing option. */
function cliOptions(argv) {
    const { values } = parseArgs({
        args: argv,
        options: {
            in: { type: 'string' },
            out: { type: 'string' },
            workspace: { type: 'string', default: process.cwd() },
        },
    })
    if (!values.in || !values.out) throw new Error('--in and --out are required')
    return values
}

function report(counts) {
    console.log(
        `[OK] SARIF locations: ${counts.rewritten} mapped to tracked files, ` +
            `${counts.unchanged} already relative, ${counts.unmapped} unmapped (kept), ` +
            `${counts.skipped} with a uriBaseId or no uri (untouched)`,
    )
    for (const uri of counts.unmappedUris.slice(0, 10)) {
        console.log(`[WARN] kept unmapped location: ${uri}`)
    }
}

function normalizeFile({ in: input, out, workspace }) {
    const root = resolve(workspace)
    const sarif = JSON.parse(readFileSync(input, 'utf8'))
    const counts = normalizeSarif(sarif, { workspace: root, tracked: trackedFiles(root) })
    writeFileSync(out, `${JSON.stringify(sarif, null, 2)}\n`)
    report(counts)
}

export function main(argv = process.argv.slice(2)) {
    let options
    try {
        options = cliOptions(argv)
    } catch (error) {
        console.error(`[FAIL] ${error.message}`)
        console.error(USAGE)
        return 2
    }
    try {
        normalizeFile(options)
        return 0
    } catch (error) {
        console.error(`[FAIL] ${error.message}`)
        return 1
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main()
}
