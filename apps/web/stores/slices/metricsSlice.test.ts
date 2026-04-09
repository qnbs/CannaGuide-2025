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

    it('applies FIFO pruning per plant at 168 cap', () => {
        let state = initialState
        for (let i = 0; i < 175; i++) {
            state = metricsReducer(
                state,
                addMetricsReading(makeReading({ plantId: 'plant-1', timestamp: i, height: i })),
            )
        }
        const plant1Readings = state.readings.filter((r) => r.plantId === 'plant-1')
        expect(plant1Readings).toHaveLength(168)
        // Oldest pruned -- first remaining should be offset by 7
        expect(plant1Readings[0]?.timestamp).toBe(7)
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
