import { SIM_SECONDS_PER_DAY } from '@/constants'
import type { AppSettings, GeneticModifiers } from '@/types'

export type SimulationSettings = AppSettings['simulation']

export const SIM_MILLISECONDS_PER_DAY = SIM_SECONDS_PER_DAY * 1000

export const DEFAULT_GENETIC_MODIFIERS: GeneticModifiers = {
    pestResistance: 1,
    nutrientUptakeRate: 1,
    stressTolerance: 1,
    rue: 1.5,
    vpdTolerance: { min: 0.8, max: 1.4 },
    transpirationFactor: 1,
    stomataSensitivity: 1,
}

export const SIMULATION_PROFILE_CURVES: Record<
    SimulationSettings['simulationProfile'],
    {
        environmentStress: number
        nutrientStress: number
        pestPressure: number
        environmentalDrift: number
        postHarvestPrecision: number
    }
> = {
    beginner: {
        environmentStress: 0.82,
        nutrientStress: 0.86,
        pestPressure: 0.78,
        environmentalDrift: 0.65,
        postHarvestPrecision: 0.82,
    },
    intermediate: {
        environmentStress: 1,
        nutrientStress: 1,
        pestPressure: 1,
        environmentalDrift: 1,
        postHarvestPrecision: 1,
    },
    expert: {
        environmentStress: 1.14,
        nutrientStress: 1.12,
        pestPressure: 1.2,
        environmentalDrift: 1.18,
        postHarvestPrecision: 1.12,
    },
}

export function getSimulationProfileCurve(simulationSettings?: SimulationSettings) {
    return SIMULATION_PROFILE_CURVES[simulationSettings?.simulationProfile ?? 'intermediate']
}

/** Drift wave parameters for daily environmental variation. */
export const ENVIRONMENTAL_DRIFT = {
    tempMagnitude: 2.4,
    humidityMagnitude: 6.5,
    tempFrequency: 0.73,
    humidityFrequency: 0.57,
    humidityPhaseShift: 1.3,
    tempBounds: { min: 14, max: 36 },
    humidityBounds: { min: 25, max: 90 },
} as const
