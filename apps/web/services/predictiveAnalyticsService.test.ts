import { describe, it, expect } from 'vitest'
import { predictiveAnalyticsService } from './predictiveAnalyticsService'
import type { TimeSeriesEntry, AggregatedStats } from './timeSeriesService'
import type { Plant } from '@/types'
import { PlantStage } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePlant = (overrides: Partial<Plant> = {}): Plant =>
    ({
        id: 'test-plant-1',
        name: 'Test Plant',
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
        ...overrides,
    }) as unknown as Plant

const makeStats = (overrides: Partial<AggregatedStats> = {}): AggregatedStats => ({
    avgTemperature: 24,
    avgHumidity: 55,
    avgVpd: 1.1,
    avgPh: 6.2,
    minTemperature: 22,
    maxTemperature: 26,
    minHumidity: 50,
    maxHumidity: 60,
    sampleCount: 100,
    ...overrides,
})

const makeEntry = (overrides: Partial<TimeSeriesEntry> = {}): TimeSeriesEntry => ({
    deviceId: 'test',
    timestamp: Date.now(),
    resolution: 'raw',
    temperatureC: 24,
    humidityPercent: 55,
    vpd: 1.1,
    ph: 6.2,
    sampleCount: 1,
    ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('predictiveAnalyticsService', () => {
    describe('assessBotrytisRisk', () => {
        it('returns low risk for optimal conditions', () => {
            const plant = makePlant({ stage: PlantStage.Vegetative })
            const stats = makeStats({ avgHumidity: 50, maxHumidity: 55, avgVpd: 1.0 })
            const result = predictiveAnalyticsService.assessBotrytisRisk([], stats, plant)

            expect(result.riskLevel).toBe('low')
            expect(result.riskScore).toBeLessThan(25)
        })

        it('returns high or critical risk for humid flowering conditions', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({
                avgHumidity: 75,
                maxHumidity: 88,
                avgTemperature: 22,
                avgVpd: 0.3,
            })
            const result = predictiveAnalyticsService.assessBotrytisRisk([], stats, plant)

            expect(['high', 'critical']).toContain(result.riskLevel)
            expect(result.riskScore).toBeGreaterThanOrEqual(45)
            expect(result.factors.length).toBeGreaterThan(0)
        })

        it('returns critical risk for extreme conditions', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({
                avgHumidity: 85,
                maxHumidity: 95,
                avgTemperature: 20,
                avgVpd: 0.2,
            })
            const result = predictiveAnalyticsService.assessBotrytisRisk([], stats, plant)

            expect(result.riskLevel).toBe('critical')
            expect(result.riskScore).toBeGreaterThanOrEqual(70)
        })
    })

    describe('checkEnvironment', () => {
        it('returns no alerts for optimal conditions', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({
                avgTemperature: 23,
                avgHumidity: 48,
                avgVpd: 1.2,
                avgPh: 6.1,
            })
            const alerts = predictiveAnalyticsService.checkEnvironment(stats, plant)
            expect(alerts.length).toBe(0)
        })

        it('generates temperature alert when too hot', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({ avgTemperature: 35 })
            const alerts = predictiveAnalyticsService.checkEnvironment(stats, plant)

            const tempAlert = alerts.find((a) => a.type === 'temperature')
            expect(tempAlert).toBeDefined()
            expect(tempAlert?.severity).toBe('high')
        })

        it('generates pH alert when out of range', () => {
            const plant = makePlant()
            const stats = makeStats({ avgPh: 7.5 })
            const alerts = predictiveAnalyticsService.checkEnvironment(stats, plant)

            const phAlert = alerts.find((a) => a.type === 'ph')
            expect(phAlert).toBeDefined()
        })

        it('returns empty for zero samples', () => {
            const plant = makePlant()
            const stats = makeStats({ sampleCount: 0 })
            const alerts = predictiveAnalyticsService.checkEnvironment(stats, plant)
            expect(alerts).toEqual([])
        })
    })

    describe('estimateYieldImpact', () => {
        it('shows minimal impact for optimal conditions', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({ avgTemperature: 23, avgVpd: 1.25, maxHumidity: 55 })
            const result = predictiveAnalyticsService.estimateYieldImpact(stats, [], plant)

            expect(result.impactPercent).toBeGreaterThanOrEqual(-5)
        })

        it('shows negative impact for poor conditions', () => {
            const plant = makePlant({ stage: PlantStage.Flowering })
            const stats = makeStats({
                avgTemperature: 35,
                avgVpd: 2.5,
                maxHumidity: 90,
            })
            const alerts = [
                {
                    type: 'temperature' as const,
                    severity: 'high' as const,
                    message: '',
                    currentValue: 35,
                    idealRange: [20, 26] as [number, number],
                },
                {
                    type: 'humidity' as const,
                    severity: 'high' as const,
                    message: '',
                    currentValue: 90,
                    idealRange: [40, 55] as [number, number],
                },
            ]
            const result = predictiveAnalyticsService.estimateYieldImpact(stats, alerts, plant)

            expect(result.impactPercent).toBeLessThan(-10)
            expect(result.factors.length).toBeGreaterThan(0)
        })

        it('returns zero impact with no data', () => {
            const plant = makePlant()
            const stats = makeStats({ sampleCount: 0 })
            const result = predictiveAnalyticsService.estimateYieldImpact(stats, [], plant)
            expect(result.impactPercent).toBe(0)
        })
    })

    describe('countSustainedHighHumidity', () => {
        it('counts sustained high humidity windows', () => {
            const now = Date.now()
            const entries = [
                makeEntry({ timestamp: now, humidityPercent: 80 }),
                makeEntry({ timestamp: now + 3_600_000, humidityPercent: 82 }),
                makeEntry({ timestamp: now + 7_200_000, humidityPercent: 78 }),
                makeEntry({ timestamp: now + 10_800_000, humidityPercent: 50 }),
            ]

            const count = predictiveAnalyticsService.countSustainedHighHumidity(
                entries,
                65,
                4 * 3_600_000,
            )
            // The window from now to now+7200000 is only ~2h, not 4h
            expect(count).toBe(0)
        })

        it('detects a window long enough', () => {
            const now = Date.now()
            const entries = [
                makeEntry({ timestamp: now, humidityPercent: 80 }),
                makeEntry({ timestamp: now + 5 * 3_600_000, humidityPercent: 82 }),
                makeEntry({ timestamp: now + 6 * 3_600_000, humidityPercent: 40 }),
            ]

            const count = predictiveAnalyticsService.countSustainedHighHumidity(
                entries,
                65,
                4 * 3_600_000,
            )
            expect(count).toBe(1)
        })
    })

    describe('scoreToLevel', () => {
        it('maps scores to correct risk levels', () => {
            expect(predictiveAnalyticsService.scoreToLevel(10)).toBe('low')
            expect(predictiveAnalyticsService.scoreToLevel(30)).toBe('moderate')
            expect(predictiveAnalyticsService.scoreToLevel(50)).toBe('high')
            expect(predictiveAnalyticsService.scoreToLevel(80)).toBe('critical')
        })
    })
})
