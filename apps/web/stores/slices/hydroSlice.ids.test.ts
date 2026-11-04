import { describe, expect, it, vi } from 'vitest'

// The random part of a reading id repeats on every call here, the worst case.
vi.mock('@/utils/random', () => ({ secureRandom: () => 0.5 }))

import hydroReducer, { addReading, DEFAULT_THRESHOLDS, removeReading } from './hydroSlice'
import type { HydroState } from '@/types'

const empty: HydroState = {
    readings: [],
    alerts: [],
    systemType: 'DWC',
    thresholds: DEFAULT_THRESHOLDS,
}
const reading = { timestamp: 42, ph: 6, ec: 1.4, waterTemp: 21 }

describe('hydro reading ids through addReading (GH #686)', () => {
    it('stores distinct ids for readings in the same millisecond with the same random part', () => {
        let state = hydroReducer(empty, addReading(reading))
        state = hydroReducer(state, addReading(reading))
        state = hydroReducer(state, addReading(reading))

        const ids = state.readings.map(({ id }) => id)
        expect(new Set(ids).size).toBe(3)

        // Removing one leaves the other two: no shared id.
        const after = hydroReducer(state, removeReading(ids[1] ?? ''))
        expect(after.readings.map(({ id }) => id)).toEqual([ids[0], ids[2]])
    })
})
