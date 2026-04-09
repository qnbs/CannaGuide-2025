import { enqueueInference, isWorkerAvailable } from './inferenceQueueService'
import { captureLocalAiError } from './sentryService'

/**
 * Local AI Embedding Service — computes vector embeddings using a
 * sentence-transformer model running entirely in the browser.
 *
 * All inference is off-loaded to the inference Web Worker via
 * inferenceQueueService to keep the UI thread responsive.
 */

const EMBEDDING_MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const EMBEDDING_DIMENSION = 384
/** Timeout for a single embedding inference (30s -- embeddings are fast). */
const EMBEDDING_TIMEOUT_MS = 30_000

/** Maximum input length in characters to prevent model OOM. */
const MAX_INPUT_LENGTH = 512

/** Dispatch a feature-extraction task to the inference worker. */
const dispatchEmbedding = async (
    input: unknown,
    inferenceOptions?: Record<string, unknown>,
): Promise<unknown> => {
    if (!isWorkerAvailable()) {
        throw new Error('Inference worker unavailable')
    }
    return enqueueInference({
        task: 'feature-extraction',
        modelId: EMBEDDING_MODEL_ID,
        input,
        pipelineOptions: { quantized: true },
        inferenceOptions,
        priority: 'normal',
        timeoutMs: EMBEDDING_TIMEOUT_MS,
    })
}

/** Track whether we have dispatched at least one embedding (for readiness check). */
let embeddingDispatched = false

/** Extract a Float32Array embedding from the pipeline output. */
const extractEmbedding = (raw: unknown): Float32Array => {
    // Transformers.js feature-extraction returns a Tensor with { data, dims }.
    // The first row represents the [CLS] pooled output.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const output = raw as {
        data?: Float32Array | number[]
        tolist?: () => number[][]
    }

    if (output.data instanceof Float32Array) {
        return normalize(new Float32Array(output.data.slice(0, EMBEDDING_DIMENSION)))
    }
    if (Array.isArray(output.data)) {
        return normalize(new Float32Array(output.data.slice(0, EMBEDDING_DIMENSION)))
    }
    if (typeof output.tolist === 'function') {
        const list = output.tolist()
        const first = Array.isArray(list[0]) ? list[0] : list
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return normalize(new Float32Array((first as number[]).slice(0, EMBEDDING_DIMENSION)))
    }
    return new Float32Array(EMBEDDING_DIMENSION)
}

/** Cosine similarity between two equal-length vectors. */
export const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
    if (a.length !== b.length || a.length === 0) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!
        normA += a[i]! * a[i]!
        normB += b[i]! * b[i]!
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
}

/** Normalize a vector to unit length in-place. */
const normalize = (vec: Float32Array): Float32Array => {
    let norm = 0
    for (let i = 0; i < vec.length; i++) norm += vec[i]! * vec[i]!
    norm = Math.sqrt(norm)
    if (norm > 0) {
        for (let i = 0; i < vec.length; i++) vec[i] = vec[i]! / norm
    }
    return vec
}

/**
 * Compute a dense embedding for a single text input.
 * Returns a Float32Array of length 384 (MiniLM dimension).
 */
export const embedText = async (text: string): Promise<Float32Array> => {
    const sanitized = text.trim().slice(0, MAX_INPUT_LENGTH)
    if (sanitized.length === 0) return new Float32Array(EMBEDDING_DIMENSION)
    try {
        embeddingDispatched = true
        const result = await dispatchEmbedding(sanitized, { pooling: 'mean', normalize: true })
        return extractEmbedding(result)
    } catch (error) {
        captureLocalAiError(error, { model: EMBEDDING_MODEL_ID, stage: 'embedding' })
        throw error
    }
}

/**
 * Compute embeddings for multiple texts in a single batch.
 * More efficient than calling embedText in a loop because the model
 * only needs one forward pass.
 */
export const embedBatch = async (texts: string[]): Promise<Float32Array[]> => {
    if (texts.length === 0) return []
    embeddingDispatched = true
    const results: Float32Array[] = []
    // Process in micro-batches of 8 to avoid OOM on low-memory devices
    const BATCH = 8
    for (let i = 0; i < texts.length; i += BATCH) {
        const slice = texts.slice(i, i + BATCH)
        const batchResults = await Promise.allSettled(
            slice.map(async (t) => {
                const sanitized = t.trim().slice(0, MAX_INPUT_LENGTH)
                if (sanitized.length === 0) return new Float32Array(EMBEDDING_DIMENSION)
                const r = await dispatchEmbedding(sanitized, { pooling: 'mean', normalize: true })
                return extractEmbedding(r)
            }),
        )
        results.push(
            ...batchResults.map((r, idx) => {
                if (r.status === 'rejected') {
                    captureLocalAiError(r.reason, {
                        model: EMBEDDING_MODEL_ID,
                        stage: 'batch',
                        batchItem: i + idx,
                    })
                }
                return r.status === 'fulfilled' ? r.value : new Float32Array(EMBEDDING_DIMENSION)
            }),
        )
    }
    return results
}

/**
 * Rank texts by semantic similarity to a query.
 * Returns indices sorted by descending relevance with their scores.
 */
export const semanticRank = async (
    query: string,
    candidates: string[],
    topK = 6,
): Promise<Array<{ index: number; score: number }>> => {
    if (candidates.length === 0) return []
    const [queryVec, candidateVecs] = await Promise.all([embedText(query), embedBatch(candidates)])
    const scored = candidateVecs
        .map((vec, index) => ({ index, score: cosineSimilarity(queryVec, vec) }))
        .toSorted((a, b) => b.score - a.score)
        .slice(0, topK)
    return scored
}

/** Check whether the embedding model has been used. */
export const isEmbeddingModelReady = (): boolean => embeddingDispatched

/** Preload the embedding model by dispatching a no-op inference. */
export const preloadEmbeddingModel = async (
    onProgress?: (label: string) => void,
): Promise<boolean> => {
    try {
        onProgress?.('embedding-model')
        await dispatchEmbedding('warmup', { pooling: 'mean', normalize: true })
        embeddingDispatched = true
        return true
    } catch {
        return false
    }
}

/** The embedding vector dimension for consumers that need to pre-allocate arrays. */
export const EMBEDDING_DIM = EMBEDDING_DIMENSION

/** Reset internal state (tests). */
export const resetEmbeddingPipeline = (): void => {
    embeddingDispatched = false
}
