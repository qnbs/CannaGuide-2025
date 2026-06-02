import type { Plant } from '@/types'
import {
    SIM_BIOMASS_CONVERSION_EFFICIENCY,
    SIM_LIGHT_EXTINCTION_COEFFICIENT_K,
} from '@/constants'
import { ENVIRONMENTAL_DRIFT } from '@/services/simulation/simulationProfiles'
import { getSimulationProfileCurve, type SimulationSettings } from '@/services/simulation/simulationProfiles'
import { simClamp } from '@/services/simulation/simulationMath'
import { normalizeGeneticModifiers } from '@/services/simulation/geneticModifiers'

const DRIFT = ENVIRONMENTAL_DRIFT

export function getSimulationAltitude(simulationSettings?: SimulationSettings): number {
    return simClamp(simulationSettings?.altitudeM ?? 0, 0, 5000)
}

export function getEnvironmentalInstabilityCurve(
    simulationSettings?: SimulationSettings,
): number {
    if (!simulationSettings) {
        return 0.18
    }

    const normalizedStability = simClamp(
        (simulationSettings.environmentalStability - 0.5) / 0.5,
        0,
        1,
    )
    return Math.pow(1 - normalizedStability, 1.35)
}

export function getPestPressureCurve(simulationSettings?: SimulationSettings): number {
    if (!simulationSettings) {
        return 1
    }

    return 0.45 + Math.pow(simClamp(simulationSettings.pestPressure, 0, 1), 1.6) * 3.2
}

export function getNutrientSensitivityCurve(simulationSettings?: SimulationSettings): number {
    if (!simulationSettings) {
        return 1
    }

    const sensitivity = simClamp(simulationSettings.nutrientSensitivity, 0.5, 2)
    if (sensitivity >= 1) {
        return 1 + Math.pow(sensitivity - 1, 1.35) * 2.4
    }

    return 1 - Math.pow(1 - sensitivity, 1.1) * 0.45
}

export function getPlantSignal(plant: Plant): number {
    return plant.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) / 17
}

export function getSimulationLeafTemperatureOffset(
    plant: Plant,
    simulationSettings?: SimulationSettings,
): number {
    if (simulationSettings && Number.isFinite(simulationSettings.leafTemperatureOffset)) {
        return simClamp(simulationSettings.leafTemperatureOffset, -5, 5)
    }

    const baseOffset = plant.equipment.light.type === 'HPS' ? 3.5 : 2.5
    const circulationAdjustment = plant.equipment.circulationFan.isOn ? -0.3 : 0.4
    return simClamp(baseOffset + circulationAdjustment, 2, 4)
}

export function getSimulationLightExtinctionCoefficient(
    simulationSettings?: SimulationSettings,
): number {
    return simClamp(
        simulationSettings?.lightExtinctionCoefficient ?? SIM_LIGHT_EXTINCTION_COEFFICIENT_K,
        0.2,
        1.5,
    )
}

export function getSimulationNutrientConversionEfficiency(
    simulationSettings?: SimulationSettings,
): number {
    return simClamp(
        simulationSettings?.nutrientConversionEfficiency ?? SIM_BIOMASS_CONVERSION_EFFICIENCY,
        0.05,
        0.95,
    )
}

export function getSimulationStomataSensitivity(
    plant: Plant,
    simulationSettings?: SimulationSettings,
): number {
    const modifiers = normalizeGeneticModifiers(
        plant.phenotypeModifiers ?? plant.strain.geneticModifiers,
    )
    return simClamp(
        (simulationSettings?.stomataSensitivity ?? 1) * modifiers.stomataSensitivity,
        0.2,
        3,
    )
}

export function getEnvironmentalStressMultiplier(simulationSettings?: SimulationSettings): number {
    return simClamp(
        (0.72 + getEnvironmentalInstabilityCurve(simulationSettings) * 0.95) *
            getSimulationProfileCurve(simulationSettings).environmentStress,
        0.55,
        1.85,
    )
}

export function getNutrientStressMultiplier(simulationSettings?: SimulationSettings): number {
    return simClamp(
        getNutrientSensitivityCurve(simulationSettings) *
            getSimulationProfileCurve(simulationSettings).nutrientStress,
        0.55,
        2.4,
    )
}

export function getPestPressureMultiplier(simulationSettings?: SimulationSettings): number {
    return simClamp(
        getPestPressureCurve(simulationSettings) *
            getSimulationProfileCurve(simulationSettings).pestPressure,
        0.4,
        5.5,
    )
}

export function getSubstrateRhCorrection(plant: Plant): number {
    const byMediumType: Record<Plant['mediumType'], number> = {
        Soil: 0,
        Coco: -2,
        Hydro: 2,
        Aeroponics: 2,
    }

    const potAdjustment = plant.equipment.potType === 'Fabric' ? -1 : 0
    return byMediumType[plant.mediumType ?? 'Soil'] + potAdjustment
}

export function getCorrectedRh(plant: Plant): number {
    return simClamp(
        plant.environment.internalHumidity + getSubstrateRhCorrection(plant),
        25,
        95,
    )
}

export function applyDailyEnvironmentalDrift(
    plant: Plant,
    simulationSettings?: SimulationSettings,
): Plant {
    const p = plant
    const instability = getEnvironmentalInstabilityCurve(simulationSettings)
    if (instability <= 0.01) {
        return p
    }

    const profileCurve = getSimulationProfileCurve(simulationSettings)
    const signal = getPlantSignal(p)
    const driftAmplitude = instability * profileCurve.environmentalDrift
    const tempDrift =
        Math.sin(signal + p.age * DRIFT.tempFrequency) * DRIFT.tempMagnitude * driftAmplitude
    const humidityDrift =
        Math.cos(signal * DRIFT.humidityPhaseShift + p.age * DRIFT.humidityFrequency) *
        DRIFT.humidityMagnitude *
        driftAmplitude

    p.environment.internalTemperature = simClamp(
        p.environment.internalTemperature + tempDrift,
        DRIFT.tempBounds.min,
        DRIFT.tempBounds.max,
    )
    p.environment.internalHumidity = simClamp(
        p.environment.internalHumidity + humidityDrift,
        DRIFT.humidityBounds.min,
        DRIFT.humidityBounds.max,
    )
    return p
}
