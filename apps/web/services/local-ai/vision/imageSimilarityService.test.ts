import { describe, it, expect, beforeEach } from 'vitest'
import {
    cosineSimilarity,
    IMAGE_FEATURE_DIM,
    resetImageSimilarityPipeline,
} from './imageSimilarityService'

// We test the utility functions since CLIP model loading requires the actual runtime.

describe('localAiImageSimilarityService', () => {
    beforeEach(() => {
        resetImageSimilarityPipeline()
    })

    describe('cosineSimilarity', () => {
        it('returns 1 for identical vectors', () => {
            const vec = new Float32Array([1, 2, 3, 4])
            expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5)
        })

        it('returns 0 for orthogonal vectors', () => {
            const a = new Float32Array([1, 0, 0, 0])
            const b = new Float32Array([0, 1, 0, 0])
            expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5)
        })

        it('returns 0 for empty vectors', () => {
            const empty = new Float32Array(0)
            expect(cosineSimilarity(empty, empty)).toBe(0)
        })

        it('returns 0 for mismatched lengths', () => {
            const a = new Float32Array([1, 2, 3])
            const b = new Float32Array([1, 2])
            expect(cosineSimilarity(a, b)).toBe(0)
        })

        it('handles negative values correctly', () => {
            const a = new Float32Array([1, 0])
            const b = new Float32Array([-1, 0])
            expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5)
        })

        it('returns value between -1 and 1', () => {
            const a = new Float32Array([0.5, -0.3, 0.8, 0.1])
            const b = new Float32Array([0.2, 0.7, -0.4, 0.6])
            const sim = cosineSimilarity(a, b)
            expect(sim).toBeGreaterThanOrEqual(-1)
            expect(sim).toBeLessThanOrEqual(1)
        })
    })

    describe('constants', () => {
        it('exports feature dimension as 768', () => {
            expect(IMAGE_FEATURE_DIM).toBe(768)
        })
    })
})
