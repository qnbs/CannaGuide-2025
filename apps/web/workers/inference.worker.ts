/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for Transformers.js inference.
 * Runs all ONNX/WASM pipeline inference off the main thread to keep the UI responsive.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import {
    INFERENCE_LOCAL_ONLY_MESSAGE,
    workerOk,
    workerErr,
    WorkerErrorCode,
} from '@/types/workerBus.types'
import { initAbortHandler, checkAborted, clearAborted } from '@/utils/workerAbort'
import {
    applyLocalOnlyToTransformersEnv,
    isRemoteDownloadRefusal,
    loadTransformers,
    ModelDownloadBlockedError,
    prepareTransformersLoad,
} from '@cannaguide/ai-core/ml'

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
    /** Local-Only Mode when the task was dispatched: only cached models load (GH #700). */
    localOnly?: boolean | undefined
    /** LOCAL_ONLY control message only: the mode the app is in now. */
    enabled?: boolean | undefined
}

/**
 * Local-Only Mode as the app last told this worker (LOCAL_ONLY). It applies to
 * every task on top of the task's own flag, so a task dispatched before the
 * switch -- or replayed after a preemption -- cannot turn remote downloads back
 * on (GH #700).
 */
let localOnlyMode = false

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

/** Evict the oldest pipeline if the cache grows too large. */
function evictOldestPipeline(): void {
    if (pipelineCache.size < 8) return
    const oldest = pipelineCache.keys().next().value
    if (oldest !== undefined) pipelineCache.delete(oldest)
}

/** Keys whose pipeline finished loading: those need no download to reuse. */
const loadedPipelines = new Set<string>()

const loadPipeline = async (
    task: string,
    modelId: string,
    options: Record<string, unknown>,
    localOnly: boolean,
): Promise<Pipeline> => {
    const key = `${task}::${modelId}`
    // A finished pipeline needs no download. A pending one may still be fetching
    // files, so Local-Only Mode applies first, also to the load under way (GH #700).
    if (localOnly && !loadedPipelines.has(key)) {
        await prepareTransformersLoad((await getTransformers()).env, modelId, true)
    }
    const cached = pipelineCache.get(key)
    if (cached) return cached

    const promise = (async () => {
        const { pipeline, env } = await getTransformers()
        await prepareTransformersLoad(env, modelId, localOnly)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return pipeline(task as never, modelId, options as never) as Promise<Pipeline>
    })()

    evictOldestPipeline()
    loadedPipelines.delete(key)
    pipelineCache.set(key, promise)
    // Only for this entry: it may have been evicted and replaced by a newer load.
    const isCurrent = (): boolean => pipelineCache.get(key) === promise
    promise.then(
        () => {
            if (isCurrent()) loadedPipelines.add(key)
        },
        () => {
            if (isCurrent()) pipelineCache.delete(key)
        },
    )
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

/** A refused download keeps its own code, so the main thread can tell the user why. */
function failureResponse(messageId: string, err: unknown) {
    const message = err instanceof Error ? err.message : 'Worker inference failed'
    // Refused before the load, or at a later file after the mode was switched on.
    const blocked = err instanceof ModelDownloadBlockedError || isRemoteDownloadRefusal(err)
    const code = blocked ? WorkerErrorCode.MODEL_DOWNLOAD_BLOCKED : WorkerErrorCode.EXECUTION_ERROR
    return workerErr(messageId, message, code)
}

/**
 * The app's Local-Only Mode changed. Switched on, the env becomes cache-only at
 * once, so a download under way stops at its next file (GH #700); without a
 * loaded module nothing is downloading, and nothing is imported just for this.
 * Not a bus request: it is posted outside the queue and needs no reply.
 */
async function applyLocalOnlyMessage(enabled: boolean): Promise<void> {
    localOnlyMode = enabled
    if (!enabled || !transformersPromise) return
    const { env } = await transformersPromise
    // A later "off" may have arrived while this waited: the newest message wins.
    if (localOnlyMode) applyLocalOnlyToTransformersEnv(env)
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

/** Runs one validated inference task and posts its result or its failure. */
async function runInference(messageId: string, payload: InferencePayload): Promise<void> {
    const { task, modelId, input, pipelineOptions, inferenceOptions, localOnly } = payload
    try {
        checkAborted(messageId)
        const pipe = await loadPipeline(
            task,
            modelId,
            pipelineOptions ?? { quantized: true },
            localOnly === true || localOnlyMode,
        )
        checkAborted(messageId)
        const result = await pipe(input, inferenceOptions)
        clearAborted(messageId)
        self.postMessage(workerOk(messageId, toCloneableResult(result)))
    } catch (err) {
        self.postMessage(failureResponse(messageId, err))
    }
}

self.onmessage = async (e: MessageEvent<WorkerRequest<InferencePayload>>) => {
    if (!isTrustedWorkerMessage(e)) {
        return
    }

    const { messageId, payload, type } = e.data
    if (type === INFERENCE_LOCAL_ONLY_MESSAGE) {
        await applyLocalOnlyMessage(payload?.enabled === true)
        return
    }
    if (!payload?.task || !payload?.modelId) {
        self.postMessage(
            workerErr(messageId, 'Invalid inference request: task and modelId are required'),
        )
        return
    }
    await runInference(messageId, payload)
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()
