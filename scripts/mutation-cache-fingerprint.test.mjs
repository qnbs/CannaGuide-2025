import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { calculateMutationDependencyFingerprint } from './mutation-cache-fingerprint.mjs'

function createFixture() {
    const root = mkdtempSync(path.join(import.meta.dirname, '.mutation-cache-test-'))
    const web = path.join(root, 'apps/web')
    mkdirSync(path.join(web, 'src'), { recursive: true })
    mkdirSync(path.join(web, 'tests'), { recursive: true })
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
            'export const value = dependency.value\n',
    )
    writeFileSync(path.join(source, 'legacy-dependency.ts'), 'export const value = true\n')
    writeFileSync(path.join(source, 'asset.svg'), '<svg />\n')

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/src/legacy-dependency.ts'))
    assert.ok(result.files.includes('apps/web/src/asset.svg'))
})

test('fingerprints statically matched Vite glob modules', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const strains = path.join(root, 'apps/web/data/strains')
    mkdirSync(strains, { recursive: true })
    writeFileSync(
        path.join(source, 'target.ts'),
        "export const modules = import.meta.glob('../data/strains/*.ts')\n",
    )
    writeFileSync(path.join(strains, 'a.ts'), 'export const a = true\n')
    writeFileSync(path.join(strains, 'b.ts'), 'export const b = true\n')

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('apps/web/data/strains/a.ts'))
    assert.ok(result.files.includes('apps/web/data/strains/b.ts'))
})
