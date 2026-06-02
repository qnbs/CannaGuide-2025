import { describe, expect, it } from 'vitest'
import { PlantStage, StrainType } from '@/types'
import type { Plant } from '@/types'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import {
    applyDailyEnvironmentalDrift,
    getCorrectedRh,
    getEnvironmentalStressMultiplier,
    getNutrientStressMultiplier,
    getPestPressureMultiplier,
    getEnvironmentalInstabilityCurve,
    getNutrientSensitivityCurve,
    getPestPressureCurve,
    getPlantSignal,
    getSimulationAltitude,
    getSimulationNutrientConversionEfficiency,
    getSubstrateRhCorrection,
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

    it('getSubstrateRhCorrection adjusts by medium and pot type', () => {
        const soil = basePlant('soil')
        const coco = { ...basePlant('coco'), mediumType: 'Coco' as const }
        expect(getSubstrateRhCorrection(coco)).toBeLessThan(getSubstrateRhCorrection(soil))
    })

    it('getCorrectedRh clamps humidity with substrate correction', () => {
        const plant = basePlant('rh')
        plant.environment.internalHumidity = 90
        expect(getCorrectedRh(plant)).toBeLessThanOrEqual(95)
        expect(getCorrectedRh(plant)).toBeGreaterThanOrEqual(25)
    })

    it('stress multipliers stay within configured bounds', () => {
        expect(getEnvironmentalStressMultiplier()).toBeGreaterThanOrEqual(0.55)
        expect(getNutrientStressMultiplier()).toBeLessThanOrEqual(2.4)
        expect(getPestPressureMultiplier()).toBeLessThanOrEqual(5.5)
    })

    it('getSimulationNutrientConversionEfficiency clamps efficiency', () => {
        expect(getSimulationNutrientConversionEfficiency({ nutrientConversionEfficiency: 2 } as SimulationSettings)).toBe(0.95)
        expect(getSimulationNutrientConversionEfficiency({ nutrientConversionEfficiency: 0 } as SimulationSettings)).toBe(0.05)
    })

    it('applyDailyEnvironmentalDrift returns plant unchanged at low instability', () => {
        const plant = basePlant('drift')
        const beforeTemp = plant.environment.internalTemperature
        const result = applyDailyEnvironmentalDrift(plant, {
            environmentalStability: 1,
            simulationProfile: 'beginner',
        } as SimulationSettings)
        expect(result.environment.internalTemperature).toBe(beforeTemp)
    })
})
