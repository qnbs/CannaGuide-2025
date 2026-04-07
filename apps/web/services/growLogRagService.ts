import { Plant, JournalEntry } from '@/types'
import {
    isEmbeddingModelReady,
    embedText,
    embedBatch,
    cosineSimilarity,
} from '@/services/localAiEmbeddingService'
import {
    getCachedEmbedding as getCachedEmbeddingPersistent,
    getOrComputeEmbedding,
    isSemanticRankingAvailable as checkSemanticAvailable,
} from '@/services/ragEmbeddingCacheService'
import DOMPurify from 'dompurify'

interface LogChunk {
    plantId: string
    plantName: string
    growId: string
    text: string
    createdAt: number
}

/** Maximum chunks to process to prevent OOM on large journals. */
const MAX_CHUNKS = 500

const tokenize = (input: string): string[] =>
    input
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2)

const scoreChunk = (chunk: LogChunk, queryTokens: string[]): number => {
    const haystack = chunk.text.toLowerCase()
    let score = 0

    for (const token of queryTokens) {
        if (haystack.includes(token)) {
            score += 2
        }
    }

    const ageBoost = Math.max(0, 1 - (Date.now() - chunk.createdAt) / (1000 * 60 * 60 * 24 * 30))
    return score + ageBoost
}

/** Embedding cache key for a chunk (growId:plantId:createdAt). */
const buildChunkEmbeddingKey = (chunk: LogChunk): string =>
    `${chunk.growId}:${chunk.plantId}:${chunk.createdAt}`

/**
 * Normalize the token-based score to [0, 1] range.
 * Used for hybrid ranking alongside semantic cosine similarity.
 */
const normalizeTokenScore = (chunk: LogChunk, queryTokens: string[]): number => {
    if (queryTokens.length === 0) return 0
    const raw = scoreChunk(chunk, queryTokens)
    // Max possible = 2 per token match + 1.0 recency boost
    const maxPossible = queryTokens.length * 2 + 1
    return Math.min(1, raw / maxPossible)
}

const calculateRecencyScore = (createdAt: number): number =>
    Math.max(0, 1 - (Date.now() - createdAt) / (1000 * 60 * 60 * 24 * 30))

const formatContextLine = (chunk: LogChunk, score?: number): string => {
    const scoreSuffix = score != null ? ` [${(score * 100).toFixed(0)}%]` : ''
    return `- ${chunk.plantName} @ ${new Date(chunk.createdAt).toLocaleString()}${scoreSuffix}: ${chunk.text.slice(0, 240)}`
}

class GrowLogRagService {
    private buildChunks(plants: Plant[]): LogChunk[] {
        let allChunks = plants.flatMap((plant) =>
            plant.journal.map((entry: JournalEntry) => {
                const detailsText = entry.details ? JSON.stringify(entry.details) : null
                const rawText = `${entry.type} ${entry.notes} ${detailsText ?? ''}`
                return {
                    plantId: plant.id,
                    plantName: plant.name,
                    growId: plant.growId,
                    createdAt: entry.createdAt,
                    text: DOMPurify.sanitize(rawText, { ALLOWED_TAGS: [] }),
                }
            }),
        )
        // Cap to most recent chunks to prevent OOM on large journals
        if (allChunks.length > MAX_CHUNKS) {
            allChunks = allChunks.toSorted((a, b) => b.createdAt - a.createdAt)
            return allChunks.slice(0, MAX_CHUNKS)
        }
        return allChunks
    }

    /**
     * Retrieve relevant context using keyword scoring.
     * Used when embedding model is not available.
     */
    private keywordRetrieve(chunks: LogChunk[], query: string, limit: number): string {
        const tokens = tokenize(query)
        const ranked = chunks
            .map((chunk) => ({ chunk, score: scoreChunk(chunk, tokens) }))
            .toSorted((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ chunk }) => formatContextLine(chunk))
        return ranked.join('\n')
    }

    /**
     * Retrieve relevant context using hybrid semantic + token ranking.
     * Combines cosine similarity (60%), token overlap (30%), and recency (10%).
     * Falls back to keyword scoring if embedding fails.
     */
    private async semanticRetrieve(
        chunks: LogChunk[],
        query: string,
        limit: number,
    ): Promise<string> {
        try {
            const queryVec = await embedText(query)
            const queryTokens = tokenize(query)
            const chunkTexts = chunks.map((c) => c.text.slice(0, 256))

            // Use persistent cached embeddings where available, compute missing ones
            const uncachedIndices: number[] = []
            const uncachedTexts: string[] = []
            const allVecs: Array<Float32Array | null> = await Promise.all(
                chunkTexts.map(async (_text, i) => {
                    const chunk = chunks[i]
                    if (!chunk) return null
                    const key = buildChunkEmbeddingKey(chunk)
                    const cached = await getCachedEmbeddingPersistent(key)
                    if (cached) return cached
                    uncachedIndices.push(i)
                    uncachedTexts.push(chunkTexts[i] ?? '')
                    return null
                }),
            )

            if (uncachedTexts.length > 0) {
                const computed = await embedBatch(uncachedTexts)
                for (let j = 0; j < uncachedIndices.length; j++) {
                    const idx = uncachedIndices[j]
                    if (idx === undefined) continue
                    allVecs[idx] = computed[j] ?? null
                    const chunk = chunks[idx]
                    if (!chunk) continue
                    const key = buildChunkEmbeddingKey(chunk)
                    const emb = computed[j]
                    if (emb) {
                        // Persist to IndexedDB cache (fire-and-forget)
                        void getOrComputeEmbedding(chunkTexts[idx] ?? '', key)
                    }
                }
            }

            // Hybrid scoring: 60% semantic + 30% token + 10% recency
            const scored = chunks
                .map((chunk, i) => {
                    const vec = allVecs[i]
                    const semanticScore = vec
                        ? cosineSimilarity(queryVec, vec as unknown as Float32Array)
                        : 0
                    const tokenScore = normalizeTokenScore(chunk, queryTokens)
                    const recency = calculateRecencyScore(chunk.createdAt)
                    const hybridScore =
                        semanticScore > 0
                            ? 0.6 * semanticScore + 0.3 * tokenScore + 0.1 * recency
                            : 0.85 * tokenScore + 0.15 * recency
                    return { chunk, score: hybridScore }
                })
                .toSorted((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(({ chunk, score }) => formatContextLine(chunk, score))

            return scored.join('\n')
        } catch {
            // Fall back to keyword scoring on any embedding error
            return this.keywordRetrieve(chunks, query, limit)
        }
    }

    /**
     * Calculate dynamic top-K based on journal size.
     * Scales from a minimum of 6 to ~15% of total chunks, capped at 20.
     */
    private dynamicLimit(chunkCount: number, requestedLimit: number | undefined): number {
        if (requestedLimit !== undefined) return requestedLimit
        return Math.min(20, Math.max(6, Math.round(chunkCount * 0.15)))
    }

    /**
     * Sliding-window retrieval: combines the most recent entries (recency)
     * with semantically relevant entries (relevance), deduplicated.
     */
    private async slidingWindowRetrieve(
        chunks: LogChunk[],
        query: string,
        limit: number,
    ): Promise<string> {
        const RECENCY_WINDOW = 3

        // Recent entries (always included for continuity)
        const sortedByTime = chunks.toSorted((a, b) => b.createdAt - a.createdAt)
        const recentChunks = sortedByTime.slice(0, RECENCY_WINDOW)
        const recentTexts = recentChunks.map((c) => formatContextLine(c))

        // Semantic entries (excluding already-selected recent ones)
        const recentIds = new Set(recentChunks.map((c) => `${c.plantId}:${c.createdAt}`))
        const remainingChunks = chunks.filter((c) => !recentIds.has(`${c.plantId}:${c.createdAt}`))

        const semanticLimit = Math.max(1, limit - RECENCY_WINDOW)
        let semanticTexts: string[] = []

        if (remainingChunks.length > 0 && isEmbeddingModelReady()) {
            try {
                const raw = await this.semanticRetrieve(remainingChunks, query, semanticLimit)
                semanticTexts = raw.split('\n').filter((l) => l.trim().length > 0)
            } catch {
                const raw = this.keywordRetrieve(remainingChunks, query, semanticLimit)
                semanticTexts = raw.split('\n').filter((l) => l.trim().length > 0)
            }
        } else if (remainingChunks.length > 0) {
            const raw = this.keywordRetrieve(remainingChunks, query, semanticLimit)
            semanticTexts = raw.split('\n').filter((l) => l.trim().length > 0)
        }

        return [...recentTexts, ...semanticTexts].join('\n')
    }

    public retrieveRelevantContext(plants: Plant[], query: string, limit?: number): string {
        const chunks = this.buildChunks(plants)
        if (chunks.length === 0) {
            return 'No grow log entries found.'
        }

        const effectiveLimit = this.dynamicLimit(chunks.length, limit)
        return this.keywordRetrieve(chunks, query, effectiveLimit)
    }

    /**
     * Async context retrieval using sliding-window (recency + semantic relevance).
     * Falls back to keyword scoring transparently.
     */
    public async retrieveSemanticContext(
        plants: Plant[],
        query: string,
        limit?: number,
    ): Promise<string> {
        const chunks = this.buildChunks(plants)
        if (chunks.length === 0) {
            return 'No grow log entries found.'
        }

        const effectiveLimit = this.dynamicLimit(chunks.length, limit)
        return this.slidingWindowRetrieve(chunks, query, effectiveLimit)
    }

    /**
     * Grow-scoped keyword context retrieval.
     * Pre-filters plants by growId before building chunks.
     */
    public retrieveRelevantContextForGrow(
        plants: Plant[],
        query: string,
        growId: string,
        limit?: number,
    ): string {
        const growPlants = plants.filter((p) => p.growId === growId)
        return this.retrieveRelevantContext(growPlants, query, limit)
    }

    /**
     * Grow-scoped semantic context retrieval.
     * Pre-filters plants by growId before building chunks.
     */
    public async retrieveSemanticContextForGrow(
        plants: Plant[],
        query: string,
        growId: string,
        limit?: number,
    ): Promise<string> {
        const growPlants = plants.filter((p) => p.growId === growId)
        return this.retrieveSemanticContext(growPlants, query, limit)
    }

    /** Whether semantic (embedding-based) ranking is available. */
    public isSemanticRankingAvailable(): boolean {
        return checkSemanticAvailable()
    }
}

export const growLogRagService = new GrowLogRagService()
