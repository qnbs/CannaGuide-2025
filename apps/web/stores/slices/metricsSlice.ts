import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { MetricsState, MetricsReading } from '@/types'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: MetricsState = {
    readings: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const metricsSlice = createSlice({
    name: 'metrics',
    initialState,
    reducers: {
        addMetricsReading(state, action: PayloadAction<MetricsReading>) {
            // Every reading is entered by hand (height, pot weight, CO2). The old
            // cap of 168 per plant silently dropped the oldest one with each new
            // entry (GH #814); the owner decided to keep them all. Readings leave
            // only through clearMetricsForPlant or clearAllMetrics, and the chart
            // bounds itself to its chosen time range.
            state.readings.push(action.payload)
        },
        clearMetricsForPlant(state, action: PayloadAction<string>) {
            state.readings = state.readings.filter((r) => r.plantId !== action.payload)
        },
        clearAllMetrics(state) {
            state.readings = []
        },
    },
})

export const { addMetricsReading, clearMetricsForPlant, clearAllMetrics } = metricsSlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectMetricsReadings = (state: RootState): MetricsReading[] => state.metrics.readings

export const selectMetricsForPlant = (plantId: string): ((state: RootState) => MetricsReading[]) =>
    createSelector(
        (state: RootState) => state.metrics.readings,
        (readings) => readings.filter((r) => r.plantId === plantId),
    )

export const selectLatestMetrics = (
    plantId: string,
): ((state: RootState) => MetricsReading | undefined) =>
    createSelector(
        (state: RootState) => state.metrics.readings,
        (readings) => {
            const plantReadings = readings.filter((r) => r.plantId === plantId)
            return plantReadings.length > 0 ? plantReadings[plantReadings.length - 1] : undefined
        },
    )

export default metricsSlice.reducer
