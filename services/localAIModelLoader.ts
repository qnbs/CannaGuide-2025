type TransformersModule = typeof import('@xenova/transformers')

export type LocalAiPipeline = (input: unknown, options?: Record<string, unknown>) => Promise<unknown>

/** Detected best ONNX execution provider: webgpu → wasm. */
export type OnnxBackend = 'webgpu' | 'wasm'

let transformersModulePromise: Promise<TransformersModule> | null = null
let detectedBackend: OnnxBackend | null = null

/** Cached pipeline instances keyed by `task::modelId`. */
const pipelineCache = new Map<string, Promise<LocalAiPipeline>>()

/** Detect the best available ONNX execution provider. */
export const detectOnnxBackend = (): OnnxBackend => {
    if (detectedBackend) return detectedBackend
    detectedBackend =
        typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm'
    return detectedBackend
}

export const getTransformersModule = async (): Promise<TransformersModule> => {
    if (!transformersModulePromise) {
        transformersModulePromise = (async () => {
            const mod = await import('@xenova/transformers')
            // Configure ONNX backend for optimal device utilization
            const backend = detectOnnxBackend()
            if (mod.env?.backends?.onnx?.wasm) {
                mod.env.backends.onnx.wasm.proxy = true
            }
            console.debug(`[LocalAI] Transformers.js loaded, preferred backend: ${backend}`)
            return mod
        })()
    }

    return transformersModulePromise
}

export const loadTransformersPipeline = async (
    task: string,
    modelId: string,
    options: Record<string, unknown>,
): Promise<LocalAiPipeline> => {
    const cacheKey = `${task}::${modelId}`
    const cached = pipelineCache.get(cacheKey)
    if (cached) return cached

    const promise = (async () => {
        const { pipeline } = await getTransformersModule()
        const backend = detectOnnxBackend()
        const mergedOptions: Record<string, unknown> = { ...options }
        // Prefer WebGPU device when available; Transformers.js falls back to WASM automatically
        if (backend === 'webgpu' && !mergedOptions.device) {
            mergedOptions.device = 'webgpu'
        }
        return pipeline(task as never, modelId, mergedOptions as never) as Promise<LocalAiPipeline>
    })()

    pipelineCache.set(cacheKey, promise)
    // Evict from cache on failure so retry is possible
    promise.catch(() => pipelineCache.delete(cacheKey))
    return promise
}

/** Reset cached pipelines (useful for tests and forced re-download). */
export const clearPipelineCache = (): void => {
    pipelineCache.clear()
}
