import type { PlantStage } from '@/types'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'

export interface SimulationDiagnostics {
    profile: {
        name: SimulationSettings['simulationProfile']
        environmentStress: number
        nutrientStress: number
        pestPressure: number
        postHarvestPrecision: number
    }
    environment: {
        temperature: number
        humidity: number
        correctedRh: number
        vpd: number
        targetMin: number
        targetMax: number
        leafOffset: number
        altitudeM: number
    }
    growth: {
        lightAbsorption: number
        co2Factor: number
        nutrientAvailability: number
        nutrientConversionEfficiency: number
        lightExtinctionCoefficient: number
        stomataSensitivity: number
    }
    stress: {
        environmentalInstability: number
        nutrientSensitivityCurve: number
        pestPressureCurve: number
        accumulatedSubdayHours: number
    }
    dominantFactors: Array<{
        id: 'vpd' | 'lightCapture' | 'nutrientThroughput' | 'pestPressure'
        value: string
        tone: 'good' | 'warn' | 'critical'
        context: Record<string, string | number>
    }>
    postHarvest?:
        | {
              stage: PlantStage
              jarHumidity: number
              chlorophyllPercent: number
              terpeneRetentionPercent: number
              moldRiskPercent: number
              finalQuality: number
              burpDebtDays: number
          }
        | undefined
}
