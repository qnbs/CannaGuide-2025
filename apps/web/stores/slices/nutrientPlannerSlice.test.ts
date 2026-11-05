import { describe, it, expect } from 'vitest'
import reducer, {
    setMedium,
    toggleAutoAdjust,
    addReading,
    dismissAlert,
    clearAlerts,
    clearReadings,
    updateScheduleEntry,
    resetScheduleToDefaults,
    setAiLoading,
    setAiRecommendation,
    getOptimalRange,
    upsertReading,
    type EcPhReading,
    type NutrientPlannerState,
} from './nutrientPlannerSlice'
import { PlantStage } from '@/types'

const initialState: NutrientPlannerState = {
    schedule: [
        {
            id: 'schedule-seedling',
            growId: 'default-grow',
            stage: PlantStage.Seedling,
            targetEc: 0.6,
            targetPh: 6.2,
            npkRatio: { n: 2, p: 1, k: 1 },
            notes: '',
        },
        {
            id: 'schedule-vegetative',
            growId: 'default-grow',
            stage: PlantStage.Vegetative,
            targetEc: 1.2,
            targetPh: 6.3,
            npkRatio: { n: 3, p: 1, k: 2 },
            notes: '',
        },
        {
            id: 'schedule-flowering',
            growId: 'default-grow',
            stage: PlantStage.Flowering,
            targetEc: 1.6,
            targetPh: 6.1,
            npkRatio: { n: 1, p: 3, k: 3 },
            notes: '',
        },
    ],
    readings: [],
    alerts: [],
    autoAdjustEnabled: false,
    medium: 'Soil',
    isAiLoading: false,
    lastAiRecommendation: null,
    activePluginId: null,
    autoAdjustRecommendation: null,
    activeBrandId: null,
}

describe('nutrientPlannerSlice', () => {
    it('returns the initial state', () => {
        const state = reducer(undefined, { type: 'unknown' })
        expect(state.medium).toBe('Soil')
        expect(state.schedule).toHaveLength(3)
        expect(state.readings).toHaveLength(0)
        expect(state.autoAdjustEnabled).toBe(false)
    })

    it('setMedium changes the medium', () => {
        const state = reducer(initialState, setMedium('Hydro'))
        expect(state.medium).toBe('Hydro')
    })

    it('toggleAutoAdjust flips the flag', () => {
        const state1 = reducer(initialState, toggleAutoAdjust())
        expect(state1.autoAdjustEnabled).toBe(true)
        const state2 = reducer(state1, toggleAutoAdjust())
        expect(state2.autoAdjustEnabled).toBe(false)
    })

    describe('addReading', () => {
        it('adds a reading and generates alerts when out of range', () => {
            const state = reducer(
                initialState,
                addReading({
                    plantId: null,
                    ec: 3.0,
                    ph: 7.5,
                    waterTempC: 22,
                    readingType: 'input',
                    notes: '',
                }),
            )
            expect(state.readings).toHaveLength(1)
            expect(state.readings[0]!.ec).toBe(3.0)
            expect(state.readings[0]!.ph).toBe(7.5)
            // Should generate EC high + pH high alerts
            const activeAlerts = state.alerts.filter((a) => !a.dismissed)
            expect(activeAlerts.length).toBeGreaterThanOrEqual(2)
            expect(activeAlerts.some((a) => a.type === 'ec_high')).toBe(true)
            expect(activeAlerts.some((a) => a.type === 'ph_high')).toBe(true)
        })

        it('does not generate alerts for in-range values', () => {
            const state = reducer(
                initialState,
                addReading({
                    plantId: null,
                    ec: 1.0,
                    ph: 6.3,
                    waterTempC: 20,
                    readingType: 'input',
                    notes: '',
                }),
            )
            expect(state.readings).toHaveLength(1)
            expect(state.alerts).toHaveLength(0)
        })

        it('generates low alerts for below-range values', () => {
            const state = reducer(
                initialState,
                addReading({
                    plantId: null,
                    ec: 0.2,
                    ph: 5.0,
                    waterTempC: 20,
                    readingType: 'runoff',
                    notes: '',
                }),
            )
            const activeAlerts = state.alerts.filter((a) => !a.dismissed)
            expect(activeAlerts.some((a) => a.type === 'ec_low')).toBe(true)
            expect(activeAlerts.some((a) => a.type === 'ph_low')).toBe(true)
        })
    })

    it('dismissAlert marks an alert as dismissed', () => {
        let state = reducer(
            initialState,
            addReading({
                plantId: null,
                ec: 3.0,
                ph: 7.5,
                waterTempC: 22,
                readingType: 'input',
                notes: '',
            }),
        )
        const alertId = state.alerts[0]!.id
        state = reducer(state, dismissAlert(alertId))
        expect(state.alerts.find((a) => a.id === alertId)?.dismissed).toBe(true)
    })

    it('clearAlerts removes all alerts', () => {
        let state = reducer(
            initialState,
            addReading({
                plantId: null,
                ec: 3.0,
                ph: 7.5,
                waterTempC: 22,
                readingType: 'input',
                notes: '',
            }),
        )
        expect(state.alerts.length).toBeGreaterThan(0)
        state = reducer(state, clearAlerts())
        expect(state.alerts).toHaveLength(0)
    })

    it('clearReadings removes all readings', () => {
        let state = reducer(
            initialState,
            addReading({
                plantId: null,
                ec: 1.0,
                ph: 6.3,
                waterTempC: 20,
                readingType: 'input',
                notes: '',
            }),
        )
        expect(state.readings.length).toBe(1)
        state = reducer(state, clearReadings())
        expect(state.readings).toHaveLength(0)
    })

    it('updateScheduleEntry modifies a specific entry', () => {
        const state = reducer(
            initialState,
            updateScheduleEntry({
                id: 'schedule-vegetative',
                changes: { targetEc: 1.5, targetPh: 6.0 },
            }),
        )
        const entry = state.schedule.find((e) => e.id === 'schedule-vegetative')
        expect(entry?.targetEc).toBe(1.5)
        expect(entry?.targetPh).toBe(6.0)
    })

    it('resetScheduleToDefaults restores defaults', () => {
        let state = reducer(
            initialState,
            updateScheduleEntry({
                id: 'schedule-vegetative',
                changes: { targetEc: 99 },
            }),
        )
        state = reducer(state, resetScheduleToDefaults())
        const entry = state.schedule.find((e) => e.id === 'schedule-vegetative')
        expect(entry?.targetEc).toBe(1.2)
    })

    it('setAiLoading and setAiRecommendation manage AI state', () => {
        let state = reducer(initialState, setAiLoading(true))
        expect(state.isAiLoading).toBe(true)
        state = reducer(state, setAiRecommendation('Use pH down'))
        expect(state.isAiLoading).toBe(false)
        expect(state.lastAiRecommendation).toBe('Use pH down')
    })
})

describe('EC/pH reading retention (GH #814)', () => {
    const inRange = {
        plantId: null,
        ec: 1.0,
        ph: 6.3,
        waterTempC: 20,
        readingType: 'input' as const,
        notes: '',
    }

    const stored = (index: number, ec = 1.0): EcPhReading => ({
        ...inRange,
        id: `legacy-${String(index)}`,
        timestamp: index,
        ec,
    })

    /** A store at the old cap of 500, with non-default settings. */
    const legacy: NutrientPlannerState = {
        ...initialState,
        medium: 'Hydro',
        readings: Array.from({ length: 500 }, (_, i) => stored(i)),
    }

    it.each([499, 500, 501, 1000])('keeps all %i manually logged readings', (count) => {
        let state = initialState
        for (let i = 0; i < count; i++) state = reducer(state, addReading(inRange))

        expect(state.readings).toHaveLength(count)
        expect(new Set(state.readings.map(({ id }) => id)).size).toBe(count)
    })

    it('a store at the old cap keeps all 500 and the new one, and its settings', () => {
        const state = reducer(legacy, addReading(inRange))

        expect(state.readings).toHaveLength(501)
        expect(state.readings.slice(0, 500)).toEqual(legacy.readings)
        expect(state.medium).toBe('Hydro')
        expect(state.schedule).toEqual(legacy.schedule)
    })

    it('upserting a new id at the old cap adds it without dropping another', () => {
        const state = reducer(legacy, upsertReading(stored(900)))

        expect(state.readings).toHaveLength(501)
        expect(state.readings[0]?.id).toBe('legacy-0')
        expect(state.readings.at(-1)?.id).toBe('legacy-900')
    })

    it('upserting an existing id replaces only that reading', () => {
        const state = reducer(legacy, upsertReading(stored(250, 2.4)))

        expect(state.readings).toHaveLength(500)
        expect(state.readings[250]).toEqual(stored(250, 2.4))
        expect(state.readings.filter((_, i) => i !== 250)).toEqual(
            legacy.readings.filter((_, i) => i !== 250),
        )
    })

    it('keeps a long history through a reload', () => {
        const reloaded = JSON.parse(
            JSON.stringify(reducer(legacy, addReading(inRange))),
        ) as NutrientPlannerState

        expect(reloaded.readings).toHaveLength(501)
        expect(reloaded.readings[0]).toEqual(stored(0))
    })

    it('auto-adjust still reads only the recent window of a long history', () => {
        // 600 old readings far above the EC range, then 10 in range.
        const highHistory: NutrientPlannerState = {
            ...initialState,
            autoAdjustEnabled: true,
            readings: Array.from({ length: 600 }, (_, i) => stored(i, 9)),
        }
        let state = highHistory
        for (let i = 0; i < 10; i++) state = reducer(state, addReading(inRange))

        expect(state.readings).toHaveLength(610)
        expect(state.autoAdjustRecommendation).toBeNull()
    })
})

describe('getOptimalRange', () => {
    it('returns correct soil vegetative range', () => {
        const range = getOptimalRange('Soil', PlantStage.Vegetative)
        expect(range.ecMin).toBe(0.8)
        expect(range.ecMax).toBe(1.4)
        expect(range.phMin).toBe(6.0)
        expect(range.phMax).toBe(6.8)
    })

    it('returns correct hydro flowering range', () => {
        const range = getOptimalRange('Hydro', PlantStage.Flowering)
        expect(range.ecMin).toBe(1.4)
        expect(range.ecMax).toBe(2.4)
        expect(range.phMin).toBe(5.5)
        expect(range.phMax).toBe(6.0)
    })

    it('falls back to default for unknown stage', () => {
        const range = getOptimalRange('Coco', PlantStage.Harvest)
        expect(range.ecMin).toBe(0.8)
    })

    it('falls back to Soil for unknown medium', () => {
        const range = getOptimalRange('DWC', PlantStage.Vegetative)
        expect(range.ecMin).toBe(0.8)
        expect(range.phMin).toBe(6.0)
    })
})
