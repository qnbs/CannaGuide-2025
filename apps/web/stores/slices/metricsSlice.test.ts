import { describe, it, expect } from 'vitest'
import metricsReducer, {
    addMetricsReading,
    clearMetricsForPlant,
    clearAllMetrics,
    selectMetricsForPlant,
    selectLatestMetrics,
} from './metricsSlice'
import type { MetricsState, MetricsReading } from '@/types'

const initialState: MetricsState = { readings: [] }

let idCounter = 0
const makeReading = (overrides: Partial<MetricsReading> = {}): MetricsReading => ({
    id: `mr-${++idCounter}`,
    plantId: 'plant-1',
    timestamp: Date.now(),
    ...overrides,
})

describe('metricsSlice', () => {
    it('adds a reading', () => {
        const reading = makeReading({ height: 15 })
        const state = metricsReducer(initialState, addMetricsReading(reading))
        expect(state.readings).toHaveLength(1)
        expect(state.readings[0]?.height).toBe(15)
    })

    it.each([167, 168, 169, 500])('keeps all %i manual readings of a plant', (count) => {
        let state = initialState
        for (let i = 0; i < count; i++) {
            state = metricsReducer(
                state,
                addMetricsReading(makeReading({ plantId: 'plant-1', timestamp: i, height: i })),
            )
        }
        const plant1Readings = state.readings.filter((r) => r.plantId === 'plant-1')
        expect(plant1Readings).toHaveLength(count)
        // The first manual entry is still there, and still the oldest.
        expect(plant1Readings[0]?.timestamp).toBe(0)
        expect(plant1Readings.at(-1)?.height).toBe(count - 1)
    })

    it('keeps a sparse multi-month history through a reload, per plant', () => {
        const DAY = 86_400_000
        let state = initialState
        // One reading every other day for 400 days on plant-1, weekly on plant-2.
        for (let day = 0; day < 400; day += 2) {
            state = metricsReducer(
                state,
                addMetricsReading(makeReading({ plantId: 'plant-1', timestamp: day * DAY })),
            )
            if (day % 7 === 0) {
                state = metricsReducer(
                    state,
                    addMetricsReading(makeReading({ plantId: 'plant-2', timestamp: day * DAY })),
                )
            }
        }
        const reloaded = JSON.parse(JSON.stringify(state)) as MetricsState
        const root = { metrics: reloaded } as Parameters<
            ReturnType<typeof selectMetricsForPlant>
        >[0]

        expect(selectMetricsForPlant('plant-1')(root)).toHaveLength(200)
        expect(selectMetricsForPlant('plant-1')(root)[0]?.timestamp).toBe(0)
        expect(selectMetricsForPlant('plant-2')(root)).toHaveLength(29)
        expect(selectLatestMetrics('plant-1')(root)?.timestamp).toBe(398 * DAY)
    })

    it('keeps readings with duplicate and out-of-order timestamps', () => {
        let state = initialState
        for (const timestamp of [5, 5, 1, 9, 1]) {
            state = metricsReducer(state, addMetricsReading(makeReading({ timestamp })))
        }
        expect(state.readings.map((r) => r.timestamp)).toEqual([5, 5, 1, 9, 1])
    })

    it('a legacy plant at the old cap keeps its 168 readings and the 169th', () => {
        const legacy: MetricsState = {
            readings: Array.from({ length: 168 }, (_, i) =>
                makeReading({ plantId: 'plant-1', timestamp: i }),
            ),
        }
        const state = metricsReducer(
            legacy,
            addMetricsReading(makeReading({ plantId: 'plant-1', timestamp: 168 })),
        )
        expect(state.readings).toHaveLength(169)
        expect(state.readings.slice(0, 168)).toEqual(legacy.readings)
    })

    it('does not prune readings of other plants', () => {
        let state = metricsReducer(
            initialState,
            addMetricsReading(makeReading({ plantId: 'plant-2', height: 10 })),
        )
        for (let i = 0; i < 170; i++) {
            state = metricsReducer(
                state,
                addMetricsReading(makeReading({ plantId: 'plant-1', timestamp: i })),
            )
        }
        const plant2Readings = state.readings.filter((r) => r.plantId === 'plant-2')
        expect(plant2Readings).toHaveLength(1)
    })

    it('clears readings for a specific plant', () => {
        let state = metricsReducer(
            initialState,
            addMetricsReading(makeReading({ plantId: 'plant-1' })),
        )
        state = metricsReducer(state, addMetricsReading(makeReading({ plantId: 'plant-2' })))
        state = metricsReducer(state, clearMetricsForPlant('plant-1'))
        expect(state.readings).toHaveLength(1)
        expect(state.readings[0]?.plantId).toBe('plant-2')
    })

    it('clears all readings', () => {
        let state = metricsReducer(
            initialState,
            addMetricsReading(makeReading({ plantId: 'plant-1' })),
        )
        state = metricsReducer(state, addMetricsReading(makeReading({ plantId: 'plant-2' })))
        state = metricsReducer(state, clearAllMetrics())
        expect(state.readings).toHaveLength(0)
    })

    describe('selectors', () => {
        const rootState = {
            metrics: {
                readings: [
                    { id: 'mr-a', plantId: 'p1', timestamp: 100, height: 10 },
                    { id: 'mr-b', plantId: 'p1', timestamp: 200, height: 20 },
                    { id: 'mr-c', plantId: 'p2', timestamp: 150, height: 15 },
                ] as MetricsReading[],
            },
        } as never

        it('selectMetricsForPlant returns readings for plant', () => {
            const result = selectMetricsForPlant('p1')(rootState)
            expect(result).toHaveLength(2)
        })

        it('selectLatestMetrics returns the most recent reading', () => {
            const result = selectLatestMetrics('p1')(rootState)
            expect(result?.height).toBe(20)
        })

        it('selectLatestMetrics returns undefined for unknown plant', () => {
            const result = selectLatestMetrics('unknown')(rootState)
            expect(result).toBeUndefined()
        })
    })
})
