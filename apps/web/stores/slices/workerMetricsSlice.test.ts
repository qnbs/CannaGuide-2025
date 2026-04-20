import { describe, expect, it } from 'vitest'
import workerMetricsReducer, {
    updateWorkerMetrics,
    type WorkerMetricsState,
} from './workerMetricsSlice'

describe('workerMetricsSlice', () => {
    const initialState: WorkerMetricsState = {
        metrics: {},
        poolMetrics: undefined,
        lastUpdatedAt: 0,
    }

    it('has correct initial state', () => {
        const state = workerMetricsReducer(undefined, { type: '@@INIT' })
        expect(state.metrics).toEqual({})
        expect(state.poolMetrics).toBeUndefined()
        expect(state.lastUpdatedAt).toBe(0)
    })

    it('updates metrics via updateWorkerMetrics', () => {
        const mockMetrics = {
            vpd: { dispatches: 10, errors: 0, avgLatencyMs: 5 },
        }
        const state = workerMetricsReducer(
            initialState,
            updateWorkerMetrics({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                metrics: mockMetrics as any,
                poolMetrics: undefined,
            }),
        )
        expect(state.metrics).toEqual(mockMetrics)
        expect(state.lastUpdatedAt).toBeGreaterThan(0)
    })

    it('updates poolMetrics', () => {
        const mockPool = { active: 2, idle: 1, spawned: 3, terminated: 0, factoryCount: 10 }
        const state = workerMetricsReducer(
            initialState,
            updateWorkerMetrics({
                metrics: {},
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                poolMetrics: mockPool as any,
            }),
        )
        expect(state.poolMetrics).toEqual(mockPool)
    })

    it('overwrites previous metrics', () => {
        const state1 = workerMetricsReducer(
            initialState,
            updateWorkerMetrics({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                metrics: { old: {} as any },
                poolMetrics: undefined,
            }),
        )
        const state2 = workerMetricsReducer(
            state1,
            updateWorkerMetrics({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                metrics: { new: {} as any },
                poolMetrics: undefined,
            }),
        )
        expect(state2.metrics).toHaveProperty('new')
        expect(state2.metrics).not.toHaveProperty('old')
    })
})
