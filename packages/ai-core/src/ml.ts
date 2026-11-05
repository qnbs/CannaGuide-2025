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
export const ORT_VERSION = '1.31.1'

/**
 * Where onnxruntime-web loads its `.wasm` from.
 *
 * Pointing this at jsDelivr keeps `ort-wasm-simd-threaded.jsep.wasm` -- 28.2 MiB
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
export const ORT_WASM_SRI = 'sha256-Wrg2F4OCLQKlfR6XzyUUvOtFGmKPKymuDXtuYYIB/48='

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
 * Never point this at ORT_WASM_CDN_BASE: that is 1.31.1 wasm, and handing it to
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
    // The app ships no transformers.js models. With local models allowed,
    // transformers.js first requests /models/<repo>/config.json from this origin,
    // and Vercel and Cloudflare answer with the SPA fallback (200 text/html),
    // which it then fails to parse as the model config.
    mod.env.allowLocalModels = false
    return mod
}

/**
 * Thrown instead of downloading a model while Local-Only Mode is on (GH #700).
 * Callers fall back to their simpler methods and tell the user once.
 */
export class ModelDownloadBlockedError extends Error {
    readonly modelId: string

    constructor(modelId: string) {
        super(`Local-Only Mode blocks downloading the model ${modelId}`)
        this.name = 'ModelDownloadBlockedError'
        this.modelId = modelId
    }
}

/** The part of transformers.js `env` the download policy reads and sets. */
export interface TransformersFetchEnv {
    allowLocalModels?: boolean | undefined
    allowRemoteModels?: unknown
    remoteHost?: unknown
    remotePathTemplate?: unknown
    localModelPath?: unknown
    [key: string]: unknown
}

/**
 * Where transformers.js looks for "local" models in Local-Only Mode: a scheme
 * `fetch` rejects without any request. The app ships no local models, and its
 * own origin answers unknown paths with the SPA page (200 text/html), which
 * transformers.js would store in its cache under the local path and read again
 * on every later load -- poisoning the model even after the mode is off.
 */
export const NO_LOCAL_MODELS_PATH = 'cannaguide-no-local-models:/'

/** The cache transformers.js keeps downloaded model files in. */
export const TRANSFORMERS_CACHE_NAME = 'transformers-cache'

const DEFAULT_REMOTE_HOST = 'https://huggingface.co/'
const DEFAULT_REMOTE_PATH_TEMPLATE = '{model}/resolve/{revision}/'

/** transformers.js `pathJoin`: one slash between parts, none added at the ends. */
const joinPath = (...parts: string[]): string =>
    parts
        .map((part, index) => {
            const start = index > 0 ? part.replace(/^\//u, '') : part
            return index < parts.length - 1 ? start.replace(/\/$/u, '') : start
        })
        .join('/')

/**
 * The URL transformers.js stores a model's `config.json` under in its browser
 * cache -- the same key it builds for the download, so a downloaded model is
 * found here. Every pipeline loads that file first.
 */
export const transformersConfigUrl = (env: TransformersFetchEnv, modelId: string): string => {
    const host = typeof env.remoteHost === 'string' ? env.remoteHost : DEFAULT_REMOTE_HOST
    const template =
        typeof env.remotePathTemplate === 'string'
            ? env.remotePathTemplate
            : DEFAULT_REMOTE_PATH_TEMPLATE
    const path = template.replaceAll('{model}', modelId).replaceAll('{revision}', 'main')
    return joinPath(host, path, 'config.json')
}

/** What the cache check needs of `caches` (structural: `CacheStorage` fits it). */
export interface CacheLookup {
    open(cacheName: string): Promise<{ match(url: string): Promise<unknown> }>
}

/** Whether a transformers.js model was downloaded into the browser cache. */
export const isTransformersModelCached = async (
    env: TransformersFetchEnv,
    modelId: string,
    cacheStorage: CacheLookup | undefined = globalThis.caches,
): Promise<boolean> => {
    if (!cacheStorage) return false
    try {
        const cache = await cacheStorage.open(TRANSFORMERS_CACHE_NAME)
        return (await cache.match(transformersConfigUrl(env, modelId))) !== undefined
    } catch {
        return false
    }
}

/**
 * Switches a transformers.js env to cache-only: no remote download, and a
 * "local" path that fetch rejects without a request (see NO_LOCAL_MODELS_PATH).
 * transformers.js reads these switches for every file, so a load already under
 * way fails at its next file instead of downloading it (GH #700).
 */
export const applyLocalOnlyToTransformersEnv = (env: TransformersFetchEnv): void => {
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath = NO_LOCAL_MODELS_PATH
}

/**
 * Whether a load failed because remote downloads were off -- the error
 * transformers.js 2.17.2 throws for a file it would have had to download.
 */
export const isRemoteDownloadRefusal = (error: unknown): boolean =>
    error instanceof Error && error.message.includes('env.allowRemoteModels=false')

/**
 * Applies Local-Only Mode to the next transformers.js load (GH #700).
 *
 * Off: the usual download from the Hugging Face CDN (local paths stay off, see
 * loadTransformers). On: remote downloads are switched off first -- also for a
 * model that is then refused, so a download of it already under way fails at
 * its next file -- and a model that is not in the browser cache is refused with
 * ModelDownloadBlockedError before any request. A file missing from a partly
 * cached model then fails instead of reaching the CDN. Local models must be
 * allowed (with both switches off transformers.js throws before it reads its
 * cache), so their path points where nothing is fetched or cached.
 */
export const prepareTransformersLoad = async (
    env: TransformersFetchEnv,
    modelId: string,
    localOnly: boolean,
    cacheStorage?: CacheLookup,
): Promise<void> => {
    if (!localOnly) {
        env.allowLocalModels = false
        env.allowRemoteModels = true
        return
    }
    applyLocalOnlyToTransformersEnv(env)
    if (!(await isTransformersModelCached(env, modelId, cacheStorage))) {
        throw new ModelDownloadBlockedError(modelId)
    }
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
