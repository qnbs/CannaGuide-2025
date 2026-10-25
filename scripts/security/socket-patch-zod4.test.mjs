import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import Module, { createRequire } from 'node:module'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const socketPatchVersion = '2.0.0'
const socketPatchHash = '4af5920ae229cc67b7cc6d2a48b5a59f41676e596c5dfbd39faee135f9d07808'

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

test('Socket Patch schema compiles and runs from the patched Zod 4 package', () => {
    const cliManifestPath = join(repositoryRoot, 'node_modules/@socketsecurity/cli/package.json')
    const cli = JSON.parse(readFileSync(cliManifestPath, 'utf8'))
    assert.equal(cli.version, '1.4.1')

    const cliRequire = createRequire(cliManifestPath)
    const schemaSource = realpathSync(
        join(
            repositoryRoot,
            'node_modules/@socketsecurity/socket-patch/src/schema/manifest-schema.ts',
        ),
    )
    assert.ok(
        existsSync(schemaSource),
        'the patched schema source is present in the installed package',
    )
    const socketPatch = findPackageRoot(schemaSource)
    assert.equal(socketPatch.manifest.version, socketPatchVersion)
    assert.match(socketPatch.directory, new RegExp(`patch_hash=${socketPatchHash}`, 'u'))

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
    const rootRequire = createRequire(join(repositoryRoot, 'package.json'))
    const typescript = rootRequire('typescript')
    const transpiled = typescript.transpileModule(readFileSync(schemaSource, 'utf8'), {
        compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
    })
    const schemaModule = new Module(schemaSource)
    schemaModule.filename = schemaSource
    schemaModule.paths = Module._nodeModulePaths(dirname(schemaSource))
    schemaModule._compile(transpiled.outputText, schemaSource)
    const { PatchRecordSchema } = schemaModule.exports

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
