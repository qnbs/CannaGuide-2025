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
export const ORT_VERSION = '1.30.0'

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

/** The binary `ort.bundle.min.mjs` (the browser entry of onnxruntime-web) runs. */
export const ORT_WASM_FILE = 'ort-wasm-simd-threaded.jsep.wasm'
export const ORT_WASM_URL = `${ORT_WASM_CDN_BASE}${ORT_WASM_FILE}`

/**
 * Subresource-integrity digest of ORT_WASM_FILE at ORT_VERSION. The browser
 * rejects the download before any byte reaches WebAssembly if it differs.
 * `ortVersionPin.test.ts` recomputes it from the installed package, so a version
 * bump without a new digest fails a test instead of every inference call.
 */
export const ORT_WASM_SRI = 'sha256-OtIyMbW9bZ3aVaf4RgYxXgvzW2dQwo7pk8mHxUysqw8='

let verifiedOrtWasm: Promise<ArrayBuffer> | null = null

/**
 * Download ORT_WASM_FILE from the CDN and let the browser verify it against
 * ORT_WASM_SRI. Memoised per realm (each worker fetches once; the HTTP cache
 * serves repeats); a failure clears the memo so a later call can retry.
 */
export const fetchVerifiedOrtWasm = (fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> => {
    verifiedOrtWasm ??= fetchImpl(ORT_WASM_URL, {
        integrity: ORT_WASM_SRI,
        mode: 'cors',
        credentials: 'omit',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`onnxruntime-web wasm download failed: HTTP ${response.status}`)
            }
            return response.arrayBuffer()
        })
        .catch((error: unknown) => {
            verifiedOrtWasm = null
            throw error
        })
    return verifiedOrtWasm
}

/** Test-only: forget the memoised download. */
export const resetVerifiedOrtWasmForTests = (): void => {
    verifiedOrtWasm = null
}

/**
 * Directory, under the app base, holding the wasm of the onnxruntime-web that
 * transformers.js bundles (1.14.0 -- NOT ORT_VERSION; the two runtimes are not
 * interchangeable). The build copies the lockfile-resolved, digest-pinned
 * binaries there: apps/web/lib/transformersOrtAssets.mjs, whose
 * TRANSFORMERS_ORT_DIR must match this.
 */
export const TRANSFORMERS_ORT_WASM_DIR = 'ort-1.14.0/'

/**
 * Absolute same-origin prefix for TRANSFORMERS_ORT_WASM_DIR.
 *
 * Absolute on purpose: with `env.wasm.proxy` ORT runs in a worker started from
 * a `blob:` URL, against which a path-only prefix does not resolve. `baseUrl` is
 * the Vite base (`/CannaGuide-2025/` on GitHub Pages, `/` elsewhere and on
 * desktop), so a root-relative `/ort-1.14.0/` would break the Pages subpath.
 */
export const transformersOrtWasmPrefix = (baseUrl: string, locationHref: string): string =>
    new URL(
        `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}${TRANSFORMERS_ORT_WASM_DIR}`,
        locationHref,
    ).href

/**
 * Lazy-load @xenova/transformers (ONNX pipelines via WebGPU/WASM).
 *
 * transformers.js bundles its own onnxruntime-web 1.14.0 and, at module load,
 * points it at `cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/` -- wasm
 * fetched cross-origin with no integrity check (GH #585). ORT 1.14 has no
 * `wasmBinary` hook, so the fix is the origin: every consumer comes through
 * here, and the prefix is replaced with the same-origin copy before any
 * pipeline (and so any ORT session) can start. The bytes are the same build; the
 * build verifies them against pinned digests.
 *
 * Never point this at ORT_WASM_CDN_BASE: that is 1.30.0 wasm, and handing it to
 * 1.14.0 JS is the version mismatch those constants exist to prevent.
 *
 * Throws instead of returning a module still aimed at the CDN when the ORT env
 * is not where it is expected.
 */
export const loadTransformers = async (): Promise<typeof import('@xenova/transformers')> => {
    const mod = await import('@xenova/transformers')
    const wasm = mod.env.backends?.onnx?.wasm
    const locationHref = globalThis.location?.href
    if (!wasm || !locationHref) {
        throw new Error('transformers.js ONNX runtime env is unavailable; refusing the CDN default')
    }
    wasm.wasmPaths = transformersOrtWasmPrefix(import.meta.env.BASE_URL, locationHref)
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
 * Hands ORT integrity-verified wasm bytes (`env.wasm.wasmBinary`) and sets NO
 * `wasmPaths`. With a `wasmPaths` prefix, ORT resolves its JS glue
 * (`ort-wasm-simd-threaded.jsep.mjs`) against the CDN and `import()`s it,
 * unverified: that is remote code execution where no CSP blocks it (GitHub Pages
 * delivers CSP as a `<meta>` tag, which does not reach workers), and a CSP
 * failure where `script-src 'self'` does (Vercel, Cloudflare, desktop). Without a
 * prefix ORT uses the glue embedded in its own same-origin bundle.
 *
 * Configured here rather than at each call site, so a new consumer cannot forget it.
 */
export const loadOnnxRuntime = async (): Promise<typeof import('onnxruntime-web')> => {
    const ort = await import('onnxruntime-web')
    ort.env.wasm.wasmBinary = await fetchVerifiedOrtWasm()
    return ort
}
