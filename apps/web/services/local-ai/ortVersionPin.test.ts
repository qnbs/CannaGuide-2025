import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ORT_VERSION, ORT_WASM_CDN_BASE } from '@cannaguide/ai-core/ml'

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
        if (!importer) return null

        // `onnxruntime-web:` then its `version:` line. Deliberately scoped to the
        // importer block: transformers.js pulls in a SECOND onnxruntime-web
        // (1.14.0, nested), and matching that one would assert the wrong thing.
        const entry = /\n\s+onnxruntime-web:\n\s+specifier:[^\n]*\n\s+version:\s*([0-9][^\s(]*)/.exec(
            importer[1],
        )
        return entry ? entry[1] : null
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
})
