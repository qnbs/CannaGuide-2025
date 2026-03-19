import { describe, expect, it } from 'vitest'
import { Plant, PlantStage, StrainType } from '@/types'
import { yieldPredictionService } from './yieldPredictionService'

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
    id: 'plant-1',
    name: 'Test Plant',
    strain: {
        id: 'strain-1',
        name: 'Test Strain',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc: 20,
        cbd: 1,
        floweringTime: 9,
        description: '',
        genetics: '',
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        aromas: [],
        dominantTerpenes: [],
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 1, max: 1 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
    },
    mediumType: 'Soil',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    age: 45,
    stage: PlantStage.Flowering,
    health: 88,
    stressLevel: 12,
    height: 95,
    biomass: { total: 120, stem: 28, leaves: 34, flowers: 58 },
    leafAreaIndex: 3.4,
    isTopped: false,
    lstApplied: 0,
    environment: { internalTemperature: 24, internalHumidity: 58, vpd: 1.2, co2Level: 850 },
    medium: {
        ph: 6.4,
        ec: 1.8,
        moisture: 54,
        microbeHealth: 82,
        substrateWater: 60,
        nutrientConcentration: { nitrogen: 5, phosphorus: 4, potassium: 4 },
    },
    nutrientPool: { nitrogen: 14, phosphorus: 10, potassium: 11 },
    rootSystem: { health: 86, rootMass: 18 },
    equipment: {
        light: { type: 'LED', wattage: 320, isOn: true, lightHours: 18 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 11,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 8, nodes: 24 },
    history: [],
    cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
    terpeneProfile: {},
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 0 },
    ...overrides,
})

describe('yieldPredictionService', () => {
    it('falls back to heuristics without enough harvest history', async () => {
        const result = await yieldPredictionService.predictYield([], [makePlant()])

        expect(result.usedTensorflowModel).toBe(false)
        expect(result.sampleCount).toBe(0)
        expect(result.predictedDryWeight).toBeGreaterThan(0)
        expect(result.confidence).toBeLessThan(0.5)
    })

    it('builds a stable feature vector for a plant snapshot', () => {
        const features = yieldPredictionService.buildFeatureVector(makePlant())

        expect(features.length).toBeGreaterThan(20)
        expect(features.every((value) => Number.isFinite(value))).toBe(true)
    })
})
