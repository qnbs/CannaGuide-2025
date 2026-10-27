/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for Transformers.js inference.
 * Runs all ONNX/WASM pipeline inference off the main thread to keep the UI responsive.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler, checkAborted, clearAborted } from '@/utils/workerAbort'
import { loadTransformers } from '@cannaguide/ai-core/ml'

type TransformersModule = Awaited<ReturnType<typeof loadTransformers>>
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
            const mod = await loadTransformers()
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

/**
 * transformers.js returns tensors (e.g. feature-extraction output) as a class
 * whose constructor returns a Proxy, and structured clone rejects proxies, so
 * posting one failed with DataCloneError and embeddings never arrived (GH #635).
 * Tensors become the plain `{ type, dims, data }` that embeddingService reads
 * (the typed array itself is cloneable). Anything else is posted as is.
 */
interface TensorLike {
    type: string
    dims: unknown[]
    data: ArrayBufferView
}

const isTensorLike = (value: unknown): value is TensorLike =>
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'dims' in value &&
    Array.isArray(value.dims) &&
    'data' in value &&
    ArrayBuffer.isView(value.data)

/** Element count of a typed array or other ArrayBuffer view. */
const elementCount = (view: ArrayBufferView): number =>
    'BYTES_PER_ELEMENT' in view && typeof view.BYTES_PER_ELEMENT === 'number'
        ? view.byteLength / view.BYTES_PER_ELEMENT
        : view.byteLength

/**
 * Throws (the caller answers with workerErr) when a tensor's dims do not
 * describe its data, so a corrupt result is never posted as a success that
 * embeddingService would turn into a silently wrong vector. The dtype is not
 * checked here: this worker serves every task, and the expected element type
 * is the consumer's contract.
 */
export const toCloneableResult = (result: unknown): unknown => {
    if (isTensorLike(result)) {
        const dims = result.dims.map(Number)
        const size = dims.reduce((product, dim) => product * dim, 1)
        const count = elementCount(result.data)
        if (!dims.every((dim) => Number.isSafeInteger(dim) && dim >= 0) || size !== count) {
            throw new Error(
                `inference result tensor dims [${dims.join(',')}] describe ${size} values but data has ${count}`,
            )
        }
        return { type: result.type, dims, data: result.data }
    }
    return Array.isArray(result) ? result.map(toCloneableResult) : result
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
        checkAborted(messageId)
        const pipe = await loadPipeline(task, modelId, pipelineOptions ?? { quantized: true })
        checkAborted(messageId)
        const result = await pipe(input, inferenceOptions)
        clearAborted(messageId)
        self.postMessage(workerOk(messageId, toCloneableResult(result)))
    } catch (err) {
        self.postMessage(
            workerErr(messageId, err instanceof Error ? err.message : 'Worker inference failed'),
        )
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()
