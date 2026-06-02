import { describe, expect, it } from 'vitest'
import { PlantStage, StrainType, type GrowSetup, type Strain } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import {
    computePostHarvestQuality,
    createInitialHarvestData,
    isPostHarvestActionAllowed,
} from '@/services/simulation/postHarvestSimulation'

const testStrain: Strain = {
    id: 'strain-post-harvest',
    name: 'Post Harvest Test',
    type: StrainType.Hybrid,
    thc: 18,
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

describe('postHarvestSimulation', () => {
    it('createInitialHarvestData derives weights from biomass', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Harvest Plant')
        plant.stage = PlantStage.Harvest
        plant.biomass.flowers = 10

        const data = createInitialHarvestData(plant)
        expect(data.wetWeight).toBeGreaterThan(0)
        expect(data.dryWeight).toBeLessThan(data.wetWeight)
        expect(data.cannabinoidProfile.thc).toBeGreaterThan(0)
    })

    it('isPostHarvestActionAllowed respects stage gates', () => {
        expect(isPostHarvestActionAllowed(PlantStage.Harvest, 'dry')).toBe(true)
        expect(isPostHarvestActionAllowed(PlantStage.Vegetative, 'dry')).toBe(false)
        expect(isPostHarvestActionAllowed(PlantStage.Curing, 'burp')).toBe(true)
    })

    it('computePostHarvestQuality returns bounded score', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Quality Plant')
        plant.stage = PlantStage.Harvest
        const harvestData = createInitialHarvestData(plant)
        const score = computePostHarvestQuality(harvestData)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
    })
})
