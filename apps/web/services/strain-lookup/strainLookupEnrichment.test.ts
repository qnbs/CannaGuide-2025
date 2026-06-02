import { describe, expect, it } from 'vitest'
import {
    buildFlavonoidDataPoints,
    calculateEntourageScore,
    enrichTerpeneDataPoints,
    shannonDiversity,
} from '@/services/strain-lookup/strainLookupEnrichment'
import type { FlavonoidDataPoint, TerpeneDataPoint } from '@/services/strain-lookup/strainLookupTypes'

describe('strainLookupEnrichment', () => {
    it('shannonDiversity returns 0 for empty profile', () => {
        expect(shannonDiversity([])).toBe(0)
    })

    it('shannonDiversity is positive for mixed terpenes', () => {
        const terpenes: TerpeneDataPoint[] = [
            { name: 'Myrcene', percentage: 40 },
            { name: 'Limonene', percentage: 30 },
            { name: 'Pinene', percentage: 30 },
        ]
        expect(shannonDiversity(terpenes)).toBeGreaterThan(0)
    })

    it('buildFlavonoidDataPoints falls back to Hybrid for unknown type', () => {
        const hybrid = buildFlavonoidDataPoints('Hybrid')
        const unknown = buildFlavonoidDataPoints('UnknownType')
        expect(unknown).toEqual(hybrid)
        expect(unknown.length).toBeGreaterThan(0)
    })

    it('calculateEntourageScore combines terpene, flavonoid, and cannabinoid inputs', () => {
        const terpenes = enrichTerpeneDataPoints([
            { name: 'Myrcene', percentage: 50 },
            { name: 'Limonene', percentage: 30 },
        ])
        const flavonoids: FlavonoidDataPoint[] = buildFlavonoidDataPoints('Indica')
        const score = calculateEntourageScore(terpenes, 18, 2, flavonoids)
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(100)
    })

    it('enrichTerpeneDataPoints assigns roles and entourage scores', () => {
        const enriched = enrichTerpeneDataPoints([
            { name: 'Myrcene', percentage: 40 },
            { name: 'Limonene', percentage: 25 },
        ])
        expect(enriched[0]?.role).toBe('dominant')
        expect(enriched[1]?.role).toBe('secondary')
        expect(enriched[0]?.entourageScore).toBeGreaterThan(0)
    })
})
