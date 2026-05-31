import { describe, expect, it } from 'vitest'
import { diagnosePlant } from './diagnosisFallback'
import { PlantStage, StrainType, type Plant, type Strain } from '@/types'

const baseStrain = {
    id: 's1',
    name: 'Test',
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod' as const,
    thc: 18,
    cbd: 1,
    floweringTime: 9,
    agronomic: { difficulty: 'Medium' as const, yield: 'Medium' as const, height: 'Medium' as const },
    geneticModifiers: {
        pestResistance: 0.5,
        nutrientUptakeRate: 0.5,
        stressTolerance: 0.5,
        rue: 0.5,
        vpdTolerance: { min: 0.8, max: 1.2 },
        transpirationFactor: 0.5,
        stomataSensitivity: 0.5,
    },
} as Strain

const buildPlant = (overrides: Partial<Plant> = {}): Plant => ({
    id: 'p1',
    growId: 'g1',
    name: 'Plant',
    strain: baseStrain,
    mediumType: 'Soil',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    age: 30,
    stage: PlantStage.Vegetative,
    health: 80,
    stressLevel: 10,
    height: 40,
    biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
    leafAreaIndex: 1.2,
    isTopped: false,
    lstApplied: 0,
    environment: { internalTemperature: 25, internalHumidity: 55, vpd: 1.0, co2Level: 600 },
    medium: {
        ph: 6.2,
        ec: 1.4,
        moisture: 50,
        microbeHealth: 80,
        substrateWater: 0.5,
        nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
    },
    nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
    rootSystem: { health: 85, rootMass: 0.7 },
    equipment: {
        light: { type: 'LED', wattage: 200, isOn: true, lightHours: 18 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 11,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 3, nodes: 10 },
    history: [],
    cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
    terpeneProfile: {},
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 0 },
    ...overrides,
})

describe('diagnosisFallback thresholds', () => {
    it('flags VPD at lower flowering boundary', () => {
        const result = diagnosePlant(
            buildPlant({
                stage: PlantStage.Flowering,
                environment: { internalTemperature: 24, internalHumidity: 70, vpd: 0.9, co2Level: 600 },
            }),
            'en',
        )
        expect(result.issues.some((i) => i.includes('VPD'))).toBe(true)
    })

    it('flags pH above upper threshold', () => {
        const result = diagnosePlant(buildPlant({ medium: { ...buildPlant().medium, ph: 7.0 } }), 'en')
        expect(result.issues.some((i) => i.includes('pH'))).toBe(true)
    })

    it('flags EC below seedling minimum', () => {
        const result = diagnosePlant(
            buildPlant({ stage: PlantStage.Seedling, medium: { ...buildPlant().medium, ec: 0.2 } }),
            'en',
        )
        expect(result.issues.some((i) => i.includes('EC'))).toBe(true)
    })

    it('returns localized messages for DE and ES', () => {
        const plant = buildPlant({ medium: { ...buildPlant().medium, ph: 5.0 } })
        expect(diagnosePlant(plant, 'de').issues.join(' ')).toMatch(/pH/)
        expect(diagnosePlant(plant, 'es').issues.join(' ')).toMatch(/pH/)
    })

    it('handles missing root health gracefully', () => {
        const result = diagnosePlant(
            buildPlant({ rootSystem: { health: 30, rootMass: 0.2 } }),
            'en',
        )
        expect(result.issues.some((i) => i.toLowerCase().includes('root'))).toBe(true)
    })

    it('uses seedling VPD range on germination stage transition', () => {
        const result = diagnosePlant(
            buildPlant({
                stage: PlantStage.Germination,
                environment: { internalTemperature: 24, internalHumidity: 80, vpd: 0.3, co2Level: 600 },
            }),
            'en',
        )
        expect(result.issues.some((i) => i.includes('VPD'))).toBe(true)
    })
})
