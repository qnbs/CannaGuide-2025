// GH #585 / CG-AUD-20261008-045: the ONNX Runtime that @xenova/transformers
// bundles is served same-origin from digest-pinned, lockfile-resolved bytes.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
    readVerifiedTransformersOrtWasm,
    resolveTransformersOrtPackageDir,
    TRANSFORMERS_ORT_DIR,
    TRANSFORMERS_ORT_VERSION,
    TRANSFORMERS_ORT_WASM,
    transformersOrtAssetsPlugin,
} from '../../apps/web/lib/transformersOrtAssets.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const WEB_CONFIG = path.join(ROOT, 'apps/web/vite.config.ts')
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8')
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

/** A fake onnxruntime-web package with small binaries and a manifest matching them. */
function fixturePackage(version = TRANSFORMERS_ORT_VERSION) {
    const dir = mkdtempSync(path.join(tmpdir(), 'ort-fixture-'))
    mkdirSync(path.join(dir, 'dist'))
    writeFileSync(
        path.join(dir, 'package.json'),
        JSON.stringify({ name: 'onnxruntime-web', version }),
    )
    const manifest = {}
    for (const name of Object.keys(TRANSFORMERS_ORT_WASM)) {
        const bytes = Buffer.from(`\0asm fixture ${name}`)
        writeFileSync(path.join(dir, 'dist', name), bytes)
        manifest[name] = { size: bytes.length, sha256: sha256(bytes) }
    }
    return { dir, manifest }
}

test('the installed nested onnxruntime-web matches every pinned digest', (t) => {
    const packageDir = resolveTransformersOrtPackageDir(WEB_CONFIG)
    if (packageDir === null) {
        // Lite installs omit optional ML deps; CI must not skip the pin check.
        // Fail closed: any non-empty CI counts unless it is explicitly falsy.
        assert.ok(
            /^(|0|false|no|off)$/i.test((process.env.CI ?? '').trim()),
            '@xenova/transformers is not installed in CI',
        )
        t.skip('transformers.js not installed (lite install)')
        return
    }
    assert.match(
        packageDir,
        /onnxruntime-web@1\.14\.0/,
        'resolved through transformers.js, not the 1.30 dependency',
    )
    const files = readVerifiedTransformersOrtWasm(packageDir)
    assert.deepEqual([...files.keys()].sort(), Object.keys(TRANSFORMERS_ORT_WASM).sort())
})

test('the pinned version is the one pnpm-lock.yaml resolves for transformers.js', () => {
    const lock = read('pnpm-lock.yaml')
    const snapshot =
        /\n {2}'@xenova\/transformers@2\.17\.2\([^\n]*\)':\n {4}dependencies:\n([\s\S]*?)\n {4}\S/.exec(
            lock,
        )
    assert.ok(snapshot, 'transformers.js snapshot not found in pnpm-lock.yaml')
    assert.match(
        snapshot[1],
        new RegExp(
            `\\n? {6}onnxruntime-web: ${TRANSFORMERS_ORT_VERSION.replaceAll('.', '\\.')}\\b`,
        ),
    )
})

test('a correct fixture verifies', () => {
    const { dir, manifest } = fixturePackage()
    try {
        assert.equal(readVerifiedTransformersOrtWasm(dir, manifest).size, 4)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('one flipped byte, truncation, a missing variant or a re-versioned package fails', () => {
    const cases = [
        [
            'flipped byte',
            (dir) => {
                const file = path.join(dir, 'dist', 'ort-wasm-simd.wasm')
                const bytes = readFileSync(file)
                bytes[bytes.length - 1] ^= 0xff
                writeFileSync(file, bytes)
            },
            /ort-wasm-simd\.wasm sha256 [0-9a-f]{64} != pinned/,
        ],
        [
            'truncated',
            (dir) => {
                const file = path.join(dir, 'dist', 'ort-wasm-threaded.wasm')
                writeFileSync(file, readFileSync(file).subarray(0, 4))
            },
            /ort-wasm-threaded\.wasm is 4 bytes, pinned/,
        ],
        [
            'missing',
            (dir) => rmSync(path.join(dir, 'dist', 'ort-wasm.wasm')),
            /ort-wasm\.wasm is missing/,
        ],
        [
            're-versioned',
            (dir) => {
                writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.14.1' }))
            },
            /resolves onnxruntime-web 1\.14\.1, pinned 1\.14\.0/,
        ],
    ]
    for (const [label, mutate, expected] of cases) {
        const { dir, manifest } = fixturePackage()
        try {
            mutate(dir)
            assert.throws(() => readVerifiedTransformersOrtWasm(dir, manifest), expected, label)
        } finally {
            rmSync(dir, { recursive: true, force: true })
        }
    }
})

/** A throwaway app with a fake transformers.js whose nested ORT holds `bytesFor(name)`. */
function fakeApp(bytesFor) {
    const app = mkdtempSync(path.join(tmpdir(), 'ort-app-'))
    const transformers = path.join(app, 'node_modules/@xenova/transformers')
    const ort = path.join(transformers, 'node_modules/onnxruntime-web')
    mkdirSync(path.join(ort, 'dist'), { recursive: true })
    writeFileSync(
        path.join(transformers, 'package.json'),
        JSON.stringify({ name: '@xenova/transformers', main: 'index.js' }),
    )
    writeFileSync(path.join(transformers, 'index.js'), '')
    writeFileSync(
        path.join(ort, 'package.json'),
        JSON.stringify({ name: 'onnxruntime-web', version: TRANSFORMERS_ORT_VERSION }),
    )
    for (const name of Object.keys(TRANSFORMERS_ORT_WASM))
        writeFileSync(path.join(ort, 'dist', name), bytesFor(name))
    return app
}

function runBuild(plugin) {
    const emitted = []
    plugin.configResolved({ command: 'build' })
    plugin.buildStart.call({})
    plugin.generateBundle.call({ emitFile: (asset) => emitted.push(asset) })
    return emitted
}

test('the build emits the four verified binaries under ort-1.14.0/', (t) => {
    if (resolveTransformersOrtPackageDir(WEB_CONFIG) === null) {
        t.skip('transformers.js not installed (lite install)')
        return
    }
    const emitted = runBuild(transformersOrtAssetsPlugin(WEB_CONFIG))
    assert.deepEqual(
        emitted.map((asset) => asset.fileName).sort(),
        Object.keys(TRANSFORMERS_ORT_WASM)
            .map((name) => `${TRANSFORMERS_ORT_DIR}/${name}`)
            .sort(),
    )
    for (const asset of emitted) {
        const name = path.basename(asset.fileName)
        assert.equal(sha256(asset.source), TRANSFORMERS_ORT_WASM[name].sha256)
    }
})

test('a package whose bytes differ from the pins stops the build at buildStart', () => {
    const app = fakeApp((name) => Buffer.alloc(TRANSFORMERS_ORT_WASM[name].size))
    try {
        const plugin = transformersOrtAssetsPlugin(path.join(app, 'vite.config.ts'))
        plugin.configResolved({ command: 'build' })
        assert.throws(() => plugin.buildStart.call({}), /sha256 [0-9a-f]{64} != pinned/)
    } finally {
        rmSync(app, { recursive: true, force: true })
    }
})

test('without transformers.js the plugin is inert, and dev/vitest never hash eagerly', () => {
    const app = mkdtempSync(path.join(tmpdir(), 'ort-lite-'))
    try {
        assert.deepEqual(
            runBuild(transformersOrtAssetsPlugin(path.join(app, 'vite.config.ts'))),
            [],
        )
        const corrupt = fakeApp(() => Buffer.from('bad'))
        try {
            const plugin = transformersOrtAssetsPlugin(path.join(corrupt, 'vite.config.ts'))
            plugin.configResolved({ command: 'serve' })
            assert.doesNotThrow(() => plugin.buildStart.call({}))
        } finally {
            rmSync(corrupt, { recursive: true, force: true })
        }
    } finally {
        rmSync(app, { recursive: true, force: true })
    }
})

test('the runtime prefix, the build directory and the service-worker route agree', () => {
    const ml = read('packages/ai-core/src/ml.ts')
    const dir = /export const TRANSFORMERS_ORT_WASM_DIR = '([^']+)'/.exec(ml)?.[1]
    assert.equal(dir, `${TRANSFORMERS_ORT_DIR}/`)

    const sw = read('apps/web/public/sw.js')
    const source = /const TRANSFORMERS_ORT_WASM_PATH = \/(.+)\/\n/.exec(sw)?.[1]
    assert.ok(source, 'TRANSFORMERS_ORT_WASM_PATH missing from sw.js')
    const route = new RegExp(source)
    for (const name of Object.keys(TRANSFORMERS_ORT_WASM)) {
        assert.ok(route.test(`/CannaGuide-2025/${TRANSFORMERS_ORT_DIR}/${name}`), name)
    }
    assert.ok(
        !route.test('/assets/ort-wasm-simd-threaded.jsep-ABC.wasm'),
        'the 1.30 asset is not this route',
    )
    assert.ok(
        !route.test(`/${TRANSFORMERS_ORT_DIR}/payload.js`),
        'only wasm takes the cache-first route',
    )
})
