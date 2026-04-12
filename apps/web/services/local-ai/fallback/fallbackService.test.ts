import { describe, expect, it } from 'vitest'
import { localAiFallbackService } from './fallbackService'
import { PlantStage, StrainType, type Plant, type Strain } from '@/types'

const buildPlant = (overrides: Partial<Plant> = {}): Plant => ({
    id: 'plant-1',
    growId: 'default-grow',
    name: 'Aurora',
    strain: {
        id: 'strain-1',
        name: 'Aurora',
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
    health: 74,
    stressLevel: 18,
    height: 50,
    biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
    leafAreaIndex: 1.5,
    isTopped: false,
    lstApplied: 0,
    environment: {
        internalTemperature: 26,
        internalHumidity: 58,
        vpd: 1.1,
        co2Level: 600,
    },
    medium: {
        ph: 6.1,
        ec: 1.2,
        moisture: 46,
        microbeHealth: 82,
        substrateWater: 0.5,
        nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
    },
    nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
    rootSystem: { health: 83, rootMass: 0.7 },
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

describe('localAiFallbackService', () => {
    it('detects multiple environmental issues in the plant diagnosis', () => {
        const plant = buildPlant({
            stage: PlantStage.Flowering,
            environment: {
                internalTemperature: 31.5,
                internalHumidity: 42,
                vpd: 1.8,
                co2Level: 600,
            },
            medium: {
                ph: 5.2,
                ec: 2.6,
                moisture: 88,
                microbeHealth: 50,
                substrateWater: 0.5,
                nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
            },
            rootSystem: { health: 52, rootMass: 0.7 },
        })

        const diagnosis = localAiFallbackService.diagnosePlant(plant, 'en')

        expect(diagnosis.issues.length).toBeGreaterThanOrEqual(5)
        expect(diagnosis.topPriority).toContain('VPD')
        expect(diagnosis.issues.join(' ')).toContain('pH')
        expect(diagnosis.issues.join(' ')).toContain('Temperature')
        expect(diagnosis.issues.join(' ')).toContain('Root health')
    })

    it('returns a localized mentor response with sanitized HTML', () => {
        const response = localAiFallbackService.getMentorResponse(
            buildPlant(),
            '<script>alert(1)</script> How should I adjust feed?',
            '<img src=x onerror=alert(1)> Recent logs',
            'de',
        )

        expect(response.title).toContain('Lokaler Mentor')
        expect(response.content).not.toContain('<script>')
        expect(response.content).not.toContain('onerror')
        expect(response.content).toContain('Empfehlung')
    })

    it('summarizes plant advice with a clear priority line', () => {
        const response = localAiFallbackService.getPlantAdvice(buildPlant(), 'en')

        expect(response.title).toContain('Local Advice')
        expect(response.content).toContain('Top priority')
        expect(response.content).toContain('Status:')
    })

    it('produces a localized grow log answer', () => {
        const response = localAiFallbackService.getGrowLogRagAnswer('What changed?', 'Watering improved after flush.', 'en')

        expect(response.title).toContain('RAG Analysis')
        expect(response.content).toContain('Question: What changed?')
        expect(response.content).toContain('Watering improved after flush.')
    })
})
