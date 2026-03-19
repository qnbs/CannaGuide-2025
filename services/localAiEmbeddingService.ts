import { loadTransformersPipeline, type LocalAiPipeline } from './localAIModelLoader'
import { captureLocalAiError } from './sentryService'

/**
 * Local AI Embedding Service — computes vector embeddings using a
 * sentence-transformer model running entirely in the browser.
 *
 * Used for semantic search in the RAG pipeline, nearest-neighbor strain
 * matching, and journal similarity clustering.
 */

const EMBEDDING_MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const EMBEDDING_DIMENSION = 384

let embeddingPipelinePromise: Promise<LocalAiPipeline> | null = null

const loadEmbeddingPipeline = async (): Promise<LocalAiPipeline> => {
    if (!embeddingPipelinePromise) {
        embeddingPipelinePromise = loadTransformersPipeline(
            'feature-extraction',
            EMBEDDING_MODEL_ID,
            { quantized: true },
        ).catch((error: unknown) => {
            embeddingPipelinePromise = null
            captureLocalAiError(error, { model: EMBEDDING_MODEL_ID, stage: 'preload' })
            throw error
        })
    }
    return embeddingPipelinePromise
}

/** Cosine similarity between two equal-length vectors. */
export const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
}

/** Normalize a vector to unit length in-place. */
const normalize = (vec: Float32Array): Float32Array => {
    let norm = 0
    for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i]
    norm = Math.sqrt(norm)
    if (norm > 0) {
        for (let i = 0; i < vec.length; i++) vec[i] /= norm
    }
    return vec
}

/** Extract a Float32Array embedding from the pipeline output. */
const extractEmbedding = (raw: unknown): Float32Array => {
    // Transformers.js feature-extraction returns a Tensor with { data, dims }.
    // The first row represents the [CLS] pooled output.
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
        return normalize(new Float32Array((first as number[]).slice(0, EMBEDDING_DIMENSION)))
    }
    return new Float32Array(EMBEDDING_DIMENSION)
}

/**
 * Compute a dense embedding for a single text input.
 * Returns a Float32Array of length 384 (MiniLM dimension).
 */
export const embedText = async (text: string): Promise<Float32Array> => {
    const pipeline = await loadEmbeddingPipeline()
    const result = await pipeline(text, { pooling: 'mean', normalize: true })
    return extractEmbedding(result)
}

/**
 * Compute embeddings for multiple texts in a single batch.
 * More efficient than calling embedText in a loop because the model
 * only needs one forward pass.
 */
export const embedBatch = async (texts: string[]): Promise<Float32Array[]> => {
    if (texts.length === 0) return []
    const pipeline = await loadEmbeddingPipeline()
    const results: Float32Array[] = []
    // Process in micro-batches of 8 to avoid OOM on low-memory devices
    const BATCH = 8
    for (let i = 0; i < texts.length; i += BATCH) {
        const slice = texts.slice(i, i + BATCH)
        const batchResults = await Promise.all(
            slice.map(async (t) => {
                const r = await pipeline(t, { pooling: 'mean', normalize: true })
                return extractEmbedding(r)
            }),
        )
        results.push(...batchResults)
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
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
    return scored
}

/** Check whether the embedding model has been loaded. */
export const isEmbeddingModelReady = (): boolean => embeddingPipelinePromise !== null

/** Preload the embedding model. */
export const preloadEmbeddingModel = async (
    onProgress?: (label: string) => void,
): Promise<boolean> => {
    try {
        onProgress?.('embedding-model')
        await loadEmbeddingPipeline()
        return true
    } catch {
        return false
    }
}

/** The embedding vector dimension for consumers that need to pre-allocate arrays. */
export const EMBEDDING_DIM = EMBEDDING_DIMENSION

/** Reset internal state (tests). */
export const resetEmbeddingPipeline = (): void => {
    embeddingPipelinePromise = null
}
