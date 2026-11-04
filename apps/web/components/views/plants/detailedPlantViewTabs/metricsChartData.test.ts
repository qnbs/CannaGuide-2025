import { describe, expect, it } from 'vitest'
import type { HydroReading, MetricsReading } from '@/types'
import { buildMetricsChartData } from './metricsChartData'

const metric = (timestamp: number, height: number): MetricsReading => ({
    id: `m${String(timestamp)}-${String(height)}`,
    plantId: 'p1',
    timestamp,
    height,
})

const hydro = (timestamp: number, ph: number): HydroReading => ({
    id: `h${String(timestamp)}-${String(ph)}`,
    timestamp,
    ph,
    ec: 1.4,
    waterTemp: 21,
})

describe('buildMetricsChartData', () => {
    it('merges both histories since the cutoff into one time-ordered series', () => {
        const points = buildMetricsChartData(
            [metric(30, 12), metric(5, 9), metric(10, 10)],
            [hydro(20, 6.1), hydro(10, 5.9), hydro(1, 5.0)],
            10,
            1.2,
        )

        expect(points.map(({ height, ph }) => [height, ph])).toEqual([
            [10, 5.9],
            [undefined, 6.1],
            [12, undefined],
        ])
        expect(points.every(({ vpd }) => vpd === 1.2)).toBe(true)
    })

    it('shows the first entry of an instant, as before', () => {
        const points = buildMetricsChartData(
            [metric(10, 1), metric(10, 2)],
            [hydro(10, 6.0), hydro(10, 7.0)],
            0,
            1,
        )

        expect(points).toHaveLength(1)
        expect(points[0]).toMatchObject({ height: 1, ph: 6.0 })
    })

    it('handles a long, dense history inside the window', () => {
        const count = 20_000
        const metrics = Array.from({ length: count }, (_, i) => metric(i, i))
        const readings = Array.from({ length: count }, (_, i) => hydro(i, 6))

        const points = buildMetricsChartData(metrics, readings, 0, 1)

        expect(points).toHaveLength(count)
        expect(points.at(-1)).toMatchObject({ height: count - 1, ph: 6 })
    })
})
