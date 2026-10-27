import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    ORT_VERSION,
    ORT_WASM_CDN_BASE,
    ORT_WASM_FILE,
    ORT_WASM_SRI,
    ORT_WASM_URL,
} from '@cannaguide/ai-core/ml'

/**
 * onnxruntime-web ships its JS and its `.wasm` as one build. They are not
 * interchangeable across versions, so `ORT_WASM_CDN_BASE` must name the version
 * actually resolved for the direct dependency -- otherwise inference loads a
 * mismatched binary and fails at runtime, in a worker, where nobody sees it.
 *
 * Not hypothetical: two workers pinned
 * `cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/` by hand while the package
 * resolved to 1.27.0. Nothing caught it -- the pin is a string, the mismatch has
 * no type, and the affected paths only run when a user starts local inference.
 *
 * Read from pnpm-lock.yaml rather than by importing onnxruntime-web. The import
 * would be a PHANTOM DEPENDENCY: onnxruntime-web is declared by
 * @cannaguide/ai-core, not by @cannaguide/web, so requiring it from this
 * workspace resolves only through hoisting -- which `check:phantom-deps`
 * correctly rejects. The lockfile is also the more honest source: it states what
 * is installed, not what happens to be reachable.
 */
describe('ORT wasm CDN pin', () => {
    const repoRoot = path.resolve(import.meta.dirname, '../../../..')

    /** The version pnpm resolved for ai-core's direct `onnxruntime-web`. */
    const resolvedOrtVersion = (): string | null => {
        const lock = readFileSync(path.join(repoRoot, 'pnpm-lock.yaml'), 'utf8')

        // Importer block for packages/ai-core, up to the next importer.
        const importer = /\n {2}packages\/ai-core:\n([\s\S]*?)(?=\n {2}\S|\n[^\s])/.exec(lock)
        const importerBlock = importer?.[1]
        if (!importerBlock) return null

        // `onnxruntime-web:` then its `version:` line. Deliberately scoped to the
        // importer block: transformers.js pulls in a SECOND onnxruntime-web
        // (1.14.0, nested), and matching that one would assert the wrong thing.
        const entry =
            /\n\s+onnxruntime-web:\n\s+specifier:[^\n]*\n\s+version:\s*([0-9][^\s(]*)/.exec(
                importerBlock,
            )
        return entry?.[1] ?? null
    }

    it('matches the version resolved for ai-core in pnpm-lock.yaml', () => {
        const resolved = resolvedOrtVersion()
        expect(resolved, 'onnxruntime-web not found in the ai-core importer block').not.toBeNull()
        expect(ORT_VERSION).toBe(resolved)
    })

    it('builds a jsDelivr URL for that exact version', () => {
        expect(ORT_WASM_CDN_BASE).toBe(
            `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`,
        )
    })

    it('is an absolute https URL with a trailing slash', () => {
        // ORT concatenates the file name onto this base, so a missing trailing
        // slash silently produces `.../distort-wasm...` and a 404.
        expect(ORT_WASM_CDN_BASE).toMatch(/^https:\/\//)
        expect(ORT_WASM_CDN_BASE.endsWith('/')).toBe(true)
    })

    /**
     * The installed package's dist/, read as files (not imported, see above).
     * jsDelivr serves the npm tarball unchanged, so these bytes are the CDN bytes.
     * Null when onnxruntime-web is not installed.
     */
    const installedOrtDist = ((): string | null => {
        const store = path.join(repoRoot, 'node_modules/.pnpm')
        let names: string[]
        try {
            names = readdirSync(store)
        } catch {
            return null
        }
        const entry = names.find((name) => name.startsWith(`onnxruntime-web@${ORT_VERSION}`))
        return entry ? path.join(store, entry, 'node_modules/onnxruntime-web/dist') : null
    })()

    /**
     * Lite installs (`--no-optional`, see ai-core's ml-stubs.d.ts) omit the
     * package, so there is no binary to hash and these checks skip. Never in CI:
     * there a missing package would turn the digest gate off without a failure.
     */
    const binaryChecks = installedOrtDist !== null || process.env['CI'] === 'true'

    it.runIf(binaryChecks)('finds the installed onnxruntime-web package', () => {
        expect(installedOrtDist, `onnxruntime-web@${ORT_VERSION} is not installed`).not.toBeNull()
    })

    it.runIf(binaryChecks)('pins the integrity digest of the installed wasm binary', () => {
        const bytes = readFileSync(path.join(installedOrtDist ?? '', ORT_WASM_FILE))
        const digest = `sha256-${createHash('sha256').update(bytes).digest('base64')}`
        expect(ORT_WASM_SRI).toBe(digest)
        expect(ORT_WASM_URL).toBe(`${ORT_WASM_CDN_BASE}${ORT_WASM_FILE}`)
    })

    it.runIf(binaryChecks)(
        'names the binary that the browser entry of onnxruntime-web runs',
        () => {
            // `import('onnxruntime-web')` resolves to ort.bundle.min.mjs in a browser.
            // If a version switches that bundle to another binary, the pinned digest
            // would verify a file ORT never uses.
            const bundle = readFileSync(
                path.join(installedOrtDist ?? '', 'ort.bundle.min.mjs'),
                'utf8',
            )
            const binaries = [...new Set(bundle.match(/ort-wasm[\w.-]*\.wasm/g))]
            expect(binaries).toEqual([ORT_WASM_FILE])
        },
    )
})
