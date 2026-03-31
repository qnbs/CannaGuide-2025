/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for Transformers.js inference.
 * Runs all ONNX/WASM pipeline inference off the main thread to keep the UI responsive.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'

type TransformersModule = typeof import('@xenova/transformers')
type Pipeline = (input: unknown, options?: Record<string, unknown>) => Promise<unknown> | undefined

let transformersPromise: Promise<TransformersModule> | null = null
const pipelineCache = new Map<string, Promise<Pipeline>>()

export interface InferencePayload {
    task: string
    modelId: string
    input: unknown
    pipelineOptions?: Record<string, unknown> | undefined
    inferenceOptions?: Record<string, unknown> | undefined
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

self.onmessage = async (e: MessageEvent<WorkerRequest<InferencePayload>>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const { messageId, payload } = e.data
    if (!payload?.task || !payload?.modelId) {
        self.postMessage(
            workerErr(messageId, 'Invalid inference request: task and modelId are required'),
        )
        return
    }
    const { task, modelId, input, pipelineOptions, inferenceOptions } = payload
    try {
        const pipe = await loadPipeline(task, modelId, pipelineOptions ?? { quantized: true })
        const result = await pipe(input, inferenceOptions)
        self.postMessage(workerOk(messageId, result))
    } catch (err) {
        self.postMessage(
            workerErr(messageId, err instanceof Error ? err.message : 'Worker inference failed'),
        )
    }
}
