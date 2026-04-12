import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePredictiveAnalytics } from './usePredictiveAnalytics'
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService'
import type { PredictiveInsight } from '@/services/predictiveAnalyticsService'
import type { Plant } from '@/types'
import { PlantStage } from '@/types'

vi.mock('@/services/predictiveAnalyticsService', () => ({
    predictiveAnalyticsService: {
        analyze: vi.fn(),
    },
}))

vi.mock('@sentry/browser', () => ({
    addBreadcrumb: vi.fn(),
}))

const mockAnalyze = vi.mocked(predictiveAnalyticsService.analyze)

const makePlant = (id: string, name: string): Plant =>
    ({
        id,
        name,
        stage: PlantStage.Flowering,
        health: 85,
        stressLevel: 15,
        height: 80,
        age: 60,
        biomass: { total: 200, flowers: 100, leaves: 60, stems: 40 },
        leafAreaIndex: 4,
        environment: {
            internalTemperature: 24,
            internalHumidity: 55,
            vpd: 1.1,
            co2: 400,
        },
        medium: { ph: 6.2, ec: 1.5, moisture: 55, microbeHealth: 80, substrateWater: 50 },
        rootSystem: { health: 85, density: 70, reach: 60 },
        equipment: {
            light: { wattage: 400, lightHours: 12, spectrum: 'full' },
            potSize: 20,
        },
        problems: [],
        mediumType: 'Soil',
        strain: { type: 'Hybrid', thc: 20, cbd: 1, floweringTime: 9 },
    }) as unknown as Plant

const makeInsight = (riskLevel: 'low' | 'moderate' | 'high' | 'critical'): PredictiveInsight => ({
    botrytisRisk: {
        riskLevel,
        riskScore:
            riskLevel === 'low'
                ? 10
                : riskLevel === 'moderate'
                  ? 30
                  : riskLevel === 'high'
                    ? 55
                    : 80,
        factors: [],
        recommendation: 'test recommendation',
    },
    environmentAlerts: [],
    yieldImpact: { impactPercent: 0, description: 'Optimal', factors: [] },
    analyzedSamples: 50,
    analysisTimestamp: Date.now(),
})

describe('usePredictiveAnalytics', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty insights for no plants', () => {
        const { result } = renderHook(() => usePredictiveAnalytics([], 'default'))
        expect(result.current.insights.size).toBe(0)
        expect(result.current.loading).toBe(false)
        expect(result.current.worstRisk).toBeNull()
    })

    it('analyzes a single plant and returns insight', async () => {
        const insight = makeInsight('low')
        mockAnalyze.mockResolvedValueOnce(insight)

        const plant = makePlant('p1', 'Plant A')
        const { result } = renderHook(() => usePredictiveAnalytics([plant], 'device-1'))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.insights.size).toBe(1)
        expect(result.current.insights.get('p1')).toEqual(insight)
        expect(result.current.worstRisk).toBe('low')
        expect(mockAnalyze).toHaveBeenCalledWith(plant, 'device-1')
    })

    it('computes worst risk across multiple plants', async () => {
        mockAnalyze
            .mockResolvedValueOnce(makeInsight('low'))
            .mockResolvedValueOnce(makeInsight('high'))

        const plants = [makePlant('p1', 'A'), makePlant('p2', 'B')]
        const { result } = renderHook(() => usePredictiveAnalytics(plants))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.insights.size).toBe(2)
        expect(result.current.worstRisk).toBe('high')
    })

    it('handles analysis failure gracefully for one plant', async () => {
        mockAnalyze
            .mockResolvedValueOnce(makeInsight('moderate'))
            .mockRejectedValueOnce(new Error('sensor offline'))

        const plants = [makePlant('p1', 'A'), makePlant('p2', 'B')]
        const { result } = renderHook(() => usePredictiveAnalytics(plants))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.insights.size).toBe(1)
        expect(result.current.insights.has('p1')).toBe(true)
        expect(result.current.insights.has('p2')).toBe(false)
        expect(result.current.worstRisk).toBe('moderate')
    })

    it('returns critical as worst risk when present', async () => {
        mockAnalyze
            .mockResolvedValueOnce(makeInsight('moderate'))
            .mockResolvedValueOnce(makeInsight('critical'))

        const plants = [makePlant('p1', 'A'), makePlant('p2', 'B')]
        const { result } = renderHook(() => usePredictiveAnalytics(plants))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(result.current.worstRisk).toBe('critical')
    })

    it('provides a refresh function', async () => {
        mockAnalyze.mockResolvedValue(makeInsight('low'))

        const plant = makePlant('p1', 'A')
        const { result } = renderHook(() => usePredictiveAnalytics([plant]))

        await waitFor(() => expect(result.current.loading).toBe(false))
        expect(mockAnalyze).toHaveBeenCalledTimes(1)

        // Manual refresh
        act(() => {
            result.current.refresh()
        })
        await waitFor(() => expect(mockAnalyze).toHaveBeenCalledTimes(2))
    })
})
