import { describe, expect, it } from 'vitest'
import { diagnosePlant } from './diagnosisFallback'
import { PlantStage, StrainType, type Plant, type Strain } from '@/types'

const buildPlant = (overrides: Partial<Plant> = {}): Plant => ({
    id: 'plant-1',
    growId: 'default-grow',
    name: 'TestPlant',
    strain: {
        id: 'strain-1',
        name: 'TestStrain',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc: 18,
        cbd: 1,
        floweringTime: 9,
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 0.5,
            nutrientUptakeRate: 0.5,
            stressTolerance: 0.5,
            rue: 0.5,
            vpdTolerance: { min: 0.8, max: 1.2 },
            transpirationFactor: 0.5,
            stomataSensitivity: 0.5,
        },
    } as Strain,
    mediumType: 'Soil',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    age: 42,
    stage: PlantStage.Vegetative,
    health: 80,
    stressLevel: 10,
    height: 50,
    biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
    leafAreaIndex: 1.5,
    isTopped: false,
    lstApplied: 0,
    environment: {
        internalTemperature: 25,
        internalHumidity: 55,
        vpd: 1.0,
        co2Level: 600,
    },
    medium: {
        ph: 6.3,
        ec: 1.2,
        moisture: 50,
        microbeHealth: 80,
        substrateWater: 0.5,
        nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
    },
    nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
    rootSystem: { health: 85, rootMass: 0.7 },
    equipment: {
        light: { type: 'LED', wattage: 240, isOn: true, lightHours: 18 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 11,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 4, nodes: 12 },
    history: [],
    cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
    terpeneProfile: {},
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 0 },
    ...overrides,
})

describe('diagnosisFallback', () => {
    it('returns no issues for a healthy plant', () => {
        const result = diagnosePlant(buildPlant(), 'en')
        expect(result.issues.length).toBe(0)
        expect(result.topPriority).toContain('normal range')
    })

    it('detects high VPD in vegetative stage', () => {
        const plant = buildPlant({
            environment: {
                internalTemperature: 30,
                internalHumidity: 40,
                vpd: 1.8,
                co2Level: 600,
            },
        })
        const result = diagnosePlant(plant, 'en')
        expect(result.issues.some((i) => i.includes('VPD'))).toBe(true)
    })

    it('detects low pH', () => {
        const plant = buildPlant({
            medium: {
                ph: 4.8,
                ec: 1.2,
                moisture: 50,
                microbeHealth: 80,
                substrateWater: 0.5,
                nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
            },
        })
        const result = diagnosePlant(plant, 'en')
        expect(result.issues.some((i) => i.includes('pH'))).toBe(true)
    })

    it('detects high EC', () => {
        const plant = buildPlant({
            medium: {
                ph: 6.3,
                ec: 3.0,
                moisture: 50,
                microbeHealth: 80,
                substrateWater: 0.5,
                nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
            },
        })
        const result = diagnosePlant(plant, 'en')
        expect(result.issues.some((i) => i.includes('EC'))).toBe(true)
    })

    it('detects poor root health', () => {
        const plant = buildPlant({ rootSystem: { health: 40, rootMass: 0.3 } })
        const result = diagnosePlant(plant, 'en')
        expect(result.issues.some((i) => i.includes('Root'))).toBe(true)
    })

    it('returns German diagnosis when lang=de', () => {
        const plant = buildPlant({
            environment: {
                internalTemperature: 33,
                internalHumidity: 30,
                vpd: 2.0,
                co2Level: 600,
            },
        })
        const result = diagnosePlant(plant, 'de')
        expect(result.topPriority).toMatch(/VPD/)
    })

    it('detects seedling-specific VPD range', () => {
        const plant = buildPlant({
            stage: PlantStage.Seedling,
            environment: {
                internalTemperature: 25,
                internalHumidity: 45,
                vpd: 1.0,
                co2Level: 400,
            },
        })
        const result = diagnosePlant(plant, 'en')
        expect(result.issues.some((i) => i.includes('VPD'))).toBe(true)
    })
})
