/**
 * Persistent RAG Embedding Cache -- IndexedDB-backed cache for pre-computed
 * journal entry embeddings used by the hybrid RAG ranking pipeline.
 *
 * Uses the same createIndexedDbLruCache factory as localAiCacheService.
 * Embeddings are stored as number[] (IndexedDB cannot reliably serialize
 * Float32Array). Automatic model-version tracking invalidates stale entries
 * when the embedding model is upgraded.
 */

import { createIndexedDbLruCache } from './indexedDbLruCache'
import { embedText, isEmbeddingModelReady } from './localAiEmbeddingService'
import { isWorkerAvailable } from './inferenceQueueService'
import { isEcoMode } from './aiEcoModeService'
import { captureLocalAiError } from './sentryService'
import type { Plant, JournalEntry } from '@/types'
import DOMPurify from 'dompurify'

// ── Model version for cache invalidation on model upgrades ───────────────────

const MODEL_VERSION = 'Xenova/all-MiniLM-L6-v2-q'

// ── Cache entry type ─────────────────────────────────────────────────────────

interface RagEmbeddingCacheEntry {
    key: string
    embedding: number[]
    modelVersion: string
    accessedAt: number
    createdAt: number
}

// ── LRU cache instance ───────────────────────────────────────────────────────

const cache = createIndexedDbLruCache<RagEmbeddingCacheEntry>({
    dbName: 'CannaGuideRagEmbeddingCache',
    storeName: 'embeddings',
    maxEntries: 2048,
    ttlMs: 90 * 24 * 60 * 60 * 1000,
    hashPrefix: '',
    stages: {
        read: 'cache-read',
        write: 'cache-write',
        persist: 'cache-persist',
        clear: 'cache-clear',
    },
})

// ── Telemetry counters ───────────────────────────────────────────────────────

let _hits = 0
let _misses = 0
let _precomputeComplete = false

/** Background precomputation batch size. */
const PRECOMPUTE_BATCH_SIZE = 10

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Read a cached embedding without computing if absent.
 * Returns null on cache miss or model-version mismatch.
 */
export const getCachedEmbedding = async (cacheKey: string): Promise<Float32Array | null> => {
    try {
        const entry = await cache.get(cacheKey)
        if (!entry) {
            _misses++
            return null
        }
        if (entry.modelVersion !== MODEL_VERSION) {
            _misses++
            return null
        }
        _hits++
        return new Float32Array(entry.embedding)
    } catch {
        _misses++
        return null
    }
}

/**
 * Retrieve a cached embedding or compute + persist it if missing.
 * Tracks hit/miss telemetry. Invalidates entries from older model versions.
 */
export const getOrComputeEmbedding = async (
    text: string,
    cacheKey: string,
): Promise<Float32Array> => {
    try {
        const entry = await cache.get(cacheKey)
        if (entry && entry.modelVersion === MODEL_VERSION) {
            _hits++
            return new Float32Array(entry.embedding)
        }
    } catch {
        // Cache read failed -- fall through to compute
    }

    _misses++

    const vec = await embedText(text)
    const now = Date.now()
    try {
        await cache.set({
            key: cacheKey,
            embedding: Array.from(vec),
            modelVersion: MODEL_VERSION,
            accessedAt: now,
            createdAt: now,
        })
    } catch (error) {
        captureLocalAiError(error, { stage: 'cache-write' })
    }
    return vec
}

/**
 * Pre-compute embeddings for a batch of entries.
 * Skips entries already cached with the current model version.
 * Yields to the event loop between batches to keep the UI responsive.
 * @returns The number of newly computed embeddings.
 */
export const precomputeEmbeddings = async (
    entries: ReadonlyArray<{ text: string; key: string }>,
): Promise<number> => {
    let computed = 0
    for (let i = 0; i < entries.length; i += PRECOMPUTE_BATCH_SIZE) {
        const batch = entries.slice(i, i + PRECOMPUTE_BATCH_SIZE)
        for (const entry of batch) {
            try {
                const existing = await cache.get(entry.key)
                if (existing && existing.modelVersion === MODEL_VERSION) continue

                const vec = await embedText(entry.text.slice(0, 256))
                const now = Date.now()
                await cache.set({
                    key: entry.key,
                    embedding: Array.from(vec),
                    modelVersion: MODEL_VERSION,
                    accessedAt: now,
                    createdAt: now,
                })
                computed++
            } catch (error) {
                captureLocalAiError(error, { stage: 'cache-write' })
            }
        }
        // Yield to event loop between batches
        if (i + PRECOMPUTE_BATCH_SIZE < entries.length) {
            await new Promise<void>((r) => setTimeout(r, 0))
        }
    }
    return computed
}

/**
 * Fire-and-forget background precomputation for all journal entries.
 * Skips when EcoMode is active or the inference worker is unavailable.
 * Cache key includes growId for grow-scoped isolation.
 */
export const startBackgroundPrecomputation = (plants: ReadonlyArray<Plant>): void => {
    if (isEcoMode() || !isWorkerAvailable()) return
    if (!isEmbeddingModelReady()) return

    const entries: Array<{ text: string; key: string }> = []
    for (const plant of plants) {
        for (const entry of plant.journal) {
            const raw = buildChunkText(entry)
            entries.push({ text: raw, key: `${plant.growId}:${plant.id}:${entry.createdAt}` })
        }
    }

    if (entries.length === 0) return

    void precomputeEmbeddings(entries).then((n) => {
        _precomputeComplete = true
        if (n > 0) {
            console.debug(`[RAG] Background precomputed ${n} embeddings`)
        }
    })
}

/** Whether background precomputation has finished. */
export const isPrecomputationComplete = (): boolean => _precomputeComplete

/** Whether the semantic ranking pipeline is available. */
export const isSemanticRankingAvailable = (): boolean =>
    isEmbeddingModelReady() && isWorkerAvailable()

/** Telemetry snapshot. */
export const getStats = async (): Promise<{
    total: number
    hits: number
    misses: number
    precomputeComplete: boolean
}> => ({
    total: await cache.count(),
    hits: _hits,
    misses: _misses,
    precomputeComplete: _precomputeComplete,
})

/** Clear all cached embeddings and reset counters. */
export const clearEmbeddingCache = async (): Promise<void> => {
    await cache.clear()
    _hits = 0
    _misses = 0
    _precomputeComplete = false
}

// ── Internal helpers ─────────────────────────────────────────────────────────

const buildChunkText = (entry: JournalEntry): string => {
    const detailsText = entry.details ? JSON.stringify(entry.details) : null
    const rawText = `${entry.type} ${entry.notes} ${detailsText ?? ''}`
    return DOMPurify.sanitize(rawText, { ALLOWED_TAGS: [] })
}

/** Reset internal state (for tests). */
export const resetCacheState = (): void => {
    _hits = 0
    _misses = 0
    _precomputeComplete = false
    cache.resetDbPromise()
}
