import { describe, it, expect } from 'vitest'
import {
    plantSimulationService,
    PLANT_STAGE_DETAILS,
} from '@/services/plantSimulationService'
import { PlantStage, StrainType, type Strain, type GrowSetup } from '@/types'

const testStrain: Strain = {
    id: 'strain-sim-test',
    name: 'Sim Test Strain',
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

describe('PLANT_STAGE_DETAILS', () => {
    it('has entries for all plant stages', () => {
        const stages = Object.values(PlantStage)
        for (const stage of stages) {
            expect(PLANT_STAGE_DETAILS[stage]).toBeDefined()
        }
    })

    it('Seed stage has correct initial values', () => {
        const seed = PLANT_STAGE_DETAILS[PlantStage.Seed]
        expect(seed.duration).toBe(1)
        expect(seed.nutrientRatio.n).toBe(1)
        expect(seed.biomassPartitioning.roots).toBe(1.0)
    })

    it('Flowering stage requires higher EC', () => {
        const flowering = PLANT_STAGE_DETAILS[PlantStage.Flowering]
        const seedling = PLANT_STAGE_DETAILS[PlantStage.Seedling]
        expect(flowering.idealVitals.ec.min).toBeGreaterThan(seedling.idealVitals.ec.min)
    })

    it('Flowering stage prioritizes flower biomass', () => {
        const flowering = PLANT_STAGE_DETAILS[PlantStage.Flowering]
        expect(flowering.biomassPartitioning.flowers).toBeGreaterThan(0.5)
    })
})

describe('plantSimulationService', () => {
    it('creates a plant with correct initial properties', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Test Plant 1')
        expect(plant.name).toBe('Test Plant 1')
        expect(plant.strain.id).toBe('strain-sim-test')
        expect(plant.stage).toBe(PlantStage.Seed)
        expect(plant.age).toBe(0)
        expect(plant.health).toBe(100)
        expect(plant.id).toBeTruthy()
    })

    it('creates plant with correct equipment setup', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Equip Plant')
        expect(plant.equipment.light.wattage).toBe(300)
        expect(plant.equipment.light.lightHours).toBe(18)
        expect(plant.equipment.light.type).toBe('LED')
        expect(plant.equipment.circulationFan.isOn).toBe(true)
    })

    it('creates plant with correct medium', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Medium Plant')
        expect(plant.mediumType).toBe('Soil')
    })

    it('applies environmental corrections', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Env Plant')
        const corrected = plantSimulationService.applyEnvironmentalCorrections(plant)
        expect(corrected.environment).toBeDefined()
        expect(typeof corrected.environment.vpd).toBe('number')
    })

    it('clones a plant (deep copy)', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Original')
        const clone = plantSimulationService.clonePlant(plant)
        expect(clone.name).toBe(plant.name)
        // Deep clone -- modifying clone should not affect original
        clone.health = 50
        expect(plant.health).toBe(100)
    })

    it('tops a plant', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Top Plant')
        const { updatedPlant } = plantSimulationService.topPlant(plant)
        expect(updatedPlant).toBeDefined()
    })

    it('applies LST', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'LST Plant')
        const { updatedPlant } = plantSimulationService.applyLst(plant)
        expect(updatedPlant).toBeDefined()
    })

    it('ensures post harvest data on non-harvest plant', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'PHD Plant')
        const withData = plantSimulationService.ensurePostHarvestData(plant)
        expect(withData.harvestData).toBeDefined()
    })

    it('advances plant state over a time delta', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Time Plant')
        const { updatedPlant } = plantSimulationService.calculateStateForTimeDelta(
            plant,
            24 * 60 * 60 * 1000,
        )
        expect(updatedPlant.lastUpdated).toBeGreaterThan(plant.lastUpdated)
    })

    it('returns simulation diagnostics for a plant', () => {
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Diag Plant')
        const diagnostics = plantSimulationService.getSimulationDiagnostics(plant)
        expect(diagnostics.dominantFactors.length).toBeGreaterThan(0)
    })
})
