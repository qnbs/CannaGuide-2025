// ---------------------------------------------------------------------------
// @cannaguide/ai-core -- hydroponic & metrics domain types
// ---------------------------------------------------------------------------

import type { HydroSystemType, HydroAlertDirection, HydroForecastTrend } from './enums'

export interface HydroThresholds {
    phMin: number
    phMax: number
    ecMin: number
    ecMax: number
    waterTempMin: number
    waterTempMax: number
}

export interface HydroReading {
    id: string
    timestamp: number
    ph: number
    ec: number
    waterTemp: number
    reservoirLevel?: number | undefined
    tds?: number | undefined
    plantId?: string | undefined
    note?: string | undefined
}

export interface HydroAlert {
    id: string
    metric: 'ph' | 'ec' | 'waterTemp'
    value: number
    threshold: number
    direction: HydroAlertDirection
    timestamp: number
    dismissed: boolean
}

export interface HydroState {
    readings: HydroReading[]
    alerts: HydroAlert[]
    systemType: HydroSystemType
    thresholds: HydroThresholds
}

export interface HydroForecast {
    nextHour: { ph: number; ec: number; temp: number }
    trend: HydroForecastTrend
    confidence: number
    alerts: string[]
    modelBased: boolean
}

export interface MetricsReading {
    id: string
    plantId: string
    timestamp: number
    height?: number | undefined
    potWeight?: number | undefined
    co2?: number | undefined
    notes?: string | undefined
}

export interface MetricsState {
    readings: MetricsReading[]
}
