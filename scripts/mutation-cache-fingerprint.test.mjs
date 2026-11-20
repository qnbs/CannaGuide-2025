import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { calculateMutationDependencyFingerprint } from './mutation-cache-fingerprint.mjs'

function createFixture() {
    const root = mkdtempSync(path.join(import.meta.dirname, '.mutation-cache-test-'))
    const web = path.join(root, 'apps/web')
    mkdirSync(path.join(web, 'src'), { recursive: true })
    writeFileSync(
        path.join(root, 'stryker.conf.json'),
        JSON.stringify({ mutate: ['src/**/*.ts', '!src/**/*.test.ts'] }),
    )
    writeFileSync(
        path.join(web, 'tsconfig.json'),
        JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' } }),
    )
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

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('apps/web/src/nested.ts'))

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
        "export const loadModules = import.meta.glob('./modules/*.ts')\n",
    )
    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )
})
