import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'

import { normalizeSarif, repositoryPath, trackedFiles } from './normalize-sarif-locations.mjs'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const SCRIPT = resolve(ROOT, 'scripts/security/normalize-sarif-locations.mjs')
// Reconstructed from the Grype 0.118.0 analysis of run 45582017088 (dir:. scan), in the
// shape Grype writes: Syft's root-relative paths, no uriBaseId.
const FIXTURE = resolve(ROOT, 'scripts/security/fixtures/grype-dir-scan.sarif')
const readFixture = () => JSON.parse(readFileSync(FIXTURE, 'utf8'))
const uris = (sarif) =>
    sarif.runs.flatMap((run) =>
        run.results.flatMap((result) =>
            result.locations.map((location) => location.physicalLocation.artifactLocation.uri),
        ),
    )

const WORKSPACE = '/ws/repo'
const TRACKED = new Set([
    'pnpm-lock.yaml',
    'apps/desktop/src-tauri/Cargo.lock',
    'apps/a b/x.lock',
    'apps/q?.lock',
])
const map = (uri) => repositoryPath(uri, { workspace: WORKSPACE, tracked: TRACKED })

test('the real Grype output maps to tracked files, and nothing else changes', () => {
    const before = readFixture()
    const sarif = readFixture()
    const counts = normalizeSarif(sarif, { workspace: ROOT, tracked: trackedFiles(ROOT) })
    assert.deepEqual(uris(before), ['/pnpm-lock.yaml', '/apps/desktop/src-tauri/Cargo.lock'])
    assert.deepEqual(uris(sarif), ['pnpm-lock.yaml', 'apps/desktop/src-tauri/Cargo.lock'])
    assert.equal(counts.rewritten, 2)
    assert.equal(counts.unmapped, 0)
    // Every other field is untouched: put the original URIs back and the logs are equal.
    sarif.runs[0].results.forEach((result, index) => {
        result.locations[0].physicalLocation.artifactLocation.uri = uris(before)[index]
    })
    assert.deepEqual(sarif, before)
})

test('root-relative, relative, workspace-absolute and file: URIs map to the tracked path', () => {
    assert.equal(map('/pnpm-lock.yaml'), 'pnpm-lock.yaml')
    assert.equal(map('pnpm-lock.yaml'), 'pnpm-lock.yaml')
    assert.equal(map('./apps/desktop/src-tauri/Cargo.lock'), 'apps/desktop/src-tauri/Cargo.lock')
    assert.equal(
        map('/ws/repo/apps/desktop/src-tauri/Cargo.lock'),
        'apps/desktop/src-tauri/Cargo.lock',
    )
    assert.equal(map('file:///ws/repo/pnpm-lock.yaml'), 'pnpm-lock.yaml')
    assert.equal(map('apps//desktop/./src-tauri/Cargo.lock'), 'apps/desktop/src-tauri/Cargo.lock')
    assert.equal(map('apps/desktop/../../pnpm-lock.yaml'), 'pnpm-lock.yaml')
    // Percent-encoding is decoded for the lookup.
    assert.equal(map('/apps/a%20b/x.lock'), 'apps/a b/x.lock')
    assert.equal(map('file:///ws/repo/apps/a%20b/x.lock'), 'apps/a b/x.lock')
})

test('external paths, other schemes, traversal and malformed URIs are not mapped', () => {
    for (const uri of [
        '/usr/lib/node_modules/npm/package.json', // absolute, outside the repository
        '/ws/repo-other/pnpm-lock.yaml', // a sibling directory, not the workspace
        'https://example.org/pnpm-lock.yaml', // another scheme
        'file://host/ws/repo/pnpm-lock.yaml', // a file: URI on another host is not this path
        '/../etc/passwd', // climbs out of the root
        'apps/../../etc/passwd', // climbs out of the repository
        '%E0%A4%A', // malformed percent-encoding
        'apps\\desktop\\src-tauri\\Cargo.lock', // backslashes are not POSIX segments
        'apps/desktop', // a directory, not a tracked file
        '/', // nothing
        '',
    ]) {
        assert.equal(map(uri), null, uri)
    }
})

test('a uriBaseId, an unmappable or a missing uri stays exactly as it was', () => {
    const location = (artifactLocation) => ({ physicalLocation: { artifactLocation } })
    const sarif = {
        runs: [
            {
                results: [
                    {
                        ruleId: 'R1',
                        level: 'error',
                        message: { text: 'kept' },
                        partialFingerprints: { primaryLocationLineHash: 'abc:1' },
                        properties: { 'security-severity': '8.1' },
                        locations: [
                            location({ uri: '/pnpm-lock.yaml', uriBaseId: '%SRCROOT%' }),
                            location({ uri: '/usr/lib/x.so' }),
                            location({ index: 0 }),
                        ],
                        relatedLocations: [location({ uri: '/apps/a%20b/x.lock' })],
                    },
                ],
                artifacts: [{ location: { uri: '/pnpm-lock.yaml' } }],
            },
        ],
    }
    const before = structuredClone(sarif)
    const counts = normalizeSarif(sarif, { workspace: WORKSPACE, tracked: TRACKED })
    const [result] = sarif.runs[0].results
    assert.deepEqual(result.locations, before.runs[0].results[0].locations)
    assert.equal(
        result.relatedLocations[0].physicalLocation.artifactLocation.uri,
        'apps/a%20b/x.lock',
    )
    assert.equal(sarif.runs[0].artifacts[0].location.uri, 'pnpm-lock.yaml')
    for (const key of ['ruleId', 'level', 'message', 'partialFingerprints', 'properties']) {
        assert.deepEqual(result[key], before.runs[0].results[0][key], key)
    }
    assert.deepEqual(
        { ...counts, unmappedUris: counts.unmappedUris },
        { rewritten: 2, unchanged: 0, unmapped: 1, skipped: 2, unmappedUris: ['/usr/lib/x.so'] },
    )
})

test('a rewritten path is a valid URI reference, and a second run changes nothing', () => {
    const sarif = {
        runs: [
            {
                results: ['/apps/q?.lock', '/apps/a b/x.lock', '/pnpm-lock.yaml'].map((uri) => ({
                    locations: [{ physicalLocation: { artifactLocation: { uri } } }],
                })),
            },
        ],
    }
    normalizeSarif(sarif, { workspace: WORKSPACE, tracked: TRACKED })
    assert.deepEqual(uris(sarif), ['apps/q%3F.lock', 'apps/a%20b/x.lock', 'pnpm-lock.yaml'])
    const once = structuredClone(sarif)
    const again = normalizeSarif(sarif, { workspace: WORKSPACE, tracked: TRACKED })
    assert.deepEqual(sarif, once)
    assert.equal(again.rewritten, 0)
    assert.equal(again.unchanged, 3)
})

test('the CLI writes the mapped log, and fails closed on bad input or arguments', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-sarif-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    const run = (...args) =>
        spawnSync(process.execPath, [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8' })
    const out = join(dir, 'out.sarif')
    const ok = run('--in', FIXTURE, '--out', out)
    assert.equal(ok.status, 0, ok.stderr)
    assert.match(ok.stdout, /2 mapped to tracked files, 0 already relative, 0 unmapped/)
    assert.deepEqual(uris(JSON.parse(readFileSync(out, 'utf8'))), [
        'pnpm-lock.yaml',
        'apps/desktop/src-tauri/Cargo.lock',
    ])
    writeFileSync(join(dir, 'bad.sarif'), '{ not json')
    assert.equal(run('--in', join(dir, 'bad.sarif'), '--out', out).status, 1)
    writeFileSync(join(dir, 'empty.sarif'), '{}')
    assert.equal(run('--in', join(dir, 'empty.sarif'), '--out', out).status, 1)
    // Outside a git checkout the tracked files are unknown, so nothing is guessed.
    assert.equal(run('--in', FIXTURE, '--out', out, '--workspace', dir).status, 1)
    assert.equal(run('--in', FIXTURE).status, 2)
    assert.equal(run('--in', FIXTURE, '--out').status, 2)
})

test('Security Full uploads the mapped Grype log, and the raw one only if mapping failed', () => {
    const workflow = parse(
        readFileSync(resolve(ROOT, '.github/workflows/security-full.yml'), 'utf8'),
    )
    const steps = workflow.jobs.grype.steps
    const index = (predicate) => steps.findIndex(predicate)
    const scan = index((step) => step.id === 'grype')
    const mapping = index((step) => step.id === 'map-locations')
    const uploads = steps.filter((step) =>
        step.uses?.startsWith('github/codeql-action/upload-sarif@'),
    )
    assert.ok(scan !== -1 && mapping > scan, 'the mapping runs after the scan')
    assert.match(
        steps[mapping].run,
        /normalize-sarif-locations\.mjs --in "\$GRYPE_SARIF" --out grype-results\.sarif/,
    )
    assert.equal(steps[mapping].env.GRYPE_SARIF, '${{ steps.grype.outputs.sarif }}')
    assert.equal(uploads.length, 2)
    const [mapped, raw] = uploads
    assert.equal(mapped.with.sarif_file, 'grype-results.sarif')
    assert.match(mapped.if, /steps\.map-locations\.outcome == 'success'/)
    assert.equal(raw.with.sarif_file, '${{ steps.grype.outputs.sarif }}')
    assert.match(raw.if, /steps\.map-locations\.outcome == 'failure'/)
    for (const upload of uploads) assert.equal(upload.with.category, 'grype-filesystem')
})
