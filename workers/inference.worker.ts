/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for Transformers.js inference.
 * Runs all ONNX/WASM pipeline inference off the main thread to keep the UI responsive.
 *
 * Protocol:
 *   Main → Worker: InferenceWorkerRequest (id, task, modelId, input, options)
 *   Worker → Main: InferenceWorkerResponse (id, result | error)
 */

type TransformersModule = typeof import('@xenova/transformers')
type Pipeline = (input: unknown, options?: Record<string, unknown>) => Promise<unknown>

let transformersPromise: Promise<TransformersModule> | null = null
const pipelineCache = new Map<string, Promise<Pipeline>>()

export interface InferenceWorkerRequest {
    id: string
    task: string
    modelId: string
    input: unknown
    pipelineOptions?: Record<string, unknown>
    inferenceOptions?: Record<string, unknown>
}

export interface InferenceWorkerResponse {
    id: string
    result?: unknown
    error?: string
}

const getTransformers = (): Promise<TransformersModule> => {
    if (!transformersPromise) {
        transformersPromise = (async () => {
            const mod = await import('@xenova/transformers')
            if (mod.env?.backends?.onnx?.wasm) {
                mod.env.backends.onnx.wasm.proxy = false // no nested proxy inside worker
            }
            return mod
        })()
    }
    return transformersPromise
}

const loadPipeline = async (
    task: string,
    modelId: string,
    options: Record<string, unknown>,
): Promise<Pipeline> => {
    const key = `${task}::${modelId}`
    const cached = pipelineCache.get(key)
    if (cached) return cached

    const promise = (async () => {
        const { pipeline } = await getTransformers()
        return pipeline(task as never, modelId, options as never) as Promise<Pipeline>
    })()

    // Evict oldest if cache grows too large
    if (pipelineCache.size >= 8) {
        const oldest = pipelineCache.keys().next().value
        if (oldest) pipelineCache.delete(oldest)
    }
    pipelineCache.set(key, promise)
    promise.catch(() => pipelineCache.delete(key))
    return promise
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

self.onmessage = async (e: MessageEvent<InferenceWorkerRequest>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const data = e.data
    if (!data?.id || !data?.task || !data?.modelId) {
        const response: InferenceWorkerResponse = {
            id: data?.id ?? 'unknown',
            error: 'Invalid inference request: id, task, and modelId are required',
        }
        self.postMessage(response)
        return
    }
    const { id, task, modelId, input, pipelineOptions, inferenceOptions } = data
    try {
        const pipe = await loadPipeline(task, modelId, pipelineOptions ?? { quantized: true })
        const result = await pipe(input, inferenceOptions)
        const response: InferenceWorkerResponse = { id, result }
        self.postMessage(response)
    } catch (err) {
        const response: InferenceWorkerResponse = {
            id,
            error: err instanceof Error ? err.message : 'Worker inference failed',
        }
        self.postMessage(response)
    }
}
