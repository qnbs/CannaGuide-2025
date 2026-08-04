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
 * Deliberately does NOT set `env.backends.onnx.wasm.wasmPaths`, which is the
 * opposite of what it looks like it should do.
 *
 * transformers.js bundles its OWN onnxruntime-web -- 1.14.0, nested in its
 * node_modules -- while `loadOnnxRuntime` below drives the direct dependency at
 * 1.27.0. Two different runtimes, and ORT's JS and wasm are not interchangeable
 * across versions.
 *
 * It also already points its copy at a CDN, matched to its own version
 * (@xenova/transformers/src/env.js):
 *
 *     onnx_env.wasm.wasmPaths = RUNNING_LOCALLY
 *         ? path.join(__dirname, '/dist/')
 *         : `https://cdn.jsdelivr.net/npm/@xenova/transformers@${VERSION}/dist/`
 *
 * So in a browser this path is already served remotely and correctly. Assigning
 * ORT_WASM_CDN_BASE here would REPLACE that working default with 1.27.0 wasm and
 * hand it to 1.14.0 JS -- the exact mismatch these constants exist to prevent,
 * reintroduced in the other direction. An earlier revision of this branch did
 * precisely that; the phantom-dependency gate is what forced a look at the
 * lockfile and surfaced the two-versions fact.
 */
export const loadTransformers = async (): Promise<typeof import('@xenova/transformers')> =>
    import('@xenova/transformers')

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
