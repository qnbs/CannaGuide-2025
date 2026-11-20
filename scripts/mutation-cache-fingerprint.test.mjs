import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { calculateMutationDependencyFingerprint } from './mutation-cache-fingerprint.mjs'

function createFixture() {
    const root = mkdtempSync(path.join(import.meta.dirname, '.mutation-cache-test-'))
    const web = path.join(root, 'apps/web')
    mkdirSync(path.join(web, 'src'), { recursive: true })
    mkdirSync(path.join(web, 'tests'), { recursive: true })
    mkdirSync(path.join(web, 'public'), { recursive: true })
    mkdirSync(path.join(root, 'packages/ui/src'), { recursive: true })
    writeFileSync(
        path.join(root, 'pnpm-workspace.yaml'),
        "packages:\n  - 'packages/*'\n  - 'apps/*'\n",
    )
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

test('fingerprints exported workspace runtime graphs without unrelated package files', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    const declarations = path.join(packageRoot, 'dist/index.d.ts')
    const mlDeclarations = path.join(packageRoot, 'dist/ml.d.ts')
    const fallbackDeclarations = path.join(packageRoot, 'dist/fallback.d.ts')
    const sideEffectDeclarations = path.join(packageRoot, 'dist/side-effect.d.ts')
    const typeOnlyDeclarations = path.join(packageRoot, 'dist/types.d.ts')
    const declarationMap = `${declarations}.map`
    const runtimeEntry = path.join(packageRoot, 'src/index.ts')
    const mlRuntimeEntry = path.join(packageRoot, 'src/ml.ts')
    const fallbackRuntime = path.join(packageRoot, 'src/fallback.ts')
    const sideEffectRuntime = path.join(packageRoot, 'src/side-effect.ts')
    const typeOnlyRuntime = path.join(packageRoot, 'src/types.ts')
    const transitiveRuntime = path.join(packageRoot, 'src/transitive-runtime.ts')
    const unrelatedRuntime = path.join(packageRoot, 'src/unrelated.ts')
    mkdirSync(path.dirname(declarations), { recursive: true })
    mkdirSync(path.dirname(runtimeEntry), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                '.': { types: './dist/index.d.ts', default: './src/index.ts' },
                './ml': { types: './dist/ml.d.ts', default: './src/ml.ts' },
                './fallback': ['../outside.js', './src/fallback.ts'],
                './types': {
                    types: './dist/types.d.ts',
                    default: './src/types.ts',
                },
                './side-effect': {
                    types: './dist/side-effect.d.ts',
                    default: './src/side-effect.ts',
                },
            },
        }),
    )
    writeFileSync(
        declarations,
        'export declare const value: number\n//# sourceMappingURL=index.d.ts.map\n',
    )
    writeFileSync(
        declarationMap,
        JSON.stringify({
            version: 3,
            file: 'index.d.ts',
            sourceRoot: '',
            sources: ['../src/index.ts'],
            names: [],
            mappings: '',
        }),
    )
    writeFileSync(mlDeclarations, 'export declare const mlValue: number\n')
    writeFileSync(fallbackDeclarations, 'export declare const fallbackValue: number\n')
    writeFileSync(sideEffectDeclarations, 'export declare const sideEffect: number\n')
    writeFileSync(typeOnlyDeclarations, 'export interface RuntimeOptions { enabled: boolean }\n')
    writeFileSync(
        runtimeEntry,
        "import { nested } from './transitive-runtime'\nexport const value = nested\n",
    )
    writeFileSync(mlRuntimeEntry, 'export const mlValue = 2\n')
    writeFileSync(fallbackRuntime, 'export const fallbackValue = 3\n')
    writeFileSync(sideEffectRuntime, 'export const sideEffect = 4\n')
    writeFileSync(typeOnlyRuntime, 'export const runtimeOnly = true\n')
    writeFileSync(transitiveRuntime, 'export const nested = 1\n')
    writeFileSync(unrelatedRuntime, 'export const unrelated = 1\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { value } from '@fixture/runtime'\n" +
            "import { mlValue } from '@fixture/runtime/ml'\n" +
            "import { fallbackValue } from '@fixture/runtime/fallback'\n" +
            "import {} from '@fixture/runtime/side-effect'\n" +
            "import { type RuntimeOptions } from '@fixture/runtime/types'\n" +
            "export { type RuntimeOptions } from '@fixture/runtime/types'\n" +
            'export const target = value + mlValue + fallbackValue\n',
    )

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
        '@fixture/runtime/ml': ['../../packages/runtime/dist/ml.d.ts'],
        '@fixture/runtime/fallback': ['../../packages/runtime/dist/fallback.d.ts'],
        '@fixture/runtime/side-effect': ['../../packages/runtime/dist/side-effect.d.ts'],
        '@fixture/runtime/types': ['../../packages/runtime/dist/types.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const initial = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(initial.files.includes('pnpm-workspace.yaml'))
    assert.ok(initial.files.includes('packages/runtime/package.json'))
    assert.ok(initial.files.includes('packages/runtime/dist/index.d.ts'))
    assert.ok(!initial.files.includes('packages/runtime/dist/index.d.ts.map'))
    assert.ok(initial.files.includes('packages/runtime/src/index.ts'))
    assert.ok(initial.files.includes('packages/runtime/dist/ml.d.ts'))
    assert.ok(initial.files.includes('packages/runtime/src/ml.ts'))
    assert.ok(initial.files.includes('packages/runtime/dist/fallback.d.ts'))
    assert.ok(initial.files.includes('packages/runtime/src/fallback.ts'))
    assert.ok(initial.files.includes('packages/runtime/src/side-effect.ts'))
    assert.ok(!initial.files.includes('packages/runtime/src/types.ts'))
    assert.ok(initial.files.includes('packages/runtime/src/transitive-runtime.ts'))
    assert.ok(!initial.files.includes('packages/runtime/src/unrelated.ts'))

    writeFileSync(transitiveRuntime, 'export const nested = 2\n')
    const changedRuntime = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedRuntime.fingerprint, initial.fingerprint)

    writeFileSync(sideEffectRuntime, 'export const sideEffect = 5\n')
    const changedSideEffect = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.notEqual(changedSideEffect.fingerprint, changedRuntime.fingerprint)

    writeFileSync(unrelatedRuntime, 'export const unrelated = 2\n')
    const changedUnrelated = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.equal(changedUnrelated.fingerprint, changedSideEffect.fingerprint)

    tsconfig.compilerOptions.verbatimModuleSyntax = true
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))
    const verbatimTypeImport = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(verbatimTypeImport.files.includes('packages/runtime/src/types.ts'))
})

test('does not treat declaration-file re-exports as runtime loads', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const runtimeRoot = path.join(root, 'packages/runtime')
    const typesRoot = path.join(root, 'packages/types')
    mkdirSync(path.join(runtimeRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(runtimeRoot, 'src'), { recursive: true })
    mkdirSync(path.join(typesRoot, 'dist'), { recursive: true })
    writeFileSync(
        path.join(runtimeRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: { '.': { types: './dist/index.d.ts', default: './src/index.ts' } },
        }),
    )
    writeFileSync(
        path.join(typesRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/types',
            exports: { '.': { types: './dist/index.d.ts' } },
        }),
    )
    writeFileSync(path.join(runtimeRoot, 'dist/index.d.ts'), "export * from '@fixture/types'\n")
    writeFileSync(
        path.join(typesRoot, 'dist/index.d.ts'),
        'export interface RuntimeOptions { enabled: boolean }\n',
    )
    writeFileSync(path.join(runtimeRoot, 'src/index.ts'), 'export const runtime = true\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import type { RuntimeOptions } from '@fixture/runtime'\n" +
            'export type TargetOptions = RuntimeOptions\n',
    )

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
        '@fixture/types': ['../../packages/types/dist/index.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('packages/runtime/dist/index.d.ts'))
    assert.ok(result.files.includes('packages/types/dist/index.d.ts'))
    assert.ok(!result.files.includes('packages/runtime/src/index.ts'))
})

test('selects import and require export conditions according to actual Node resolution', async (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                '.': {
                    types: './dist/index.d.ts',
                    import: './src/import.mjs',
                    require: './src/require.cjs',
                    default: './src/default.mjs',
                },
            },
        }),
    )
    writeFileSync(path.join(packageRoot, 'dist/index.d.ts'), 'export declare const kind: string\n')
    const importTarget = path.join(packageRoot, 'src/import.mjs')
    const requireTarget = path.join(packageRoot, 'src/require.cjs')
    writeFileSync(importTarget, "export const kind = 'import'\n")
    writeFileSync(requireTarget, "exports.kind = 'require'\n")

    const scopedPackages = path.join(root, 'node_modules/@fixture')
    mkdirSync(scopedPackages, { recursive: true })
    symlinkSync(packageRoot, path.join(scopedPackages, 'runtime'), 'dir')
    const esmConsumer = path.join(source, 'runtime-consumer.mjs')
    const cjsConsumer = path.join(source, 'runtime-consumer.cjs')
    writeFileSync(esmConsumer, "export { kind } from '@fixture/runtime'\n")
    writeFileSync(cjsConsumer, "module.exports = require('@fixture/runtime').kind\n")

    const esm = await import(pathToFileURL(esmConsumer).href)
    assert.equal(esm.kind, 'import')
    assert.equal(createRequire(cjsConsumer)(cjsConsumer), 'require')

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const target = path.join(source, 'target.ts')
    writeFileSync(target, "import { kind } from '@fixture/runtime'\nvoid kind\n")
    const esmFingerprint = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(esmFingerprint.files.includes('packages/runtime/src/import.mjs'))
    assert.ok(!esmFingerprint.files.includes('packages/runtime/src/require.cjs'))

    writeFileSync(target, "const { kind } = require('@fixture/runtime')\nvoid kind\n")
    const cjsFingerprint = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(cjsFingerprint.files.includes('packages/runtime/src/require.cjs'))
    assert.ok(!cjsFingerprint.files.includes('packages/runtime/src/import.mjs'))
})

test('resolves workspace packages that declare only a require export for CommonJS', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                '.': {
                    types: './dist/index.d.ts',
                    require: './src/only.cjs',
                },
            },
        }),
    )
    writeFileSync(path.join(packageRoot, 'dist/index.d.ts'), 'export declare const value: number\n')
    writeFileSync(path.join(packageRoot, 'src/only.cjs'), 'exports.value = 1\n')

    const scopedPackages = path.join(root, 'node_modules/@fixture')
    mkdirSync(scopedPackages, { recursive: true })
    symlinkSync(packageRoot, path.join(scopedPackages, 'runtime'), 'dir')

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    writeFileSync(
        path.join(source, 'target.ts'),
        "const { value } = require('@fixture/runtime')\nvoid value\n",
    )
    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('packages/runtime/src/only.cjs'))
})

test('falls back to sibling default when nested require condition has no match', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                '.': {
                    types: './dist/index.d.ts',
                    require: {
                        'custom-platform': './src/custom.cjs',
                    },
                    default: './src/fallback.cjs',
                },
            },
        }),
    )
    writeFileSync(path.join(packageRoot, 'dist/index.d.ts'), 'export declare const kind: string\n')
    writeFileSync(path.join(packageRoot, 'src/custom.cjs'), "exports.kind = 'custom'\n")
    writeFileSync(path.join(packageRoot, 'src/fallback.cjs'), "exports.kind = 'fallback'\n")

    const scopedPackages = path.join(root, 'node_modules/@fixture')
    mkdirSync(scopedPackages, { recursive: true })
    symlinkSync(packageRoot, path.join(scopedPackages, 'runtime'), 'dir')

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    writeFileSync(
        path.join(source, 'target.ts'),
        "const { kind } = require('@fixture/runtime')\nvoid kind\n",
    )
    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('packages/runtime/src/fallback.cjs'))
    assert.ok(!result.files.includes('packages/runtime/src/custom.cjs'))
})

test('fails closed when a runtime package import resolves only to declarations', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            imports: {
                '#internal': { types: './dist/internal.d.ts', default: './src/internal.js' },
            },
            exports: { '.': { types: './dist/index.d.ts', default: './src/index.ts' } },
        }),
    )
    writeFileSync(path.join(packageRoot, 'dist/index.d.ts'), 'export declare const value: number\n')
    writeFileSync(
        path.join(packageRoot, 'dist/internal.d.ts'),
        'export declare const internal: number\n',
    )
    writeFileSync(
        path.join(packageRoot, 'src/index.ts'),
        "import { internal } from '#internal'\nexport const value = internal\n",
    )
    writeFileSync(path.join(packageRoot, 'src/internal.js'), 'export const internal = 1\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { value } from '@fixture/runtime'\nvoid value\n",
    )

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
        '#internal': ['../../packages/runtime/dist/internal.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Could not resolve first-party imports:[\s\S]*#internal/,
    )
})

test('does not fall through to a later export when the first valid target file is missing', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: { '.': ['./dist/missing.js', './src/available-fallback.ts'] },
        }),
    )
    writeFileSync(path.join(packageRoot, 'dist/types.d.ts'), 'export declare const value: number\n')
    writeFileSync(path.join(packageRoot, 'src/available-fallback.ts'), 'export const value = 6\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { value } from '@fixture/runtime'\nvoid value\n",
    )

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/types.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))
    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /@fixture\/runtime runtime export \.\/dist\/missing\.js/,
    )
})

test('refreshes workspace package discovery between fingerprint calculations', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    writeFileSync(path.join(packageRoot, 'dist/index.d.ts'), 'export declare const value: number\n')
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { value } from '@fixture/runtime'\nvoid value\n",
    )
    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/index.d.ts'],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const beforeWorkspacePackage = calculateMutationDependencyFingerprint({ repoRoot: root })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: { '.': { types: './dist/index.d.ts', default: './src/index.ts' } },
        }),
    )
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(path.join(packageRoot, 'src/index.ts'), 'export const value = 7\n')

    const afterWorkspacePackage = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(afterWorkspacePackage.files.includes('packages/runtime/src/index.ts'))
    assert.notEqual(afterWorkspacePackage.fingerprint, beforeWorkspacePackage.fingerprint)
})

test('uses the longest export-pattern prefix before wildcard pattern length', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'dist/wrong.d.ts'),
        'export declare const selected: boolean\n',
    )
    mkdirSync(path.join(packageRoot, 'src/features'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                './features/*': {
                    types: './dist/features/*.d.ts',
                    default: './src/feature-*.ts',
                },
                './*special-long-suffix': {
                    types: './dist/wrong.d.ts',
                    default: './src/features/*-special-long-suffix.ts',
                },
            },
        }),
    )
    writeFileSync(
        path.join(packageRoot, 'src/feature-aspecial-long-suffix.ts'),
        'export const selected = true\n',
    )
    writeFileSync(
        path.join(packageRoot, 'src/features/a-special-long-suffix.ts'),
        'export const notSelected = true\n',
    )
    writeFileSync(
        path.join(source, 'target.ts'),
        "import { selected } from '@fixture/runtime/features/aspecial-long-suffix'\nvoid selected\n",
    )

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime/features/aspecial-long-suffix': [
            '../../packages/runtime/dist/wrong.d.ts',
        ],
    }
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('packages/runtime/src/feature-aspecial-long-suffix.ts'))
    assert.ok(!result.files.includes('packages/runtime/src/features/a-special-long-suffix.ts'))
})

test('ignores inactive Node export conditions for the browser test runtime', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))

    const packageRoot = path.join(root, 'packages/runtime')
    mkdirSync(path.join(packageRoot, 'dist'), { recursive: true })
    mkdirSync(path.join(packageRoot, 'src'), { recursive: true })
    writeFileSync(
        path.join(packageRoot, 'package.json'),
        JSON.stringify({
            name: '@fixture/runtime',
            exports: {
                '.': {
                    node: './dist/node-only-missing.js',
                    browser: './src/browser.ts',
                    default: './src/default.ts',
                },
            },
        }),
    )
    writeFileSync(path.join(packageRoot, 'src/browser.ts'), 'export const runtime = "browser"\n')
    writeFileSync(path.join(packageRoot, 'src/default.ts'), 'export const runtime = "default"\n')
    writeFileSync(path.join(source, 'target.ts'), "import '@fixture/runtime'\n")

    const tsconfigPath = path.join(root, 'apps/web/tsconfig.json')
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
    tsconfig.compilerOptions.baseUrl = '.'
    tsconfig.compilerOptions.paths = {
        '@fixture/runtime': ['../../packages/runtime/dist/types.d.ts'],
    }
    writeFileSync(path.join(packageRoot, 'dist/types.d.ts'), 'export {}\n')
    writeFileSync(tsconfigPath, JSON.stringify(tsconfig))

    const result = calculateMutationDependencyFingerprint({ repoRoot: root })
    assert.ok(result.files.includes('packages/runtime/src/browser.ts'))
    assert.ok(!result.files.includes('packages/runtime/src/default.ts'))
})

test('fails closed on unsupported pnpm workspace glob patterns', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(path.join(source, 'target.ts'), 'export const target = true\n')
    writeFileSync(
        path.join(root, 'pnpm-workspace.yaml'),
        "packages:\n  - 'packages/[ab]/*'\n  - 'apps/*'\n",
    )

    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Unsupported pnpm workspace pattern for runtime fingerprinting: packages\/\[ab\]\/\*/,
    )
})

test('fingerprints filesystem fixtures and dynamic source scans used by tests', (t) => {
    const { root, source } = createFixture()
    t.after(() => rmSync(root, { recursive: true, force: true }))
    writeFileSync(
        path.join(source, 'target.ts'),
        'const appOrigin = () => globalThis.location?.origin\n' +
            "const scopeUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin)\n" +
            "const workerUrl = new URL('sw.js', scopeUrl)\n" +
            'const transformerUrl = new URL(`${import.meta.env.BASE_URL}ort/`, location.href)\n' +
            'const describedDestination = new URL(destination, globalThis.location?.origin)\n' +
            'const parsedDestination = new URL(destination, appOrigin())\n' +
            'export const target = workerUrl.pathname\n',
    )
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

    writeFileSync(
        path.join(source, 'target.ts'),
        "export const assetUrl = new URL('./asset.svg', dynamicBase)\n",
    )
    assert.throws(
        () => calculateMutationDependencyFingerprint({ repoRoot: root }),
        /Dynamic first-party module loading needs explicit fingerprint support/,
    )

    writeFileSync(
        path.join(source, 'target.ts'),
        'const assetUrl = new URL(`./assets/${name}.svg`, import.meta.url)\n',
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
            "export const unbasedUrl = new URL('./not-module-relative.svg')\n" +
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
