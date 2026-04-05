import { describe, it, expect } from 'vitest'
import hydroReducer, {
    addReading,
    removeReading,
    setSystemType,
    setThresholds,
    dismissAlert,
    clearAlerts,
    clearReadings,
    checkAlerts,
    DEFAULT_THRESHOLDS,
    MAX_READINGS,
} from './hydroSlice'
import type { HydroState, HydroReading, HydroThresholds } from '@/types'

const initialState: HydroState = {
    readings: [],
    alerts: [],
    systemType: 'DWC',
    thresholds: DEFAULT_THRESHOLDS,
}

const makeReading = (
    overrides: Partial<Omit<HydroReading, 'id'>> = {},
): Omit<HydroReading, 'id'> => ({
    timestamp: Date.now(),
    ph: 6.0,
    ec: 1.4,
    waterTemp: 21,
    ...overrides,
})

describe('hydroSlice', () => {
    it('adds a reading with auto-generated id', () => {
        const state = hydroReducer(initialState, addReading(makeReading()))
        expect(state.readings).toHaveLength(1)
        expect(state.readings[0]?.id).toMatch(/^hr-/)
        expect(state.readings[0]?.ph).toBe(6.0)
    })

    it('applies FIFO pruning when exceeding MAX_READINGS', () => {
        let state = initialState
        for (let i = 0; i < MAX_READINGS + 5; i++) {
            state = hydroReducer(state, addReading(makeReading({ timestamp: i })))
        }
        expect(state.readings).toHaveLength(MAX_READINGS)
        // Oldest readings should have been pruned
        expect(state.readings[0]?.timestamp).toBe(5)
    })

    it('removes a reading by id', () => {
        let state = hydroReducer(initialState, addReading(makeReading()))
        const id = state.readings[0]?.id ?? ''
        state = hydroReducer(state, removeReading(id))
        expect(state.readings).toHaveLength(0)
    })

    it('sets system type', () => {
        const state = hydroReducer(initialState, setSystemType('NFT'))
        expect(state.systemType).toBe('NFT')
    })

    it('updates thresholds partially', () => {
        const state = hydroReducer(initialState, setThresholds({ phMin: 5.0, ecMax: 3.0 }))
        expect(state.thresholds.phMin).toBe(5.0)
        expect(state.thresholds.ecMax).toBe(3.0)
        // Unchanged thresholds preserved
        expect(state.thresholds.phMax).toBe(DEFAULT_THRESHOLDS.phMax)
    })

    it('dismisses an alert by id', () => {
        // Add reading that triggers alert (pH too low)
        const state = hydroReducer(initialState, addReading(makeReading({ ph: 4.0 })))
        expect(state.alerts.length).toBeGreaterThan(0)
        const alertId = state.alerts[0]?.id ?? ''
        const updated = hydroReducer(state, dismissAlert(alertId))
        expect(updated.alerts[0]?.dismissed).toBe(true)
    })

    it('clears all readings', () => {
        let state = hydroReducer(initialState, addReading(makeReading()))
        state = hydroReducer(state, addReading(makeReading()))
        state = hydroReducer(state, clearReadings())
        expect(state.readings).toHaveLength(0)
    })

    it('clears all alerts', () => {
        let state = hydroReducer(initialState, addReading(makeReading({ ph: 4.0 })))
        expect(state.alerts.length).toBeGreaterThan(0)
        state = hydroReducer(state, clearAlerts())
        expect(state.alerts).toHaveLength(0)
    })

    it('has correct default thresholds', () => {
        expect(initialState.thresholds.phMin).toBe(5.5)
        expect(initialState.thresholds.phMax).toBe(6.5)
        expect(initialState.thresholds.ecMin).toBe(0.8)
        expect(initialState.thresholds.ecMax).toBe(2.4)
        expect(initialState.thresholds.waterTempMin).toBe(18)
        expect(initialState.thresholds.waterTempMax).toBe(24)
    })
})

describe('checkAlerts', () => {
    const thresholds: HydroThresholds = DEFAULT_THRESHOLDS

    it('generates alert when pH is too low', () => {
        const reading: HydroReading = {
            id: 'test',
            timestamp: Date.now(),
            ph: 4.5,
            ec: 1.5,
            waterTemp: 21,
        }
        const alerts = checkAlerts(reading, thresholds)
        expect(alerts.some((a) => a.metric === 'ph' && a.direction === 'low')).toBe(true)
    })

    it('generates alert when EC is too high', () => {
        const reading: HydroReading = {
            id: 'test',
            timestamp: Date.now(),
            ph: 6.0,
            ec: 3.5,
            waterTemp: 21,
        }
        const alerts = checkAlerts(reading, thresholds)
        expect(alerts.some((a) => a.metric === 'ec' && a.direction === 'high')).toBe(true)
    })

    it('generates alert when water temp is too high', () => {
        const reading: HydroReading = {
            id: 'test',
            timestamp: Date.now(),
            ph: 6.0,
            ec: 1.5,
            waterTemp: 28,
        }
        const alerts = checkAlerts(reading, thresholds)
        expect(alerts.some((a) => a.metric === 'waterTemp' && a.direction === 'high')).toBe(true)
    })

    it('generates no alerts when all values are in range', () => {
        const reading: HydroReading = {
            id: 'test',
            timestamp: Date.now(),
            ph: 6.0,
            ec: 1.5,
            waterTemp: 21,
        }
        const alerts = checkAlerts(reading, thresholds)
        expect(alerts).toHaveLength(0)
    })
})
