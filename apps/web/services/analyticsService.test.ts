/**
 * Unit tests for analyticsService (AnalyticsEngine).
 *
 * The analytics engine is a pure computation class with no external
 * dependencies — tests run synchronously without mocks.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { analyticsService } from '@/services/analyticsService'
import { plantSimulationService } from '@/services/plantSimulationService'
import { PlantStage, StrainType, JournalEntryType } from '@/types'
import type { Plant, Strain, GrowSetup } from '@/types'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const testStrain: Strain = {
    id: 'strain-analytics-test',
    name: 'Analytics Strain',
    type: StrainType.Hybrid,
    thc: 20,
    cbd: 1,
    floweringTime: 56,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.8, max: 1.6 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
} as Strain

const testSetup: GrowSetup = {
    lightType: 'LED',
    lightWattage: 300,
    lightHours: 18,
    ventilation: 'medium',
    hasCirculationFan: true,
    potSize: 11,
    potType: 'Fabric',
    medium: 'Soil',
    dynamicLighting: false,
}

let basePlant: Plant

beforeAll(() => {
    basePlant = plantSimulationService.createPlant(testStrain, testSetup, 'Test Plant')
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('analyticsService.compute — empty plant list', () => {
    it('returns a zero-score result for empty input', () => {
        const result = analyticsService.compute([])
        expect(result.gardenScore).toBe(0)
        expect(result.avgHealth).toBe(0)
        expect(result.stageDistribution).toEqual({})
        expect(result.riskFactors).toHaveLength(0)
        expect(result.recommendations).toHaveLength(0)
        expect(result.strainPerformance).toHaveLength(0)
        expect(result.growDurationStats).toHaveLength(0)
        expect(result.nextMilestone).toBeUndefined()
    })

    it('returns 14-day trend with all-zero counts', () => {
        const result = analyticsService.compute([])
        expect(result.journalActivityTrend).toHaveLength(14)
        expect(result.journalActivityTrend.every((d) => d.count === 0)).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// Single healthy plant
// ---------------------------------------------------------------------------

describe('analyticsService.compute — single healthy vegetative plant', () => {
    let plant: Plant

    beforeAll(() => {
        plant = {
            ...basePlant,
            stage: PlantStage.Vegetative,
            health: 95,
            environment: {
                ...basePlant.environment,
                internalTemperature: 24,
                internalHumidity: 60,
                vpd: 1.1,
            },
        }
    })

    it('produces a non-zero garden score', () => {
        const { gardenScore } = analyticsService.compute([plant])
        expect(gardenScore).toBeGreaterThan(0)
        expect(gardenScore).toBeLessThanOrEqual(100)
    })

    it('reports correct average health', () => {
        const { avgHealth } = analyticsService.compute([plant])
        expect(avgHealth).toBe(95)
    })

    it('counts the vegetative stage in distribution', () => {
        const { stageDistribution } = analyticsService.compute([plant])
        expect(stageDistribution[PlantStage.Vegetative]).toBe(1)
    })

    it('includes the plant in strain performance ranking', () => {
        const { strainPerformance } = analyticsService.compute([plant])
        const entry = strainPerformance.find((e) => e.strainName === 'Analytics Strain')
        expect(entry).toBeDefined()
        expect(entry!.plantCount).toBe(1)
    })
})

// ---------------------------------------------------------------------------
// Garden score calculation
// ---------------------------------------------------------------------------

describe('gardenScore', () => {
    it('is higher for healthy plants than sick plants', () => {
        const healthyPlant = { ...basePlant, stage: PlantStage.Vegetative, health: 90 }
        const sickPlant = { ...basePlant, stage: PlantStage.Vegetative, health: 30 }
        const healthy = analyticsService.compute([healthyPlant])
        const sick = analyticsService.compute([sickPlant])
        expect(healthy.gardenScore).toBeGreaterThan(sick.gardenScore)
    })

    it('excludes finished plants from garden score calculation', () => {
        const activePlant = { ...basePlant, stage: PlantStage.Vegetative, health: 80 }
        const finishedPlant = { ...basePlant, stage: PlantStage.Finished, health: 20 }
        const withFinished = analyticsService.compute([activePlant, finishedPlant])
        const withoutFinished = analyticsService.compute([activePlant])
        expect(withFinished.gardenScore).toBe(withoutFinished.gardenScore)
    })
})

// ---------------------------------------------------------------------------
// Risk factors
// ---------------------------------------------------------------------------

describe('riskFactors', () => {
    it('flags a plant with low health as a health risk', () => {
        const sickPlant = { ...basePlant, stage: PlantStage.Vegetative, health: 20 }
        const { riskFactors } = analyticsService.compute([sickPlant])
        const healthRisk = riskFactors.find((r) => r.type === 'health')
        expect(healthRisk).toBeDefined()
        expect(healthRisk!.severity).toMatch(/medium|high/)
    })

    it('produces no health risk for a fully healthy plant', () => {
        const healthyPlant = { ...basePlant, stage: PlantStage.Vegetative, health: 100 }
        const { riskFactors } = analyticsService.compute([healthyPlant])
        const healthRisk = riskFactors.find(
            (r) => r.type === 'health' && r.plantName === healthyPlant.name,
        )
        expect(healthRisk).toBeUndefined()
    })

    it('flags environment risk for extreme VPD', () => {
        const stressedPlant = {
            ...basePlant,
            stage: PlantStage.Flowering,
            health: 80,
            environment: {
                ...basePlant.environment,
                vpd: 3.5,
                internalTemperature: 38,
                internalHumidity: 20,
            },
        }
        const { riskFactors } = analyticsService.compute([stressedPlant])
        const envRisk = riskFactors.find((r) => r.type === 'environment')
        expect(envRisk).toBeDefined()
    })
})

// ---------------------------------------------------------------------------
// Milestone estimation
// ---------------------------------------------------------------------------

describe('nextMilestone', () => {
    it('estimates a harvest milestone for a late-flowering plant', () => {
        const floweringPlant = {
            ...basePlant,
            stage: PlantStage.Flowering,
            health: 80,
            age: 55,
        }
        const { nextMilestone } = analyticsService.compute([floweringPlant])
        expect(nextMilestone).toBeDefined()
        expect(nextMilestone!.type).toBe('harvest')
        expect(nextMilestone!.estimatedDays).toBeGreaterThan(0)
    })

    it('estimates a transplant milestone for a seedling', () => {
        const seedlingPlant = {
            ...basePlant,
            stage: PlantStage.Seedling,
            health: 90,
            age: 5,
        }
        const { nextMilestone } = analyticsService.compute([seedlingPlant])
        expect(nextMilestone).toBeDefined()
        expect(nextMilestone!.type).toBe('transplant')
    })

    it('returns undefined for finished plants only', () => {
        const finishedPlant = { ...basePlant, stage: PlantStage.Finished, health: 100 }
        const { nextMilestone } = analyticsService.compute([finishedPlant])
        expect(nextMilestone).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// Journal activity trend
// ---------------------------------------------------------------------------

describe('journalActivityTrend', () => {
    it('always returns exactly 14 daily buckets', () => {
        const plant = { ...basePlant, stage: PlantStage.Vegetative }
        const { journalActivityTrend } = analyticsService.compute([plant])
        expect(journalActivityTrend).toHaveLength(14)
    })

    it('counts recent journal entries across the 14-day window', () => {
        const now = Date.now()
        const plantWithJournal = {
            ...basePlant,
            stage: PlantStage.Vegetative,
            journal: [
                {
                    id: 'j1',
                    plantId: basePlant.id,
                    type: JournalEntryType.Watering,
                    notes: 'watered',
                    createdAt: now - 1000 * 60 * 60,
                },
                {
                    id: 'j2',
                    plantId: basePlant.id,
                    type: JournalEntryType.Watering,
                    notes: 'fed',
                    createdAt: now - 1000 * 60 * 60 * 2,
                },
            ],
        }
        const { journalActivityTrend } = analyticsService.compute([plantWithJournal])
        // Both entries are within 14 days — total count across all buckets must equal 2
        const totalEntries = journalActivityTrend.reduce((sum, d) => sum + d.count, 0)
        expect(totalEntries).toBe(2)
    })
})

// ---------------------------------------------------------------------------
// Nutrient consistency
// ---------------------------------------------------------------------------

describe('getNutrientConsistency', () => {
    it('returns an entry per plant that has nutrient readings', () => {
        const plantWithReadings = {
            ...basePlant,
            stage: PlantStage.Vegetative,
            journal: [
                {
                    id: 'n1',
                    plantId: basePlant.id,
                    type: JournalEntryType.Watering,
                    notes: '',
                    createdAt: Date.now() - 86400000,
                    ph: 6.2,
                    ec: 1.1,
                },
                {
                    id: 'n2',
                    plantId: basePlant.id,
                    type: JournalEntryType.Watering,
                    notes: '',
                    createdAt: Date.now() - 172800000,
                    ph: 6.5,
                    ec: 1.3,
                },
            ],
        }
        const { nutrientConsistency } = analyticsService.compute([plantWithReadings])
        expect(nutrientConsistency.length).toBeGreaterThanOrEqual(1)
        const entry = nutrientConsistency.find((e) => e.plantId === basePlant.id)
        expect(entry).toBeDefined()
        expect(entry!.avgPh).toBeGreaterThan(0)
        expect(entry!.avgEc).toBeGreaterThan(0)
        expect(['stable', 'moderate', 'unstable']).toContain(entry!.rating)
    })
})

// ---------------------------------------------------------------------------
// Grow duration stats (finished plants)
// ---------------------------------------------------------------------------

describe('growDurationStats', () => {
    it('returns empty array when no finished plants exist', () => {
        const vegetativePlant = { ...basePlant, stage: PlantStage.Vegetative }
        const { growDurationStats } = analyticsService.compute([vegetativePlant])
        expect(growDurationStats).toHaveLength(0)
    })

    it('includes finished plants in duration stats', () => {
        const finishedPlant = {
            ...basePlant,
            stage: PlantStage.Finished,
            age: 90,
            strain: { ...basePlant.strain, name: 'Analytics Strain' },
        }
        const { growDurationStats } = analyticsService.compute([finishedPlant])
        const stat = growDurationStats.find((s) => s.strainName === 'Analytics Strain')
        expect(stat).toBeDefined()
        expect(stat!.avgDays).toBeGreaterThan(0)
    })
})

// ---------------------------------------------------------------------------
// Multiple plants
// ---------------------------------------------------------------------------

describe('analyticsService.compute — multiple plants', () => {
    it('ranks two strains by average health', () => {
        const highHealthPlant = {
            ...basePlant,
            id: 'p1',
            name: 'High Health',
            stage: PlantStage.Vegetative,
            health: 90,
            strain: { ...basePlant.strain, name: 'Strain A' },
        }
        const lowHealthPlant = {
            ...basePlant,
            id: 'p2',
            name: 'Low Health',
            stage: PlantStage.Vegetative,
            health: 40,
            strain: { ...basePlant.strain, name: 'Strain B' },
        }
        const { strainPerformance } = analyticsService.compute([highHealthPlant, lowHealthPlant])
        const strainA = strainPerformance.find((s) => s.strainName === 'Strain A')
        const strainB = strainPerformance.find((s) => s.strainName === 'Strain B')
        expect(strainA).toBeDefined()
        expect(strainB).toBeDefined()
        expect(strainA!.avgHealth).toBeGreaterThan(strainB!.avgHealth)
    })

    it('accumulates stage distribution for multiple plants', () => {
        const veg1 = { ...basePlant, id: 'pv1', stage: PlantStage.Vegetative, health: 80 }
        const veg2 = { ...basePlant, id: 'pv2', stage: PlantStage.Vegetative, health: 70 }
        const flower = { ...basePlant, id: 'pf1', stage: PlantStage.Flowering, health: 85 }
        const { stageDistribution } = analyticsService.compute([veg1, veg2, flower])
        expect(stageDistribution[PlantStage.Vegetative]).toBe(2)
        expect(stageDistribution[PlantStage.Flowering]).toBe(1)
    })
})
