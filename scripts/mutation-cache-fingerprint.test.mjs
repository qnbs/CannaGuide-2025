import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { calculateMutationDependencyFingerprint } from './mutation-cache-fingerprint.mjs'

function createFixture() {
    const root = mkdtempSync(path.join(import.meta.dirname, '.mutation-cache-test-'))
    const web = path.join(root, 'apps/web')
    mkdirSync(path.join(web, 'src'), { recursive: true })
    mkdirSync(path.join(web, 'tests'), { recursive: true })
    mkdirSync(path.join(web, 'public'), { recursive: true })
    mkdirSync(path.join(root, 'packages/ui/src'), { recursive: true })
    writeFileSync(path.join(web, 'public/manifest.json'), '{"name":"fixture"}\n')
    writeFileSync(path.join(root, 'packages/ui/src/tokens.css'), ':root {}\n')
    writeFileSync(
        path.join(root, 'stryker.conf.json'),
        JSON.stringify({
            mutate: ['src/target.ts'],
            testFiles: ['tests/**/*.test.ts'],
            vitest: { configFile: 'vite.config.ts' },
        }),
    )
    writeFileSync(
        path.join(web, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' } }),
    )
    writeFileSync(path.join(web, 'vite.config.ts'), "import './config-helper'\n")
    writeFileSync(path.join(web, 'config-helper.ts'), 'export const configured = true\n')
    writeFileSync(path.join(web, 'vitest.setup.ts'), "import './setup-helper'\n")
    writeFileSync(path.join(web, 'setup-helper.ts'), 'export const setup = true\n')
    return { root, source: path.join(web, 'src') }
}

test('fingerprint follows transitive dependencies and newly added imports', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    writeFileSync(
        path.join(source, 'target.ts'),
        "import { first } from './first'\nexport const target = first\n",
    )
    writeFileSync(
        path.join(source, 'first.ts'),
        "import { nested } from './nested'\nexport const first = nested\n",
    )
    writeFileSync(path.join(source, 'nested.ts'), 'export const nested = 1\n')
    writeFileSync(
        path.join(root, 'apps/web/tests/example.test.ts'),
        "import { fixture } from './test-utils'\nvoid fixture\n",
    )
    writeFileSync(
        path.join(root, 'apps/web/tests/test-utils.ts'),
        "import { fixtureValue } from './nested-test-helper'\nexport const fixture = fixtureValue\n",
    )
    writeFileSync(
        path.join(root, 'apps/web/tests/nested-test-helper.ts'),
        'export const fixtureValue = 1\n',
    )

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('apps/web/src/nested.ts'))
    assert.ok(initial.files.includes('apps/web/tests/nested-test-helper.ts'))
    assert.ok(initial.files.includes('apps/web/config-helper.ts'))
    assert.ok(initial.files.includes('apps/web/setup-helper.ts'))

    writeFileSync(path.join(source, 'nested.ts'), 'export const nested = 2\n')
    const changedTransitiveSource = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedTransitiveSource.fingerprint, initial.fingerprint)

    writeFileSync(path.join(source, 'extra.ts'), 'export const extra = 3\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { first } from './first'\nimport { extra } from './extra'\nexport const target = first + extra\n",
    )
    const changedImportGraph = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(changedImportGraph.files.includes('apps/web/src/extra.ts'))
    assert.notEqual(changedImportGraph.fingerprint, changedTransitiveSource.fingerprint)
})

test('fingerprints filesystem fixtures and dynamic source scans used by tests', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(path.join(source, 'target.ts'), 'export const target = true\n')
    const serviceWorker = path.join(root, 'apps/web/public/sw.js')
    writeFileSync(serviceWorker, 'self.fixture = true\n')

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('apps/web/public/sw.js'))
    assert.ok(initial.files.includes('apps/web/public/manifest.json'))
    assert.ok(initial.files.includes('packages/ui/src/tokens.css'))

    const newScannedSource = path.join(root, 'apps/web/services/databaseNames.ts')
    mkdirSync(path.dirname(newScannedSource), { recursive: true })
    writeFileSync(newScannedSource, "export const databaseName = 'first'\n")
    const withNewSource = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(withNewSource.files.includes('apps/web/services/databaseNames.ts'))
    assert.notEqual(withNewSource.fingerprint, initial.fingerprint)

    for (const file of [
        serviceWorker,
        path.join(root, 'apps/web/public/manifest.json'),
        path.join(root, 'packages/ui/src/tokens.css'),
        newScannedSource,
    ]) {
        const before = readFileSync(file, 'utf8')
        writeFileSync(file, `${before}/* changed fixture */\n`)
        const changed = calculateMutationDependencyFingerprint({ repoRoot: root })
        assert.notEqual(
            changed.fingerprint,
            withNewSource.fingerprint,
            `${file} was not fingerprinted`,
        )
        writeFileSync(file, before)
    }
})

test('fails closed when a first-party import cannot be resolved', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "import './missing'\nexport const target = true\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Could not resolve first-party imports/,
    )
})

test('fails closed when a target uses dynamic module discovery', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "const modulePath = './nested'\nexport const load = () => import(modulePath)\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )

    writeFileSync(
        path.join(source, 'target.ts'),
        "const globPattern = './modules/*.ts'\nexport const loadModules = import.meta.glob(globPattern)\n",
    )
    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
})

test('fails closed when Vite glob syntax or options are unsupported', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    mkdirSync(path.join(source, 'modules'), { recursive: true })
    writeFileSync(path.join(source, 'modules/helper.ts'), 'export const helper = true\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const modules = import.meta.glob('./modules/*.{ts,tsx}')\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const modules = import.meta.glob('./*.ts', { base: './plugins' })\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
})

test('fingerprints every literal importScripts argument and rejects dynamic ones', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(path.join(source, 'target.ts'), "importScripts('./first.js', './second.js')\n")
    writeFileSync(path.join(source, 'first.js'), 'globalThis.first = true\n')
    writeFileSync(path.join(source, 'second.js'), 'globalThis.second = true\n')

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/src/first.js'))
    assert.ok(result.files.includes('apps/web/src/second.js'))

    writeFileSync(
        path.join(source, 'target.ts'),
        "const dynamicPath = './second.js'\nimportScripts('./first.js', dynamicPath)\n",
    )
    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
})

test('fingerprints literal import type dependencies', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "export type Imported = import('./type-dependency').Imported\n",
    )
    writeFileSync(
        path.join(source, 'type-dependency.ts'),
        'export interface Imported { value: string }\n',
    )

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/src/type-dependency.ts'))
})

test('fingerprints import-equals and relative URL dependencies', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "import dependency = require('./legacy-dependency')\n" +
            "export const assetUrl = new URL('./asset.svg', import.meta.url)\n" +
            "export const bareAssetUrl = new URL('bare-asset.svg', import.meta.url)\n" +
            "export const remoteUrl = new URL('./health', 'https://api.example.test/')\n" +
            'export const value = dependency.value\n',
    )
    writeFileSync(path.join(source, 'legacy-dependency.ts'), 'export const value = true\n')
    writeFileSync(path.join(source, 'asset.svg'), '<svg />\n')
    const bareAsset = path.join(source, 'bare-asset.svg')
    writeFileSync(bareAsset, '<svg><title>first</title></svg>\n')

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/src/legacy-dependency.ts'))
    assert.ok(result.files.includes('apps/web/src/asset.svg'))
    assert.ok(result.files.includes('apps/web/src/bare-asset.svg'))
    assert.ok(!result.files.includes('apps/web/src/health'))

    writeFileSync(bareAsset, '<svg><title>changed</title></svg>\n')
    const changedBareAsset = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedBareAsset.fingerprint, result.fingerprint)
})

test('fails closed for relative URLs with an unknown base', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const assetUrl = new URL('./asset.svg', dynamicBase)\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
})

test('fingerprints runtime implementations paired with declarations', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { value } from './legacy.js'\nexport const result = value\n",
    )
    writeFileSync(path.join(source, 'legacy.d.ts'), 'export declare const value: number\n')
    const runtimeFile = path.join(source, 'legacy.js')
    writeFileSync(runtimeFile, 'export const value = 1\n')

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('apps/web/src/legacy.d.ts'))
    assert.ok(initial.files.includes('apps/web/src/legacy.js'))

    writeFileSync(runtimeFile, 'export const value = 2\n')
    const changedRuntime = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedRuntime.fingerprint, initial.fingerprint)
})

test('fingerprints modern module runtime implementations paired with declarations', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(path.join(source, 'target.ts'), "import './modern.mjs'\nimport './common.cjs'\n")
    writeFileSync(path.join(source, 'modern.d.mts'), 'export {}\n')
    writeFileSync(path.join(source, 'modern.mjs'), 'export const modern = true\n')
    writeFileSync(path.join(source, 'common.d.cts'), 'export {}\n')
    writeFileSync(path.join(source, 'common.cjs'), 'exports.common = true\n')

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/src/modern.d.mts'))
    assert.ok(result.files.includes('apps/web/src/modern.mjs'))
    assert.ok(result.files.includes('apps/web/src/common.d.cts'))
    assert.ok(result.files.includes('apps/web/src/common.cjs'))
})

test('fingerprints code and data files statically matched by Vite globs', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const strains = path.join(root, 'apps/web/data/strains')
    const catalog = path.join(root, 'apps/web/data/catalog')
    const assets = path.join(root, 'apps/web/data/assets')
    const nestedAssetDirectory = path.join(assets, 'nested/deeper')
    mkdirSync(strains, { recursive: true })
    mkdirSync(catalog, { recursive: true })
    mkdirSync(nestedAssetDirectory, { recursive: true })
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const modules = import.meta.glob(['../data/strains/*.ts', '../data/catalog/*.json', '../data/assets/*.js', '../data/assets/*.svg', '../data/assets/**/*'])\n",
    )
    writeFileSync(path.join(strains, 'a.ts'), 'export const a = true\n')
    writeFileSync(path.join(strains, 'b.ts'), 'export const b = true\n')
    const catalogFile = path.join(catalog, 'entry.json')
    writeFileSync(catalogFile, '{"name":"first"}\n')
    const minifiedFile = path.join(assets, 'plugin.min.js')
    writeFileSync(minifiedFile, 'globalThis.plugin = 1\n')
    writeFileSync(path.join(assets, 'icon.svg'), '<svg />\n')
    const nestedAsset = path.join(nestedAssetDirectory, 'deep-icon.svg')
    writeFileSync(nestedAsset, '<svg><title>nested</title></svg>\n')

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('apps/web/data/strains/a.ts'))
    assert.ok(initial.files.includes('apps/web/data/strains/b.ts'))
    assert.ok(initial.files.includes('apps/web/data/catalog/entry.json'))
    assert.ok(initial.files.includes('apps/web/data/assets/plugin.min.js'))
    assert.ok(initial.files.includes('apps/web/data/assets/icon.svg'))
    assert.ok(initial.files.includes('apps/web/data/assets/nested/deeper/deep-icon.svg'))
    assert.ok(!initial.files.includes('apps/web/data/assets/nested'))
    assert.ok(!initial.files.includes('apps/web/data/assets/nested/deeper'))

    writeFileSync(catalogFile, '{"name":"changed"}\n')
    const changedJson = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedJson.fingerprint, initial.fingerprint)

    writeFileSync(minifiedFile, 'globalThis.plugin = 2\n')
    const changedMinified = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedMinified.fingerprint, changedJson.fingerprint)
})

test('treats literal Vite glob entries as exact filesystem matches', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const modules = path.join(root, 'packages/ui/src/modules')
    mkdirSync(modules, { recursive: true })
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const modules = import.meta.glob('../../../packages/ui/src/modules/plugin.js')\n",
    )
    writeFileSync(path.join(modules, 'plugin.ts'), 'export const plugin = "typed"\n')
    const exactMatch = path.join(modules, 'plugin.js')
    writeFileSync(exactMatch, 'export const plugin = "runtime"\n')

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('packages/ui/src/modules/plugin.js'))
    assert.ok(!initial.files.includes('packages/ui/src/modules/plugin.ts'))

    writeFileSync(exactMatch, 'export const plugin = "changed"\n')
    const changed = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changed.fingerprint, initial.fingerprint)
})
