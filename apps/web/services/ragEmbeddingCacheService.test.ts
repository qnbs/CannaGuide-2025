import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module
vi.mock('@/services/indexedDbLruCache', () => {
    const entries = new Map<string, unknown>()
    return {
        createIndexedDbLruCache: vi.fn(() => ({
            get: vi.fn((key: string) => Promise.resolve(entries.get(key) ?? null)),
            set: vi.fn((entry: { key: string }) => {
                entries.set(entry.key, entry)
                return Promise.resolve()
            }),
            clear: vi.fn(() => {
                entries.clear()
                return Promise.resolve()
            }),
            count: vi.fn(() => Promise.resolve(entries.size)),
            hashKey: vi.fn((input: string) => input),
            resetDbPromise: vi.fn(),
            updateConfig: vi.fn(),
            openDb: vi.fn(),
            _entries: entries,
        })),
    }
})

vi.mock('@/services/localAiEmbeddingService', () => ({
    embedText: vi.fn(() => Promise.resolve(new Float32Array([0.1, 0.2, 0.3]))),
    isEmbeddingModelReady: vi.fn(() => true),
    cosineSimilarity: vi.fn(() => 0.9),
}))

vi.mock('@/services/inferenceQueueService', () => ({
    isWorkerAvailable: vi.fn(() => true),
}))

vi.mock('@/services/aiEcoModeService', () => ({
    isEcoMode: vi.fn(() => false),
}))

vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

vi.mock('dompurify', () => ({
    default: {
        sanitize: (input: string, opts?: { ALLOWED_TAGS?: string[] }) => {
            if (opts?.ALLOWED_TAGS?.length === 0) {
                let result = input
                let previous = ''
                while (result !== previous) {
                    previous = result
                    result = result.replace(/<[^>]*>/g, '')
                }
                return result
            }
            return input
        },
    },
}))

import {
    getOrComputeEmbedding,
    getCachedEmbedding,
    precomputeEmbeddings,
    startBackgroundPrecomputation,
    isSemanticRankingAvailable,
    isPrecomputationComplete,
    getStats,
    clearEmbeddingCache,
    resetCacheState,
} from './ragEmbeddingCacheService'
import { embedText, isEmbeddingModelReady } from '@/services/localAiEmbeddingService'
import { isWorkerAvailable } from '@/services/inferenceQueueService'
import { isEcoMode } from '@/services/aiEcoModeService'
import { createIndexedDbLruCache } from '@/services/indexedDbLruCache'
import type { Plant, JournalEntryType } from '@/types'

const getCacheEntries = (): Map<string, unknown> => {
    const mockCache = (createIndexedDbLruCache as ReturnType<typeof vi.fn>).mock.results[0]
        ?.value as { _entries: Map<string, unknown> }
    return mockCache?._entries ?? new Map()
}

describe('ragEmbeddingCacheService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetCacheState()
        getCacheEntries().clear()
    })

    describe('getCachedEmbedding', () => {
        it('returns null on cache miss', async () => {
            const result = await getCachedEmbedding('missing-key')
            expect(result).toBeNull()
        })

        it('returns cached embedding on hit with matching model version', async () => {
            // Pre-populate cache via getOrComputeEmbedding
            await getOrComputeEmbedding('test text', 'test-key')
            const result = await getCachedEmbedding('test-key')
            expect(result).toBeTruthy()
            expect(result).toBeInstanceOf(Float32Array)
        })
    })

    describe('getOrComputeEmbedding', () => {
        it('returns cached embedding when available', async () => {
            // First call computes
            await getOrComputeEmbedding('hello world', 'key1')
            vi.mocked(embedText).mockClear()

            // Second call should use cache
            const result = await getOrComputeEmbedding('hello world', 'key1')
            expect(result).toBeInstanceOf(Float32Array)
            // embedText should not be called again (cache hit)
            expect(embedText).not.toHaveBeenCalled()
        })

        it('computes and caches embedding when not present', async () => {
            const result = await getOrComputeEmbedding('new text', 'new-key')
            expect(result).toBeInstanceOf(Float32Array)
            expect(embedText).toHaveBeenCalledWith('new text')

            const stats = await getStats()
            expect(stats.misses).toBeGreaterThan(0)
        })
    })

    describe('precomputeEmbeddings', () => {
        it('computes embeddings for uncached entries', async () => {
            const entries = [
                { text: 'entry one', key: 'k1' },
                { text: 'entry two', key: 'k2' },
                { text: 'entry three', key: 'k3' },
            ]
            const computed = await precomputeEmbeddings(entries)
            expect(computed).toBe(3)
            expect(embedText).toHaveBeenCalledTimes(3)
        })

        it('returns 0 when all entries are already cached', async () => {
            // Pre-populate
            await getOrComputeEmbedding('text', 'k1')
            vi.mocked(embedText).mockClear()

            const computed = await precomputeEmbeddings([{ text: 'text', key: 'k1' }])
            expect(computed).toBe(0)
        })
    })

    describe('startBackgroundPrecomputation', () => {
        it('skips when EcoMode is active', () => {
            vi.mocked(isEcoMode).mockReturnValue(true)
            const plant = makePlant('p1', [{ notes: 'test', createdAt: Date.now() }])
            startBackgroundPrecomputation([plant])
            expect(embedText).not.toHaveBeenCalled()
        })

        it('skips when worker is unavailable', () => {
            vi.mocked(isWorkerAvailable).mockReturnValue(false)
            const plant = makePlant('p1', [{ notes: 'test', createdAt: Date.now() }])
            startBackgroundPrecomputation([plant])
            expect(embedText).not.toHaveBeenCalled()
        })

        it('skips when embedding model is not ready', () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(false)
            const plant = makePlant('p1', [{ notes: 'test', createdAt: Date.now() }])
            startBackgroundPrecomputation([plant])
            expect(embedText).not.toHaveBeenCalled()
        })
    })

    describe('isSemanticRankingAvailable', () => {
        it('returns true when model ready and worker available', () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            vi.mocked(isWorkerAvailable).mockReturnValue(true)
            expect(isSemanticRankingAvailable()).toBe(true)
        })

        it('returns false when model not ready', () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(false)
            vi.mocked(isWorkerAvailable).mockReturnValue(true)
            expect(isSemanticRankingAvailable()).toBe(false)
        })

        it('returns false when worker not available', () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            vi.mocked(isWorkerAvailable).mockReturnValue(false)
            expect(isSemanticRankingAvailable()).toBe(false)
        })
    })

    describe('getStats', () => {
        it('tracks hits and misses correctly', async () => {
            // Compute (miss)
            await getOrComputeEmbedding('text1', 'stats-kA')
            // Hit
            await getOrComputeEmbedding('text1', 'stats-kA')

            const stats = await getStats()
            expect(stats.hits).toBeGreaterThanOrEqual(1)
            expect(stats.misses).toBeGreaterThanOrEqual(1)
            expect(stats.total).toBeGreaterThanOrEqual(1)
        })
    })

    describe('clearEmbeddingCache', () => {
        it('resets counters and cache', async () => {
            await getOrComputeEmbedding('text', 'k')
            await clearEmbeddingCache()

            const stats = await getStats()
            expect(stats.hits).toBe(0)
            expect(stats.misses).toBe(0)
            expect(isPrecomputationComplete()).toBe(false)
        })
    })
})

function makePlant(id: string, journal: Array<{ notes: string; createdAt: number }>): Plant {
    return {
        id,
        name: `Plant ${id}`,
        journal: journal.map((j) => ({
            id: `j-${id}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'OBSERVATION' as JournalEntryType,
            notes: j.notes,
            createdAt: j.createdAt,
        })),
    } as unknown as Plant
}
