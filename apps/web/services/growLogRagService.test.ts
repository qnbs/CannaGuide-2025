import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the embedding service before importing the module
vi.mock('@/services/local-ai', () => ({
    isEmbeddingModelReady: vi.fn(() => false),
    embedText: vi.fn(),
    embedBatch: vi.fn(),
    cosineSimilarity: vi.fn(),
    getCachedEmbedding: vi.fn(() => Promise.resolve(null)),
    getOrComputeEmbedding: vi.fn(() => Promise.resolve(new Float32Array(384))),
    isSemanticRankingAvailable: vi.fn(() => false),
}))

vi.mock('dompurify', () => ({
    default: {
        sanitize: (input: string, opts?: { ALLOWED_TAGS?: string[] }) => {
            if (opts?.ALLOWED_TAGS?.length === 0) {
                // Iteratively strip tags to avoid incomplete sanitization (CodeQL)
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

import { growLogRagService } from './growLogRagService'
import { JournalEntryType } from '@/types'
import type { Plant, JournalEntry } from '@/types'
import { isEmbeddingModelReady, embedText, embedBatch, cosineSimilarity } from '@/services/local-ai'
import {
    getCachedEmbedding as getCachedEmbeddingPersistent,
    isSemanticRankingAvailable,
} from '@/services/local-ai'

function makePlant(id: string, name: string, journal: Partial<JournalEntry>[]): Plant {
    return {
        id,
        name,
        journal: journal.map((j) => ({
            id: `j-${id}-${Math.random().toString(36).slice(2, 6)}`,
            type: j.type ?? 'note',
            notes: j.notes ?? '',
            createdAt: j.createdAt ?? Date.now(),
            ...j,
        })),
    } as unknown as Plant
}

describe('growLogRagService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty message when no plants', () => {
        const result = growLogRagService.retrieveRelevantContext([], 'watering')
        expect(result).toBe('No grow log entries found.')
    })

    it('returns empty message when plants have no journal', () => {
        const plant = makePlant('p1', 'TestPlant', [])
        const result = growLogRagService.retrieveRelevantContext([plant], 'water')
        expect(result).toBe('No grow log entries found.')
    })

    it('returns keyword-matched context lines', () => {
        const plant = makePlant('p1', 'BlueHaze', [
            {
                type: JournalEntryType.Watering,
                notes: 'Gave 500ml of water',
                createdAt: Date.now() - 1000,
            },
            {
                type: JournalEntryType.Observation,
                notes: 'Looking healthy',
                createdAt: Date.now() - 2000,
            },
            {
                type: JournalEntryType.Feeding,
                notes: 'Added nutrients NPK',
                createdAt: Date.now() - 3000,
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([plant], 'water')
        expect(result).toContain('BlueHaze')
        expect(result).toContain('water')
    })

    it('respects the limit parameter', () => {
        const entries = Array.from({ length: 10 }, (_, i) => ({
            type: JournalEntryType.Observation as const,
            notes: `Entry number ${i} about watering`,
            createdAt: Date.now() - i * 1000,
        }))
        const plant = makePlant('p2', 'TestStrain', entries)
        const result = growLogRagService.retrieveRelevantContext([plant], 'watering', 3)
        const lines = result.split('\n').filter(Boolean)
        expect(lines.length).toBeLessThanOrEqual(3)
    })

    it('handles multiple plants', () => {
        const p1 = makePlant('p1', 'PlantA', [
            { type: JournalEntryType.Observation, notes: 'Yellow leaves', createdAt: Date.now() },
        ])
        const p2 = makePlant('p2', 'PlantB', [
            {
                type: JournalEntryType.Observation,
                notes: 'Green and healthy',
                createdAt: Date.now(),
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([p1, p2], 'leaves')
        expect(result).toContain('PlantA')
    })

    it('sanitizes HTML in journal entries', () => {
        const plant = makePlant('p1', 'SafePlant', [
            {
                type: JournalEntryType.Observation,
                notes: '<script>alert(1)</script> healthy',
                createdAt: Date.now(),
            },
        ])
        const result = growLogRagService.retrieveRelevantContext([plant], 'healthy')
        expect(result).not.toContain('<script>')
    })

    it('returns empty message via async path when no entries', async () => {
        const result = await growLogRagService.retrieveSemanticContext([], 'test')
        expect(result).toBe('No grow log entries found.')
    })

    describe('isSemanticRankingAvailable', () => {
        it('delegates to ragEmbeddingCacheService', () => {
            vi.mocked(isSemanticRankingAvailable).mockReturnValue(true)
            expect(growLogRagService.isSemanticRankingAvailable()).toBe(true)

            vi.mocked(isSemanticRankingAvailable).mockReturnValue(false)
            expect(growLogRagService.isSemanticRankingAvailable()).toBe(false)
        })
    })

    describe('hybrid semantic ranking', () => {
        const makeVec = (values: number[]): Float32Array => {
            const vec = new Float32Array(384)
            for (let i = 0; i < values.length; i++) vec[i] = values[i] ?? 0
            return vec
        }

        it('ranks semantically similar entry higher than token-only match', async () => {
            // Enable semantic path
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)

            // Query embedding
            const queryVec = makeVec([1, 0, 0])
            vi.mocked(embedText).mockResolvedValue(queryVec)

            // Two entries: one with high semantic match, one with exact token match
            const p = makePlant('p1', 'TestPlant', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'Chlorose detected on lower leaves',
                    createdAt: Date.now() - 1000,
                },
                {
                    type: JournalEntryType.Observation,
                    notes: 'yellowing yellowing yellowing leaves',
                    createdAt: Date.now() - 2000,
                },
            ])

            // Semantic entry gets high cosine, token-only gets low
            const semanticVec = makeVec([0.99, 0.01, 0])
            const tokenVec = makeVec([0.1, 0.1, 0.8])
            vi.mocked(embedBatch).mockResolvedValue([semanticVec, tokenVec])
            vi.mocked(cosineSimilarity).mockImplementation((a: Float32Array, b: Float32Array) => {
                // Simplified: first element dominance
                const dotProduct = (a[0] ?? 0) * (b[0] ?? 0)
                return Math.min(1, Math.max(-1, dotProduct))
            })
            vi.mocked(getCachedEmbeddingPersistent).mockResolvedValue(null)

            const result = await growLogRagService.retrieveSemanticContext([p], 'yellowing leaves')
            const lines = result.split('\n').filter(Boolean)

            // The first line should be the semantically similar one (Chlorose)
            // because hybrid score: 0.6 * 0.99 + 0.3 * tokenScore + 0.1 * recency > token-only
            expect(lines.length).toBeGreaterThan(0)
            expect(lines[0]).toContain('Chlorose')
        })

        it('falls back to keyword ranking when embeddings unavailable', async () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(false)

            const p = makePlant('p1', 'TestPlant', [
                {
                    type: JournalEntryType.Watering,
                    notes: 'Gave water to the plant',
                    createdAt: Date.now() - 1000,
                },
            ])

            const result = await growLogRagService.retrieveSemanticContext([p], 'water')
            expect(result).toContain('water')
        })

        it('respects topK in hybrid mode', async () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            vi.mocked(embedText).mockResolvedValue(makeVec([1, 0, 0]))
            vi.mocked(embedBatch).mockResolvedValue(
                Array.from({ length: 10 }, () => makeVec([0.5, 0.5, 0])),
            )
            vi.mocked(cosineSimilarity).mockReturnValue(0.7)
            vi.mocked(getCachedEmbeddingPersistent).mockResolvedValue(null)

            const entries = Array.from({ length: 10 }, (_, i) => ({
                type: JournalEntryType.Observation as const,
                notes: `Entry ${i} about testing`,
                createdAt: Date.now() - i * 1000,
            }))
            const p = makePlant('p1', 'TestPlant', entries)

            const result = await growLogRagService.retrieveSemanticContext([p], 'testing', 3)
            // Sliding window: 3 recent + max(1, 3-3) semantic = at most 4
            const lines = result.split('\n').filter(Boolean)
            expect(lines.length).toBeLessThanOrEqual(4)
        })

        it('falls back to keyword when embedding throws', async () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            vi.mocked(embedText).mockRejectedValue(new Error('Model failed'))
            vi.mocked(getCachedEmbeddingPersistent).mockResolvedValue(null)

            const p = makePlant('p1', 'TestPlant', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'Keyword match here',
                    createdAt: Date.now(),
                },
            ])

            const result = await growLogRagService.retrieveSemanticContext([p], 'Keyword')
            expect(result).toContain('Keyword')
        })

        it('uses persistent cache when embeddings are pre-computed', async () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            const cachedVec = makeVec([0.9, 0.1, 0])
            vi.mocked(getCachedEmbeddingPersistent).mockResolvedValue(cachedVec)
            vi.mocked(embedText).mockResolvedValue(makeVec([1, 0, 0]))
            vi.mocked(cosineSimilarity).mockReturnValue(0.95)

            const p = makePlant('p1', 'TestPlant', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'Cached entry',
                    createdAt: Date.now(),
                },
            ])

            const result = await growLogRagService.retrieveSemanticContext([p], 'test')
            // embedBatch should NOT be called since cache provides the vector
            expect(embedBatch).not.toHaveBeenCalled()
            expect(result).toContain('Cached entry')
        })

        it('computes hybrid score combining semantic, token and recency', async () => {
            vi.mocked(isEmbeddingModelReady).mockReturnValue(true)
            vi.mocked(embedText).mockResolvedValue(makeVec([1, 0, 0]))
            vi.mocked(getCachedEmbeddingPersistent).mockResolvedValue(null)

            // One entry with known semantic score
            vi.mocked(embedBatch).mockResolvedValue([makeVec([0.8, 0.2, 0])])
            vi.mocked(cosineSimilarity).mockReturnValue(0.8)

            const p = makePlant('p1', 'TestPlant', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'test entry with content',
                    createdAt: Date.now(), // Recent = recency ~1.0
                },
            ])

            const result = await growLogRagService.retrieveSemanticContext([p], 'test', 10)
            // Even with semantic scoring, result should contain the entry text
            expect(result).toContain('test entry with content')
            expect(result).toContain('TestPlant')
        })
    })

    describe('grow-scoped retrieval', () => {
        function makeGrowPlant(
            id: string,
            name: string,
            growId: string,
            journal: Partial<JournalEntry>[],
        ): Plant {
            return {
                ...makePlant(id, name, journal),
                growId,
            } as unknown as Plant
        }

        it('retrieveRelevantContextForGrow filters by growId', () => {
            const p1 = makeGrowPlant('p1', 'PlantA', 'grow-1', [
                { type: JournalEntryType.Watering, notes: 'watered grow-1', createdAt: Date.now() },
            ])
            const p2 = makeGrowPlant('p2', 'PlantB', 'grow-2', [
                { type: JournalEntryType.Watering, notes: 'watered grow-2', createdAt: Date.now() },
            ])
            const result = growLogRagService.retrieveRelevantContextForGrow(
                [p1, p2],
                'watered',
                'grow-1',
            )
            expect(result).toContain('PlantA')
            expect(result).not.toContain('PlantB')
        })

        it('retrieveSemanticContextForGrow filters by growId', async () => {
            const p1 = makeGrowPlant('p1', 'PlantA', 'grow-1', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'green leaves',
                    createdAt: Date.now(),
                },
            ])
            const p2 = makeGrowPlant('p2', 'PlantB', 'grow-2', [
                {
                    type: JournalEntryType.Observation,
                    notes: 'yellow spots',
                    createdAt: Date.now(),
                },
            ])
            const result = await growLogRagService.retrieveSemanticContextForGrow(
                [p1, p2],
                'leaves',
                'grow-1',
            )
            expect(result).toContain('PlantA')
            expect(result).not.toContain('PlantB')
        })

        it('returns empty message when no plants match growId', () => {
            const p = makeGrowPlant('p1', 'PlantA', 'grow-1', [
                { type: JournalEntryType.Watering, notes: 'water', createdAt: Date.now() },
            ])
            const result = growLogRagService.retrieveRelevantContextForGrow(
                [p],
                'water',
                'nonexistent-grow',
            )
            expect(result).toBe('No grow log entries found.')
        })
    })
})
