import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import https from 'node:https'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const bidiVersion = '14.0.0'
const originalTarballUrl = 'https://registry.npmjs.org/chromium-bidi/-/chromium-bidi-14.0.0.tgz'
const originalTarballIntegrity =
    'sha512-9gYlLtS6tStdRWzrtXaTMnqcM4dudNegMXJxkR0I/CXObHalYeYcAMPrL19eroNZHtJ8DQmu1E+ZNOYu/IXMXw=='
const originalMapperSha256 = 'd8d4f5580e4431fb2d4d1b55b6259206f558fdec3826316fe219040fbad3778c'
const patchedMapperSha256 = '6afb6eb3759e6b47ee128918a858aed797db5397d52ff2bb07c81ac16805687a'

function readManifest(manifestPath) {
    return JSON.parse(readFileSync(manifestPath, 'utf8'))
}

function findPackageRoot(entry) {
    let directory = dirname(entry)
    while (true) {
        const manifestPath = join(directory, 'package.json')
        if (existsSync(manifestPath)) {
            const manifest = readManifest(manifestPath)
            if (manifest.name && manifest.version) {
                return { directory, manifestPath, manifest }
            }
        }
        const parent = dirname(directory)
        assert.notEqual(parent, directory, `Could not find package root for ${entry}`)
        directory = parent
    }
}

function resolveInstalledGraph() {
    const lhciManifestPath = join(repositoryRoot, 'node_modules/@lhci/cli/package.json')
    assert.ok(existsSync(lhciManifestPath), 'Expected the installed LHCI package link')
    const lhci = readManifest(lhciManifestPath)
    const lighthouse = findPackageRoot(createRequire(lhciManifestPath).resolve('lighthouse'))
    const puppeteer = findPackageRoot(
        createRequire(lighthouse.manifestPath).resolve('puppeteer-core'),
    )
    const bidi = findPackageRoot(createRequire(puppeteer.manifestPath).resolve('chromium-bidi'))
    const zod = findPackageRoot(createRequire(bidi.manifestPath).resolve('zod'))
    return { lhci, lighthouse, puppeteer, bidi, zod }
}

function sha256(bytes) {
    return createHash('sha256').update(bytes).digest('hex')
}

function downloadOriginalTarball() {
    return new Promise((resolvePromise, rejectPromise) => {
        const request = https.get(originalTarballUrl, (response) => {
            if (response.statusCode !== 200) {
                response.resume()
                rejectPromise(new Error(`npm registry returned HTTP ${response.statusCode}`))
                return
            }
            const chunks = []
            let byteLength = 0
            response.on('data', (chunk) => {
                byteLength += chunk.length
                if (byteLength > 2_000_000) {
                    request.destroy(
                        new Error('Original BiDi tarball exceeded the 2 MB fixture limit'),
                    )
                    return
                }
                chunks.push(chunk)
            })
            response.on('end', () => resolvePromise(Buffer.concat(chunks, byteLength)))
            response.on('error', rejectPromise)
        })
        request.setTimeout(15_000, () =>
            request.destroy(new Error('npm registry request timed out')),
        )
        request.on('error', rejectPromise)
    })
}

function extractTarMember(tarball, requestedPath) {
    const archive = gunzipSync(tarball, { maxOutputLength: 16_000_000 })
    let offset = 0
    while (offset + 512 <= archive.length) {
        const header = archive.subarray(offset, offset + 512)
        const field = (start, end) => header.subarray(start, end).toString('utf8').split('\0', 1)[0]
        const name = field(0, 100)
        if (!name) {
            break
        }
        const prefix = field(345, 500)
        const entryPath = prefix ? `${prefix}/${name}` : name
        const size = Number.parseInt(field(124, 136).trim(), 8)
        assert.ok(Number.isSafeInteger(size) && size >= 0, `Invalid tar size for ${entryPath}`)
        const contentStart = offset + 512
        const contentEnd = contentStart + size
        assert.ok(contentEnd <= archive.length, `Truncated tar member ${entryPath}`)
        if (entryPath === requestedPath) {
            return archive.subarray(contentStart, contentEnd)
        }
        offset = contentStart + Math.ceil(size / 512) * 512
    }
    assert.fail(`Could not find ${requestedPath} in the pinned BiDi tarball`)
}

function exposeMapperInternals(mapperSource) {
    const initialization = mapperSource.lastIndexOf('    generatePage();')
    const closure = mapperSource.lastIndexOf('\n})();')
    assert.ok(initialization >= 0 && closure > initialization, 'Unexpected BiDi mapper wrapper')
    return `${mapperSource.slice(0, initialization)}    globalThis.__cannaGuideProbe = { z, Session, Map, Set };\n${mapperSource.slice(closure)}`
}

function loadMapperProbe(mapperSource) {
    const context = {
        console: { log() {}, error() {} },
        window: {},
        document: {},
        navigator: {},
    }
    vm.createContext(context)
    vm.runInContext(exposeMapperInternals(mapperSource), context, { timeout: 7_000 })
    return context.__cannaGuideProbe
}

function parseSubscribe(Session, events) {
    return Session.parseSubscribeParams({ events })
}

test('Chromium BiDi 14.0.0 collection guard protects the installed Lighthouse mapper', async (t) => {
    const { lhci, lighthouse, puppeteer, bidi, zod } = resolveInstalledGraph()
    assert.equal(lhci.version, '0.15.1')
    assert.equal(lighthouse.manifest.version, '12.6.1')
    assert.equal(puppeteer.manifest.version, '24.40.0')
    assert.equal(bidi.manifest.version, bidiVersion)
    assert.equal(zod.manifest.version, '4.6.7')

    const mapperPath = join(bidi.directory, 'lib/iife/mapperTab.js')
    const installedMapper = readFileSync(mapperPath, 'utf8')
    assert.equal(sha256(installedMapper), patchedMapperSha256)
    const patchPath = join(repositoryRoot, 'patches/chromium-bidi@14.0.0.patch')
    const patchHash = sha256(readFileSync(patchPath))
    const workspace = readFileSync(join(repositoryRoot, 'pnpm-workspace.yaml'), 'utf8')
    const lockfile = readFileSync(join(repositoryRoot, 'pnpm-lock.yaml'), 'utf8')
    assert.match(workspace, /chromium-bidi@14\.0\.0: patches\/chromium-bidi@14\.0\.0\.patch/u)
    assert.match(lockfile, new RegExp(`chromium-bidi@14\\.0\\.0\\(patch_hash=${patchHash}\\)`, 'u'))

    const originalTarball = await downloadOriginalTarball()
    assert.equal(
        `sha512-${createHash('sha512').update(originalTarball).digest('base64')}`,
        originalTarballIntegrity,
    )
    const originalMapper = extractTarMember(originalTarball, 'package/lib/iife/mapperTab.js')
    assert.equal(sha256(originalMapper), originalMapperSha256)
    const original = loadMapperProbe(originalMapper.toString('utf8'))
    const patched = loadMapperProbe(installedMapper)

    await t.test('the original official artifact accumulates malformed collection work', () => {
        let arrayVisits = 0
        const boundedArray = original.z
            .array(original.z.any().superRefine(() => arrayVisits++))
            .max(8)
        assert.equal(
            boundedArray.safeParse(Array.from({ length: 256 }, (_, index) => `v${index}`)).success,
            false,
        )
        assert.equal(arrayVisits, 256)

        arrayVisits = 0
        const invalidArray = original.z.array(
            original.z.any().superRefine((value, context) => {
                arrayVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid item' })
            }),
        )
        const arrayResult = invalidArray.safeParse(Array(256).fill(null))
        assert.equal(arrayVisits, 256)
        assert.equal(arrayResult.error.issues.length, 256)

        let keyVisits = 0
        let valueVisits = 0
        const mapSchema = original.z.map(
            original.z.any().superRefine((value, context) => {
                keyVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid key' })
            }),
            original.z.any().superRefine(() => valueVisits++),
        )
        const map = new original.Map([
            [null, 'value'],
            ...Array.from({ length: 255 }, (_, i) => [`k${i}`, `v${i}`]),
        ])
        assert.equal(mapSchema.safeParse(map).success, false)
        assert.equal(keyVisits, 256)
        assert.equal(valueVisits, 256)

        let setVisits = 0
        const setSchema = original.z.set(
            original.z.any().superRefine((value, context) => {
                setVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid item' })
            }),
        )
        assert.equal(
            setSchema.safeParse(
                new original.Set([null, ...Array.from({ length: 255 }, (_, i) => `v${i}`)]),
            ).success,
            false,
        )
        assert.equal(setVisits, 256)

        assert.throws(
            () => parseSubscribe(original.Session, Array(256).fill(null)),
            (error) => String(error.message).length > 10_000,
        )
    })

    await t.test('the patched embedded mapper rejects early and preserves valid boundaries', () => {
        let arrayVisits = 0
        const boundedArray = patched.z
            .array(patched.z.any().superRefine(() => arrayVisits++))
            .max(8)
        assert.equal(
            boundedArray.safeParse(Array.from({ length: 256 }, (_, index) => `v${index}`)).success,
            false,
        )
        assert.equal(arrayVisits, 0)

        arrayVisits = 0
        const invalidArray = patched.z.array(
            patched.z.any().superRefine((value, context) => {
                arrayVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid item' })
            }),
        )
        const arrayResult = invalidArray.safeParse(Array(256).fill(null))
        assert.equal(arrayVisits, 1)
        assert.equal(arrayResult.error.issues.length, 1)

        let keyVisits = 0
        let valueVisits = 0
        const mapSchema = patched.z.map(
            patched.z.any().superRefine((value, context) => {
                keyVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid key' })
            }),
            patched.z.any().superRefine(() => valueVisits++),
        )
        const map = new patched.Map([
            [null, 'value'],
            ...Array.from({ length: 255 }, (_, i) => [`k${i}`, `v${i}`]),
        ])
        assert.equal(mapSchema.safeParse(map).success, false)
        assert.equal(keyVisits, 1)
        assert.equal(valueVisits, 0)

        let setVisits = 0
        const setSchema = patched.z.set(
            patched.z.any().superRefine((value, context) => {
                setVisits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid item' })
            }),
        )
        assert.equal(
            setSchema.safeParse(
                new patched.Set([null, ...Array.from({ length: 255 }, (_, i) => `v${i}`)]),
            ).success,
            false,
        )
        assert.equal(setVisits, 1)

        assert.equal(patched.z.array(patched.z.string()).max(2).safeParse(['a', 'b']).success, true)
        assert.equal(
            patched.z
                .map(patched.z.string(), patched.z.string())
                .safeParse(new patched.Map([['a', 'b']])).success,
            true,
        )
        assert.equal(
            patched.z
                .set(patched.z.string())
                .max(2)
                .safeParse(new patched.Set(['a', 'b'])).success,
            true,
        )
        assert.equal(
            parseSubscribe(
                patched.Session,
                Array.from({ length: 2048 }, (_, i) => `event.${i}`),
            ).events.length,
            2048,
        )
        assert.throws(
            () => parseSubscribe(patched.Session, Array(256).fill(null)),
            (error) => String(error.message).length < 100,
        )
    })

    await t.test('external CommonJS and ESM protocol parsers use Zod 4 guards', async () => {
        const cjsParserPath = join(bidi.directory, 'lib/cjs/protocol-parser/protocol-parser.js')
        const esmParserPath = join(bidi.directory, 'lib/esm/protocol-parser/protocol-parser.js')
        const cjsParser = createRequire(cjsParserPath)(cjsParserPath)
        const esmParser = await import(pathToFileURL(esmParserPath).href)
        for (const [name, Session] of [
            ['CommonJS', cjsParser.Session],
            ['ESM', esmParser.Session],
        ]) {
            assert.equal(
                parseSubscribe(Session, ['browsingContext.contextCreated']).events.length,
                1,
                `${name} small valid input`,
            )
            assert.equal(
                parseSubscribe(
                    Session,
                    Array.from({ length: 2048 }, (_, i) => `event.${i}`),
                ).events.length,
                2048,
                `${name} valid large input`,
            )
            assert.throws(
                () => parseSubscribe(Session, Array(256).fill(null)),
                (error) => String(error.message).length < 100,
                `${name} invalid input should produce one bounded error`,
            )
        }
    })

    await t.test('external guard stops bounded and malformed Array, Map and Set validation', () => {
        const zodApi = createRequire(join(bidi.directory, 'package.json'))('zod')
        const guardPath = join(bidi.directory, 'lib/common/collection-guard.cjs')
        const guard = createRequire(guardPath)(guardPath)
        let visits = 0
        const boundedArray = zodApi.array(zodApi.string().superRefine(() => visits++)).max(8)
        const oversizedArray = Array.from({ length: 256 }, (_, index) => `v${index}`)
        const arrayFailure = guard.safeParse(boundedArray, oversizedArray)
        assert.equal(arrayFailure.success, false)
        assert.equal(visits, 0)
        assert.equal(
            arrayFailure.error.issues[0].message,
            boundedArray.safeParse(oversizedArray).error.issues[0].message,
        )

        visits = 0
        const malformedArray = zodApi.array(
            zodApi.any().superRefine((value, context) => {
                visits++
                if (value === null) context.addIssue({ code: 'custom', message: 'invalid item' })
            }),
        )
        const malformedResult = guard.safeParse(malformedArray, Array(256).fill(null))
        assert.equal(visits, 1)
        assert.equal(malformedResult.error.issues.length, 1)

        for (const [name, schema, value] of [
            [
                'Map',
                zodApi.map(zodApi.string(), zodApi.string()).max(2),
                new Map([
                    ['a', '1'],
                    ['b', '2'],
                    ['c', '3'],
                ]),
            ],
            ['Set', zodApi.set(zodApi.string()).max(2), new Set(['a', 'b', 'c'])],
        ]) {
            const expected = schema.safeParse(value).error.issues[0]
            const actual = guard.safeParse(schema, value).error.issues[0]
            assert.equal(actual.message, expected.message, `${name} boundary message`)
            assert.equal(actual.code, expected.code, `${name} boundary code`)
        }
        assert.equal(
            guard.safeParse(
                zodApi.array(zodApi.string()),
                Array.from({ length: 2048 }, (_, i) => `v${i}`),
            ).success,
            true,
        )
        assert.equal(
            guard.safeParse(
                zodApi.map(zodApi.string(), zodApi.string()).max(2),
                new Map([
                    ['a', '1'],
                    ['b', '2'],
                ]),
            ).success,
            true,
        )
        assert.equal(
            guard.safeParse(zodApi.set(zodApi.string()).max(2), new Set(['a', 'b'])).success,
            true,
        )

        for (const [name, schema, value] of [
            [
                'overwrite before min can increase size',
                zodApi
                    .array(zodApi.string())
                    .overwrite(() => ['x'])
                    .min(1),
                [],
            ],
            [
                'overwrite before min can still leave size invalid',
                zodApi
                    .array(zodApi.string())
                    .overwrite(() => [])
                    .min(1),
                [],
            ],
            [
                'min before overwrite keeps its original order',
                zodApi
                    .array(zodApi.string())
                    .min(1)
                    .overwrite(() => ['x']),
                [],
            ],
        ]) {
            const native = schema.safeParse(value)
            const guarded = guard.safeParse(schema, value)
            assert.equal(guarded.success, native.success, name)
            if (!native.success && !guarded.success) {
                assert.equal(guarded.error.issues[0].message, native.error.issues[0].message, name)
            }
        }

        const defaultCollection = zodApi.array(zodApi.string()).min(1).default([])
        const nativeDefault = defaultCollection.safeParse(undefined)
        const guardedDefault = guard.safeParse(defaultCollection, undefined)
        assert.equal(nativeDefault.success, true, 'Zod 4 defaults bypass inner validation')
        assert.equal(guardedDefault.success, true, 'the preflight preserves Zod 4 default behavior')
        assert.deepEqual(guardedDefault.data, [])

        const prefaultCollection = zodApi.array(zodApi.string()).min(1).prefault([])
        const nativePrefault = prefaultCollection.safeParse(undefined)
        const guardedPrefault = guard.safeParse(prefaultCollection, undefined)
        assert.equal(nativePrefault.success, false, 'prefault values pass through inner validation')
        assert.equal(guardedPrefault.success, false)
        assert.equal(
            guardedPrefault.error.issues[0].message,
            nativePrefault.error.issues[0].message,
        )
    })
})
