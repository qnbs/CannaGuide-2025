import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
    cosineSimilarity,
    EMBEDDING_DIM,
    resetEmbeddingPipeline,
} from '@/services/localAiEmbeddingService'

vi.mock('@xenova/transformers', () => ({
    env: {},
    pipeline: vi.fn(async () =>
        vi.fn(async () => ({
            data: new Float32Array(384).fill(0.1),
        })),
    ),
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

describe('localAiEmbeddingService', () => {
    beforeEach(() => {
        resetEmbeddingPipeline()
    })

    it('exports the correct embedding dimension', () => {
        expect(EMBEDDING_DIM).toBe(384)
    })

    it('computes cosine similarity correctly for identical vectors', () => {
        const a = new Float32Array([1, 0, 0])
        const b = new Float32Array([1, 0, 0])
        expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5)
    })

    it('computes cosine similarity correctly for orthogonal vectors', () => {
        const a = new Float32Array([1, 0, 0])
        const b = new Float32Array([0, 1, 0])
        expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5)
    })

    it('computes cosine similarity correctly for opposite vectors', () => {
        const a = new Float32Array([1, 0, 0])
        const b = new Float32Array([-1, 0, 0])
        expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5)
    })

    it('handles zero vectors gracefully', () => {
        const a = new Float32Array([0, 0, 0])
        const b = new Float32Array([1, 0, 0])
        expect(cosineSimilarity(a, b)).toBe(0)
    })

    it('embedText returns a Float32Array', async () => {
        const { embedText } = await import('@/services/localAiEmbeddingService')
        const result = await embedText('test input')
        expect(result).toBeInstanceOf(Float32Array)
        expect(result.length).toBe(384)
    })

    it('embedBatch returns correct number of embeddings', async () => {
        const { embedBatch } = await import('@/services/localAiEmbeddingService')
        const results = await embedBatch(['text one', 'text two', 'text three'])
        expect(results).toHaveLength(3)
        results.forEach((r) => {
            expect(r).toBeInstanceOf(Float32Array)
            expect(r.length).toBe(384)
        })
    })

    it('embedBatch returns empty array for empty input', async () => {
        const { embedBatch } = await import('@/services/localAiEmbeddingService')
        const results = await embedBatch([])
        expect(results).toHaveLength(0)
    })

    it('semanticRank returns ranked results', async () => {
        const { semanticRank } = await import('@/services/localAiEmbeddingService')
        const results = await semanticRank('watering', [
            'water the plant',
            'trim leaves',
            'check pH',
        ])
        expect(results.length).toBeGreaterThan(0)
        expect(results[0]).toHaveProperty('index')
        expect(results[0]).toHaveProperty('score')
    })

    it('semanticRank returns empty array for empty candidates', async () => {
        const { semanticRank } = await import('@/services/localAiEmbeddingService')
        const results = await semanticRank('watering', [])
        expect(results).toHaveLength(0)
    })
})
