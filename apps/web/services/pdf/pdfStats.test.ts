import { describe, expect, it } from 'vitest'
import type { MetricsReading } from '@/types'
import { computeMetricStats, valueRange } from './pdfStats'

describe('valueRange', () => {
    it('returns the smallest and largest value', () => {
        expect(valueRange([3, -2, 7.5, 0])).toEqual({ min: -2, max: 7.5 })
        expect(valueRange([4])).toEqual({ min: 4, max: 4 })
    })

    it('handles a list too long to spread into Math.min', () => {
        const values = Array.from({ length: 1_000_000 }, (_, i) => i % 1000)
        expect(valueRange(values)).toEqual({ min: 0, max: 999 })
    })
})

describe('computeMetricStats', () => {
    it('reports a long kept history without failing (GH #814)', () => {
        const readings: MetricsReading[] = Array.from({ length: 1_000_000 }, (_, i) => ({
            id: `m${String(i)}`,
            plantId: 'p1',
            timestamp: i,
            height: 10 + (i % 50),
        }))

        expect(computeMetricStats(readings)).toEqual([
            { label: 'Height', min: '10.0', max: '59.0', avg: '34.5', unit: 'cm' },
        ])
    })
})
