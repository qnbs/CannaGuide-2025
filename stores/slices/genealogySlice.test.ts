import { describe, it, expect } from 'vitest'
import {
    sanitizeGenealogyState,
    isGenealogyStateCorrupt,
    initialGenealogyState,
} from '@/stores/slices/genealogySlice'
import { StrainType } from '@/types'

describe('genealogySlice', () => {
    describe('sanitizeGenealogyState', () => {
        it('returns initial state for null input', () => {
            const result = sanitizeGenealogyState(null)
            expect(result).toEqual(initialGenealogyState)
        })

        it('returns initial state for non-object input', () => {
            const result = sanitizeGenealogyState('invalid')
            expect(result).toEqual(initialGenealogyState)
        })

        it('resets status from loading to idle', () => {
            const raw = { ...initialGenealogyState, status: 'loading' }
            const result = sanitizeGenealogyState(raw)
            expect(result.status).toBe('idle')
        })

        it('preserves succeeded status', () => {
            const raw = { ...initialGenealogyState, status: 'succeeded' }
            const result = sanitizeGenealogyState(raw)
            expect(result.status).toBe('succeeded')
        })

        it('wipes trees on version mismatch but preserves layout', () => {
            const raw = {
                _version: -1,
                computedTrees: { s1: { id: 's1', name: 'Test', type: StrainType.Indica, thc: 10, isLandrace: true } },
                layoutOrientation: 'vertical',
                selectedStrainId: 'test-id',
                status: 'idle',
                zoomTransform: null,
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.computedTrees).toEqual({})
            expect(result.layoutOrientation).toBe('vertical')
            expect(result.selectedStrainId).toBe('test-id')
        })

        it('sanitizes valid computedTrees entries', () => {
            const raw = {
                ...initialGenealogyState,
                computedTrees: {
                    s1: { id: 's1', name: 'OG Kush', type: StrainType.Indica, thc: 20, isLandrace: true },
                    s2: null, // "not found" sentinel
                },
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.computedTrees['s1']).toBeDefined()
            expect(result.computedTrees['s1']!.name).toBe('OG Kush')
            expect(result.computedTrees['s2']).toBeNull()
        })

        it('drops corrupt tree entries silently', () => {
            const raw = {
                ...initialGenealogyState,
                computedTrees: {
                    bad: { noId: true }, // Missing id and name
                    good: { id: 'g1', name: 'Good', type: StrainType.Hybrid, thc: 15, isLandrace: false },
                },
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.computedTrees['bad']).toBeUndefined()
            expect(result.computedTrees['good']).toBeDefined()
        })

        it('validates zoomTransform', () => {
            const raw = {
                ...initialGenealogyState,
                zoomTransform: { k: 1.5, x: 100, y: 200 },
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.zoomTransform).toEqual({ k: 1.5, x: 100, y: 200 })
        })

        it('rejects invalid zoomTransform (k <= 0)', () => {
            const raw = {
                ...initialGenealogyState,
                zoomTransform: { k: 0, x: 0, y: 0 },
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.zoomTransform).toBeNull()
        })

        it('rejects invalid zoomTransform (NaN values)', () => {
            const raw = {
                ...initialGenealogyState,
                zoomTransform: { k: NaN, x: 100, y: 200 },
            }
            const result = sanitizeGenealogyState(raw)
            expect(result.zoomTransform).toBeNull()
        })
    })

    describe('isGenealogyStateCorrupt', () => {
        it('returns true for null', () => {
            expect(isGenealogyStateCorrupt(null)).toBe(true)
        })

        it('returns true for non-object', () => {
            expect(isGenealogyStateCorrupt('string')).toBe(true)
        })

        it('returns true for version mismatch', () => {
            expect(isGenealogyStateCorrupt({ ...initialGenealogyState, _version: -1 })).toBe(true)
        })

        it('returns true for status stuck on loading', () => {
            expect(isGenealogyStateCorrupt({ ...initialGenealogyState, status: 'loading' })).toBe(true)
        })

        it('returns false for valid initial state', () => {
            expect(isGenealogyStateCorrupt(initialGenealogyState)).toBe(false)
        })

        it('returns true for array computedTrees', () => {
            expect(isGenealogyStateCorrupt({ ...initialGenealogyState, computedTrees: [] })).toBe(true)
        })

        it('returns true for tree with missing id', () => {
            const corrupt = {
                ...initialGenealogyState,
                computedTrees: { s1: { name: 'NoId', type: StrainType.Indica } },
            }
            expect(isGenealogyStateCorrupt(corrupt)).toBe(true)
        })

        it('returns true for tree with invalid type', () => {
            const corrupt = {
                ...initialGenealogyState,
                computedTrees: { s1: { id: 's1', name: 'Bad', type: 'InvalidType' } },
            }
            expect(isGenealogyStateCorrupt(corrupt)).toBe(true)
        })

        it('accepts null tree entries (not found sentinel)', () => {
            const valid = {
                ...initialGenealogyState,
                computedTrees: { s1: null },
            }
            expect(isGenealogyStateCorrupt(valid)).toBe(false)
        })
    })
})
