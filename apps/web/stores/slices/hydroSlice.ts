import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type {
    HydroState,
    HydroReading,
    HydroAlert,
    HydroSystemType,
    HydroThresholds,
    HydroAlertDirection,
} from '@/types'
import { secureRandom } from '@/utils/random'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_READINGS = 168 // 7 days of hourly readings

const DEFAULT_THRESHOLDS: HydroThresholds = {
    phMin: 5.5,
    phMax: 6.5,
    ecMin: 0.8,
    ecMax: 2.4,
    waterTempMin: 18,
    waterTempMax: 24,
}

// ---------------------------------------------------------------------------
// Alert checker
// ---------------------------------------------------------------------------

function checkAlerts(reading: HydroReading, thresholds: HydroThresholds): HydroAlert[] {
    const alerts: HydroAlert[] = []
    const ts = Date.now()

    const check = (metric: HydroAlert['metric'], value: number, min: number, max: number): void => {
        if (value < min) {
            alerts.push({
                id: `${metric}-low-${ts}-${Math.floor(secureRandom() * 1e6)}`,
                metric,
                value,
                threshold: min,
                direction: 'low' as HydroAlertDirection,
                timestamp: ts,
                dismissed: false,
            })
        } else if (value > max) {
            alerts.push({
                id: `${metric}-high-${ts}-${Math.floor(secureRandom() * 1e6)}`,
                metric,
                value,
                threshold: max,
                direction: 'high' as HydroAlertDirection,
                timestamp: ts,
                dismissed: false,
            })
        }
    }

    check('ph', reading.ph, thresholds.phMin, thresholds.phMax)
    check('ec', reading.ec, thresholds.ecMin, thresholds.ecMax)
    check('waterTemp', reading.waterTemp, thresholds.waterTempMin, thresholds.waterTempMax)

    return alerts
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: HydroState = {
    readings: [],
    alerts: [],
    systemType: 'DWC',
    thresholds: DEFAULT_THRESHOLDS,
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const hydroSlice = createSlice({
    name: 'hydro',
    initialState,
    reducers: {
        addReading(state, action: PayloadAction<Omit<HydroReading, 'id'>>) {
            const reading: HydroReading = {
                ...action.payload,
                id: `hr-${action.payload.timestamp}-${Math.floor(secureRandom() * 1e6)}`,
            }
            state.readings.push(reading)

            // FIFO pruning
            if (state.readings.length > MAX_READINGS) {
                state.readings = state.readings.slice(state.readings.length - MAX_READINGS)
            }

            // Check thresholds and generate alerts
            const newAlerts = checkAlerts(reading, state.thresholds)
            state.alerts.push(...newAlerts)
        },

        removeReading(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter((r) => r.id !== action.payload)
        },

        setSystemType(state, action: PayloadAction<HydroSystemType>) {
            state.systemType = action.payload
        },

        setThresholds(state, action: PayloadAction<Partial<HydroThresholds>>) {
            state.thresholds = { ...state.thresholds, ...action.payload }
        },

        dismissAlert(state, action: PayloadAction<string>) {
            const alert = state.alerts.find((a) => a.id === action.payload)
            if (alert) {
                alert.dismissed = true
            }
        },

        clearAlerts(state) {
            state.alerts = []
        },

        clearReadings(state) {
            state.readings = []
        },
    },
})

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const {
    addReading,
    removeReading,
    setSystemType,
    setThresholds,
    dismissAlert,
    clearAlerts,
    clearReadings,
} = hydroSlice.actions

export default hydroSlice.reducer

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectHydroReadings = (state: RootState): HydroReading[] => state.hydro.readings

export const selectHydroAlerts = (state: RootState): HydroAlert[] =>
    state.hydro.alerts.filter((a) => !a.dismissed)

export const selectHydroSystemType = (state: RootState): HydroSystemType => state.hydro.systemType

export const selectHydroThresholds = (state: RootState): HydroThresholds => state.hydro.thresholds

export const selectLatestReading = (state: RootState): HydroReading | undefined =>
    state.hydro.readings.length > 0
        ? state.hydro.readings[state.hydro.readings.length - 1]
        : undefined

export { DEFAULT_THRESHOLDS, MAX_READINGS, checkAlerts }
