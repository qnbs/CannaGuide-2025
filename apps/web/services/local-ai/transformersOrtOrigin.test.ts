import { beforeEach, describe, expect, it, vi } from 'vitest'

// transformers.js points its nested onnxruntime-web 1.14 at jsDelivr when it
// loads; loadTransformers must replace that with the same-origin, digest-pinned
// copy before any pipeline can start an ORT session (GH #585).

const CDN_DEFAULT = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/'
const transformersEnv = vi.hoisted(() => ({
    backends: { onnx: { wasm: {} as Record<string, unknown> } } as
        Record<string, unknown> | undefined,
}))
vi.mock('@xenova/transformers', () => ({ env: transformersEnv, pipeline: vi.fn() }))

import {
    TRANSFORMERS_ORT_WASM_DIR,
    loadTransformers,
    transformersOrtWasmPrefix,
} from '@cannaguide/ai-core/ml'

describe('transformers.js ONNX runtime origin', () => {
    beforeEach(() => {
        transformersEnv.backends = { onnx: { wasm: { wasmPaths: CDN_DEFAULT } } }
    })

    it('replaces the jsDelivr default with the same-origin copy under the app base', async () => {
        const mod = await loadTransformers()
        const wasmPaths = (mod.env.backends?.onnx?.wasm as { wasmPaths?: string }).wasmPaths

        expect(wasmPaths).toBe(
            new URL(`${import.meta.env.BASE_URL}${TRANSFORMERS_ORT_WASM_DIR}`, location.href).href,
        )
        expect(wasmPaths).not.toContain('jsdelivr')
        expect(new URL(wasmPaths ?? '').origin).toBe(location.origin)
    })

    it('never probes the app origin for local models', async () => {
        // Vercel and Cloudflare answer /models/<repo>/config.json with the SPA
        // fallback (200 text/html), which transformers.js then parses as the
        // model config. The app ships no transformers.js models of its own.
        ;(transformersEnv as Record<string, unknown>).allowLocalModels = true
        const mod = await loadTransformers()
        expect(mod.env.allowLocalModels).toBe(false)
    })

    it('refuses to hand back a module still aimed at the CDN', async () => {
        transformersEnv.backends = undefined
        await expect(loadTransformers()).rejects.toThrow(/refusing the CDN default/)
    })

    it('keeps the GitHub Pages subpath and resolves from a worker or blob-proxy context', () => {
        expect(
            transformersOrtWasmPrefix(
                '/CannaGuide-2025/',
                'https://qnbs.github.io/CannaGuide-2025/',
            ),
        ).toBe('https://qnbs.github.io/CannaGuide-2025/ort-1.14.0/')
        // A worker's location is its script under /assets/; the base still wins.
        expect(
            transformersOrtWasmPrefix(
                '/CannaGuide-2025/',
                'https://qnbs.github.io/CannaGuide-2025/assets/inference.worker-AbC123.js',
            ),
        ).toBe('https://qnbs.github.io/CannaGuide-2025/ort-1.14.0/')
        expect(
            transformersOrtWasmPrefix('/', 'https://cannaguide-2025.pages.dev/assets/x.js'),
        ).toBe('https://cannaguide-2025.pages.dev/ort-1.14.0/')
        expect(transformersOrtWasmPrefix('/CannaGuide-2025', 'https://qnbs.github.io/')).toBe(
            'https://qnbs.github.io/CannaGuide-2025/ort-1.14.0/',
        )
        // Absolute, so ORT's blob: proxy worker can use it without a base of its own.
        expect(() => new URL(transformersOrtWasmPrefix('/', 'tauri://localhost/'))).not.toThrow()
    })
})
