import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { ORT_VERSION, ORT_WASM_CDN_BASE } from '@cannaguide/ai-core/ml'

/**
 * onnxruntime-web ships its JS and its `.wasm` as one build. They are not
 * interchangeable across versions, so `ORT_WASM_CDN_BASE` must name the version
 * that is actually installed -- otherwise inference loads a mismatched binary and
 * fails at runtime, in a worker, where nobody sees it.
 *
 * This is not hypothetical. Two workers pinned
 * `cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/` by hand while the package
 * resolved to 1.27.0. Nothing caught it: the pin is a string, the mismatch has no
 * type, and the affected code paths only run when a user starts local inference.
 *
 * The point of this test is that the pin can no longer drift silently -- a
 * dependency bump that forgets the constant fails here instead of in production.
 */
describe('ORT wasm CDN pin', () => {
    const require = createRequire(import.meta.url)

    it('matches the installed onnxruntime-web version', () => {
        let installed: string
        try {
             
            installed = (require('onnxruntime-web/package.json') as { version: string }).version
        } catch {
            // onnxruntime-web is an optionalDependency (ai-core), so a lite install
            // legitimately lacks it. Skipping beats failing on an absent optional
            // dep -- but only when it is genuinely absent, never when it mismatches.
            return
        }

        expect(ORT_VERSION).toBe(installed)
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
