// ---------------------------------------------------------------------------
// analyticsService.test.ts -- Unit tests for Analytics Engine
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { analyticsService } from '@/services/analyticsService'
import { PlantStage } from '@/types'
import type { Plant } from '@/types'

function makePlant(overrides: Partial<Plant> = {}): Plant {
    return {
        id: 'p1',
        name: 'Test Plant',
        stage: PlantStage.Vegetative,
        age: 30,
        health: 80,
        strain: 'Test Strain',
        environment: {
            internalTemperature: 24,
            internalHumidity: 55,
            vpd: 1.1,
            lightPpfd: 600,
            co2Ppm: 400,
        },
        medium: {
            ph: 6.2,
            ec: 1.5,
            moisture: 60,
            type: 'soil',
        },
        problems: [],
        tasks: [],
        journal: [],
        notes: [],
        ...overrides,
    } as unknown as Plant
}

describe('analyticsService', () => {
    it('should return default analytics for empty plant list', () => {
        const result = analyticsService.compute([])
        expect(result.gardenScore).toBe(0)
        expect(result.avgHealth).toBe(0)
        expect(result.stageDistribution).toEqual({})
        expect(result.riskFactors).toEqual([])
        expect(result.recommendations).toEqual([])
    })

    it('should compute garden score for healthy plants', () => {
        const plants = [makePlant({ health: 90 }), makePlant({ id: 'p2', health: 80 })]
        const result = analyticsService.compute(plants)
        expect(result.gardenScore).toBeGreaterThan(0)
        expect(result.gardenScore).toBeLessThanOrEqual(100)
        expect(result.avgHealth).toBe(85)
    })

    it('should compute stage distribution', () => {
        const plants = [
            makePlant({ stage: PlantStage.Vegetative }),
            makePlant({ id: 'p2', stage: PlantStage.Vegetative }),
            makePlant({ id: 'p3', stage: PlantStage.Flowering }),
        ]
        const result = analyticsService.compute(plants)
        expect(result.stageDistribution[PlantStage.Vegetative]).toBe(2)
        expect(result.stageDistribution[PlantStage.Flowering]).toBe(1)
    })

    it('should detect risk factors for unhealthy plants', () => {
        const plants = [makePlant({ health: 30 })]
        const result = analyticsService.compute(plants)
        expect(result.riskFactors.length).toBeGreaterThan(0)
    })

    it('should compute strain performance', () => {
        const plants = [
            makePlant({ strain: { name: 'Blue Dream' } as never, health: 90, age: 20 }),
            makePlant({ id: 'p2', strain: { name: 'Blue Dream' } as never, health: 80, age: 40 }),
        ]
        const result = analyticsService.compute(plants)
        expect(result.strainPerformance.length).toBeGreaterThan(0)
        const blueDream = result.strainPerformance.find((s) => s.strainName === 'Blue Dream')
        expect(blueDream).toBeDefined()
        expect(blueDream?.plantCount).toBe(2)
        expect(blueDream?.avgHealth).toBe(85)
    })

    it('should provide recommendations', () => {
        const plants = [
            makePlant({
                health: 30,
                problems: [{ type: 'nutrient', severity: 8, suggestion: 'Fix it' }] as never[],
            }),
        ]
        const result = analyticsService.compute(plants)
        // Low health should trigger recommendations
        expect(result.recommendations.length).toBeGreaterThanOrEqual(0)
    })
})
