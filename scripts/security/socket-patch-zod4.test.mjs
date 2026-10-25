import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const socketPatchVersion = '2.0.0'
const socketPatchHash = '375db8e6bdf3a95986598bdffcecc5defdbe14f45de028c075c3397a02d59e33'

function findPackageRoot(entry) {
    let directory = dirname(entry)
    while (true) {
        const manifestPath = join(directory, 'package.json')
        if (existsSync(manifestPath)) {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
            if (manifest.name && manifest.version) {
                return { directory, manifestPath, manifest }
            }
        }
        const parent = dirname(directory)
        assert.notEqual(parent, directory, `Could not find package root for ${entry}`)
        directory = parent
    }
}

function makeRecord(cves) {
    return {
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        exportedAt: '2024-01-01T00:00:00Z',
        files: {},
        vulnerabilities: {
            'GHSA-jrhj-2j3q-xf3v': {
                cves,
                summary: 'Path traversal vulnerability',
                severity: 'high',
                description: 'Allows reading arbitrary files',
            },
        },
        description: 'Fix path traversal',
        license: 'MIT',
        tier: 'free',
    }
}

test('Socket Patch public schema export runs from the patched Zod 4 package', () => {
    const cliManifestPath = join(repositoryRoot, 'node_modules/@socketsecurity/cli/package.json')
    const cli = JSON.parse(readFileSync(cliManifestPath, 'utf8'))
    assert.equal(cli.version, '1.4.1')

    const cliRequire = createRequire(cliManifestPath)
    const schemaEntry = realpathSync(cliRequire.resolve('@socketsecurity/socket-patch/schema'))
    assert.ok(existsSync(schemaEntry), 'the package public schema export resolves to a real file')
    const socketPatch = findPackageRoot(schemaEntry)
    assert.equal(socketPatch.manifest.version, socketPatchVersion)
    assert.match(socketPatch.directory, new RegExp(`patch_hash=${socketPatchHash}`, 'u'))
    assert.equal(
        schemaEntry,
        join(socketPatch.directory, 'dist/schema/manifest-schema.js'),
        'the CLI consumer resolves the declared runtime export',
    )
    assert.ok(
        existsSync(join(socketPatch.directory, 'dist/schema/manifest-schema.d.ts')),
        'the declared TypeScript export is present',
    )

    const patchPath = join(repositoryRoot, 'patches/@socketsecurity__socket-patch@2.0.0.patch')
    const patchHash = createHash('sha256').update(readFileSync(patchPath)).digest('hex')
    assert.equal(patchHash, socketPatchHash)
    assert.match(
        readFileSync(join(repositoryRoot, 'pnpm-lock.yaml'), 'utf8'),
        new RegExp(`socket-patch@2\\.0\\.0\\(patch_hash=${socketPatchHash}\\)`, 'u'),
    )

    const socketRequire = createRequire(socketPatch.manifestPath)
    const zod = findPackageRoot(socketRequire.resolve('zod'))
    assert.equal(zod.manifest.version, '4.6.7')
    const { PatchRecordSchema } = cliRequire('@socketsecurity/socket-patch/schema')

    assert.equal(
        PatchRecordSchema.safeParse(makeRecord(['CVE-2024-12345'])).success,
        true,
        'a valid Socket patch record is still accepted',
    )
    assert.equal(
        PatchRecordSchema.safeParse(
            makeRecord(
                Array.from({ length: 256 }, (_, i) => `CVE-2024-${String(i).padStart(5, '0')}`),
            ),
        ).success,
        true,
        'the existing maximum CVE-list size remains valid',
    )

    const oversized = PatchRecordSchema.safeParse(
        makeRecord(
            Array.from({ length: 257 }, (_, i) =>
                i === 0 ? null : `CVE-2024-${String(i).padStart(5, '0')}`,
            ),
        ),
    )
    assert.equal(oversized.success, false)
    assert.equal(oversized.error.issues.length, 1)
    assert.equal(oversized.error.issues[0].code, 'too_big')
    assert.deepEqual(oversized.error.issues[0].path, [
        'vulnerabilities',
        'GHSA-jrhj-2j3q-xf3v',
        'cves',
    ])
})
