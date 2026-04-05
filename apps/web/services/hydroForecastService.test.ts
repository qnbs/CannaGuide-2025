import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { HydroReading } from '@/types'

// Mock workerBus
vi.mock('@/services/workerBus', () => ({
    workerBus: {
        register: vi.fn(),
        dispatch: vi.fn(),
    },
}))

// Mock localOnlyModeService
vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn().mockReturnValue(false),
}))

// Mock sentryService
vi.mock('@/services/sentryService', () => ({
    captureLocalAiError: vi.fn(),
}))

function makeReading(ph: number, ec: number, waterTemp: number, hoursAgo: number): HydroReading {
    return {
        id: `r-${hoursAgo}`,
        timestamp: Date.now() - hoursAgo * 3600_000,
        ph,
        ec,
        waterTemp,
    }
}

describe('hydroForecastService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset module state by re-importing
        vi.resetModules()
    })

    it('returns basic forecast with insufficient readings', async () => {
        const { forecastNextHour } = await import('./hydroForecastService')
        const result = await forecastNextHour([makeReading(6.0, 1.5, 21.0, 1)])

        expect(result.modelBased).toBe(false)
        expect(result.confidence).toBe(0)
        expect(result.trend).toBe('stable')
        expect(result.nextHour.ph).toBe(6.0)
    })

    it('computes moving-average fallback correctly for 3 readings', async () => {
        const { forecastNextHour } = await import('./hydroForecastService')
        const readings = [
            makeReading(6.0, 1.4, 20.0, 3),
            makeReading(6.2, 1.6, 21.0, 2),
            makeReading(6.4, 1.8, 22.0, 1),
        ]

        const result = await forecastNextHour(readings)

        // Weighted average should be close to the inputs but biased toward recent
        expect(result.nextHour.ph).toBeGreaterThan(6.0)
        expect(result.nextHour.ph).toBeLessThan(6.5)
        expect(result.nextHour.ec).toBeGreaterThan(1.4)
        expect(result.nextHour.ec).toBeLessThan(1.9)
        expect(result.modelBased).toBe(false)
    })

    it('detects rising trend when pH increases', async () => {
        const { forecastNextHour } = await import('./hydroForecastService')
        // First half: low pH, second half: high pH (delta > 0.15 threshold)
        const readings = [
            makeReading(5.5, 1.5, 21.0, 6),
            makeReading(5.6, 1.5, 21.0, 5),
            makeReading(5.6, 1.5, 21.0, 4),
            makeReading(6.0, 1.5, 21.0, 3),
            makeReading(6.2, 1.5, 21.0, 2),
            makeReading(6.3, 1.5, 21.0, 1),
        ]

        const result = await forecastNextHour(readings)
        expect(result.trend).toBe('rising')
    })

    it('detects critical trend when pH out of safe range', async () => {
        const { forecastNextHour } = await import('./hydroForecastService')
        const readings = [
            makeReading(4.0, 1.5, 21.0, 3),
            makeReading(4.2, 1.5, 21.0, 2),
            makeReading(4.5, 1.5, 21.0, 1), // pH 4.5 < 5.0 (SAFE_PH_MIN - 0.5)
        ]

        const result = await forecastNextHour(readings)
        expect(result.trend).toBe('critical')
    })

    it('isModelReady returns false when no model loaded', async () => {
        const { isModelReady } = await import('./hydroForecastService')
        expect(isModelReady()).toBe(false)
    })
})
