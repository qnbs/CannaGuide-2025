#!/usr/bin/env node
/**
 * Maps SARIF artifact locations to repository-relative paths, so code scanning can match each
 * result to a file. Grype's directory scans report Syft's root-relative paths
 * ("/pnpm-lock.yaml"); GitHub stores such a URI verbatim and cannot map it to a file.
 *
 * Only an `artifactLocation` with a string `uri` and no `uriBaseId` is considered, and it is
 * rewritten only when it resolves to a tracked file:
 *   - a root-relative path ("/pnpm-lock.yaml"), as Syft reports it;
 *   - an absolute path inside the workspace ("/home/runner/work/r/r/pnpm-lock.yaml"), plain or
 *     as a `file:` URI;
 *   - a relative path with a "./" prefix or redundant segments.
 * Everything else is kept exactly as it was and counted as unmapped: absolute paths outside
 * the repository, other URI schemes, malformed percent-encoding, paths that climb out of the
 * repository, and paths of files that are not tracked. No result, rule, fingerprint, level,
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
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

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

/**
 * The tracked repository-relative path a location URI names, or null when it names none.
 * `workspace` is the absolute checkout directory; `tracked` is the set of tracked files.
 */
export function repositoryPath(uri, { workspace, tracked }) {
    let candidate
    if (SCHEME.test(uri)) {
        if (!/^file:/i.test(uri)) return null
        let url
        try {
            url = new URL(uri)
        } catch {
            return null
        }
        // A file: URI that names another host is not a path on this machine.
        if (url.host !== '' && url.host !== 'localhost') return null
        candidate = decode(url.pathname)
    } else {
        candidate = decode(uri)
    }
    if (candidate === null || candidate.includes('\0') || candidate.includes('\\')) return null
    const root = workspace.replace(/\/+$/, '')
    if (candidate.startsWith(`${root}/`)) candidate = candidate.slice(root.length + 1)
    else if (candidate.startsWith('/')) candidate = candidate.slice(1)
    const parts = []
    for (const segment of candidate.split('/')) {
        if (segment === '' || segment === '.') continue
        if (segment === '..') {
            if (parts.length === 0) return null
            parts.pop()
            continue
        }
        parts.push(segment)
    }
    const path = parts.join('/')
    return path !== '' && tracked.has(path) ? path : null
}

/** Every artifactLocation object in a run's results and artifacts. */
function* artifactLocations(run) {
    for (const result of run.results ?? []) {
        for (const location of [...(result.locations ?? []), ...(result.relatedLocations ?? [])]) {
            if (location?.physicalLocation?.artifactLocation) {
                yield location.physicalLocation.artifactLocation
            }
        }
    }
    for (const artifact of run.artifacts ?? []) {
        if (artifact?.location) yield artifact.location
    }
}

/**
 * Rewrites the mappable locations of a parsed SARIF log in place and returns the counts:
 * `rewritten`, `unchanged` (already repository-relative), `unmapped` (kept as is, listed in
 * `unmappedUris`) and `skipped` (a `uriBaseId` or no string `uri`).
 */
export function normalizeSarif(sarif, { workspace, tracked }) {
    if (!sarif || typeof sarif !== 'object' || !Array.isArray(sarif.runs)) {
        throw new Error('not a SARIF log: no runs array')
    }
    const counts = { rewritten: 0, unchanged: 0, unmapped: 0, skipped: 0, unmappedUris: [] }
    for (const run of sarif.runs) {
        for (const location of artifactLocations(run)) {
            if (typeof location.uri !== 'string' || location.uriBaseId !== undefined) {
                counts.skipped += 1
                continue
            }
            const path = repositoryPath(location.uri, { workspace, tracked })
            if (path === null) {
                counts.unmapped += 1
                if (!counts.unmappedUris.includes(location.uri))
                    counts.unmappedUris.push(location.uri)
                continue
            }
            const uri = encodePath(path)
            if (uri === location.uri) {
                counts.unchanged += 1
            } else {
                location.uri = uri
                counts.rewritten += 1
            }
        }
    }
    return counts
}

function parseArgs(argv) {
    const options = { workspace: process.cwd() }
    const keys = { '--in': 'input', '--out': 'output', '--workspace': 'workspace' }
    for (let index = 0; index < argv.length; index += 2) {
        const key = keys[argv[index]]
        if (!key || argv[index + 1] === undefined)
            throw new Error(`unexpected argument: ${argv[index]}`)
        options[key] = argv[index + 1]
    }
    if (!options.input || !options.output) throw new Error('--in and --out are required')
    return options
}

export function main(argv = process.argv.slice(2)) {
    let options
    try {
        options = parseArgs(argv)
    } catch (error) {
        console.error(`[FAIL] ${error.message}`)
        console.error(
            'usage: normalize-sarif-locations.mjs --in <sarif> --out <sarif> [--workspace <dir>]',
        )
        return 2
    }
    try {
        const workspace = resolve(options.workspace)
        const sarif = JSON.parse(readFileSync(options.input, 'utf8'))
        const counts = normalizeSarif(sarif, { workspace, tracked: trackedFiles(workspace) })
        writeFileSync(options.output, `${JSON.stringify(sarif, null, 2)}\n`)
        console.log(
            `[OK] SARIF locations: ${counts.rewritten} mapped to tracked files, ` +
                `${counts.unchanged} already relative, ${counts.unmapped} unmapped (kept), ` +
                `${counts.skipped} with a uriBaseId or no uri (untouched)`,
        )
        for (const uri of counts.unmappedUris.slice(0, 10)) {
            console.log(`[WARN] kept unmapped location: ${uri}`)
        }
        return 0
    } catch (error) {
        console.error(`[FAIL] ${error instanceof Error ? error.message : error}`)
        return 1
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main()
}
