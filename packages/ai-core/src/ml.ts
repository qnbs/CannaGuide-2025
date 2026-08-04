// ---------------------------------------------------------------------------
// @cannaguide/ai-core/ml — lazy re-exports for heavy ML dependencies
//
// All ML libraries are loaded asynchronously to enable code splitting.
// When ai-core is not installed (e.g. DevContainer lite mode), dynamic
// imports will fail gracefully at runtime — the web app guards these calls.
// ---------------------------------------------------------------------------

/**
 * onnxruntime-web version whose `.wasm` siblings are fetched from the CDN.
 *
 * MUST match the resolved `onnxruntime-web` dependency. ORT's JS and its wasm are
 * built together and are not interchangeable across versions, so a mismatch is a
 * runtime failure, not a warning. This drifted once already: two workers pinned
 * `@1.20.0` here while the package resolved to 1.27.0.
 *
 * `ort-version-pin.test.ts` asserts this against the installed package, so the
 * drift fails a test instead of a user's inference call.
 */
export const ORT_VERSION = '1.27.0'

/**
 * Where onnxruntime-web loads its `.wasm` from.
 *
 * Pointing this at jsDelivr keeps `ort-wasm-simd-threaded.jsep.wasm` -- 25.6 MiB
 * -- out of every deployed bundle. That size is not merely wasteful: it exceeds
 * Cloudflare Pages' hard 25 MiB per-file limit, so the Cloudflare mirror could
 * never deploy at all while the file was bundled.
 *
 * `cdn.jsdelivr.net` is already in the app's CSP `connect-src` (and in the Tauri
 * desktop CSP), so this needs no policy change.
 */
export const ORT_WASM_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`

/**
 * Lazy-load @xenova/transformers (ONNX pipelines via WebGPU/WASM).
 *
 * transformers.js embeds onnxruntime-web and exposes its env as
 * `env.backends.onnx`, so it needs the same CDN wasm path as a direct ORT load.
 * It never set one, which is why the 25.6 MiB wasm stayed reachable and shipped
 * even though the two direct-ORT workers pointed at the CDN.
 *
 * Set here rather than in the three call sites (modelLoader, inference.worker,
 * imageGeneration.worker) for the same reason as `loadOnnxRuntime`: a consumer
 * that forgets it silently falls back to a bundled binary.
 */
export const loadTransformers = async (): Promise<typeof import('@xenova/transformers')> => {
    const mod = await import('@xenova/transformers')
    const onnxWasmEnv = mod.env?.backends?.onnx?.wasm
    if (onnxWasmEnv) {
        onnxWasmEnv.wasmPaths = ORT_WASM_CDN_BASE
    }
    return mod
}

/** Lazy-load @mlc-ai/web-llm (WebGPU LLM inference). */
export const loadWebLlm = async (): Promise<typeof import('@mlc-ai/web-llm')> =>
    import('@mlc-ai/web-llm')

/** Lazy-load @google/genai (Gemini cloud API). */
export const loadGenAI = async (): Promise<typeof import('@google/genai')> =>
    import('@google/genai')

/**
 * Lazy-load onnxruntime-web (direct ONNX model inference via WebGPU/WASM).
 *
 * Sets `env.wasm.wasmPaths` here rather than at each call site. Previously two
 * workers set it and the transformers.js paths did not, so the bundled wasm was
 * still reachable and still shipped. Configuring it at the seam means a new
 * consumer cannot forget it.
 */
export const loadOnnxRuntime = async (): Promise<typeof import('onnxruntime-web')> => {
    const ort = await import('onnxruntime-web')
    ort.env.wasm.wasmPaths = ORT_WASM_CDN_BASE
    return ort
}
