import { describe, expect, it } from 'vitest'
import { PlantStage, StrainType } from '@/types'
import type { Plant } from '@/types'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import {
    getEnvironmentalInstabilityCurve,
    getNutrientSensitivityCurve,
    getPestPressureCurve,
    getPlantSignal,
    getSimulationAltitude,
} from '@/services/simulation/simulationEnvironmentHelpers'

const basePlant = (id: string): Plant =>
    ({
        id,
        growId: 'grow-1',
        name: 'Env Plant',
        strain: {
            id: 's1',
            name: 'Test',
            type: StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 1,
            floweringTime: 60,
            agronomic: { difficulty: 'Easy', yield: 'High', height: 'Medium' },
            geneticModifiers: {
                pestResistance: 1,
                nutrientUptakeRate: 1,
                stressTolerance: 1,
                rue: 1,
                vpdTolerance: { min: 0.4, max: 1.6 },
                transpirationFactor: 1,
                stomataSensitivity: 1,
            },
        },
        mediumType: 'Soil',
        createdAt: 0,
        lastUpdated: 0,
        age: 10,
        stage: PlantStage.Vegetative,
        health: 90,
        stressLevel: 0,
        height: 20,
        biomass: { total: 10, stem: 3, leaves: 5, flowers: 2 },
        leafAreaIndex: 1,
        isTopped: false,
        lstApplied: 0,
        environment: { internalTemperature: 24, internalHumidity: 55, vpd: 1, co2Level: 400 },
        medium: {
            ph: 6,
            ec: 1,
            moisture: 50,
            microbeHealth: 80,
            substrateWater: 100,
            nutrientConcentration: { nitrogen: 1, phosphorus: 1, potassium: 1 },
        },
        nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
        rootSystem: { health: 90, rootMass: 1 },
        equipment: {
            light: { type: 'LED', wattage: 100, isOn: true, hoursOn: 18 },
            circulationFan: { isOn: true },
            exhaustFan: { isOn: true },
            humidifier: { isOn: false },
            heater: { isOn: false },
            ac: { isOn: false },
            co2Generator: { isOn: false },
        },
        journal: [],
        problems: [],
    }) as unknown as Plant

describe('simulationEnvironmentHelpers', () => {
    it('getSimulationAltitude clamps to 0–5000', () => {
        expect(getSimulationAltitude({ altitudeM: -10 } as SimulationSettings)).toBe(0)
        expect(getSimulationAltitude({ altitudeM: 9999 } as SimulationSettings)).toBe(5000)
        expect(getSimulationAltitude({ altitudeM: 1200 } as SimulationSettings)).toBe(1200)
    })

    it('getEnvironmentalInstabilityCurve uses default without settings', () => {
        expect(getEnvironmentalInstabilityCurve()).toBeCloseTo(0.18, 2)
    })

    it('getPestPressureCurve scales with pestPressure', () => {
        expect(getPestPressureCurve()).toBeCloseTo(1, 2)
        expect(getPestPressureCurve({ pestPressure: 1 } as SimulationSettings)).toBeGreaterThan(1)
    })

    it('getNutrientSensitivityCurve handles high and low sensitivity', () => {
        expect(
            getNutrientSensitivityCurve({ nutrientSensitivity: 2 } as SimulationSettings),
        ).toBeGreaterThan(1)
        expect(
            getNutrientSensitivityCurve({ nutrientSensitivity: 0.5 } as SimulationSettings),
        ).toBeLessThan(1)
    })

    it('getPlantSignal is deterministic per plant id', () => {
        expect(getPlantSignal(basePlant('abc'))).toBe(getPlantSignal(basePlant('abc')))
        expect(getPlantSignal(basePlant('abc'))).not.toBe(getPlantSignal(basePlant('xyz')))
    })
})
