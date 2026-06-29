import { describe, expect, it, vi } from 'vitest'

const { mockRegisterFactory } = vi.hoisted(() => ({
    mockRegisterFactory: vi.fn(),
}))

vi.mock('./workerPool', () => ({
    workerPool: {
        registerFactory: mockRegisterFactory,
    },
}))

import { WORKER_NAMES, registerAllWorkerFactories } from './workerFactories'

describe('workerFactories', () => {
    describe('WORKER_NAMES', () => {
        it('contains all expected worker names', () => {
            expect(WORKER_NAMES.VPD).toBe('vpd')
            expect(WORKER_NAMES.VOICE).toBe('voice')
            expect(WORKER_NAMES.VISION_INFERENCE).toBe('visionInference')
            expect(WORKER_NAMES.HYDRO_FORECAST).toBe('hydroForecast')
            expect(WORKER_NAMES.IMAGE_GENERATION).toBe('imageGeneration')
            expect(WORKER_NAMES.INFERENCE).toBe('inference')
            expect(WORKER_NAMES.SCENARIO).toBe('scenario')
            expect(WORKER_NAMES.CALCULATION).toBe('calculation')
            expect(WORKER_NAMES.SIMULATION).toBe('simulation')
            expect(WORKER_NAMES.TERPENE).toBe('terpene')
        })

        it('has 10 worker names', () => {
            expect(Object.keys(WORKER_NAMES)).toHaveLength(10)
        })

        it('all values are unique', () => {
            const values = Object.values(WORKER_NAMES)
            expect(new Set(values).size).toBe(values.length)
        })
    })

    describe('registerAllWorkerFactories', () => {
        it('registers factories with the pool', () => {
            mockRegisterFactory.mockClear()
            registerAllWorkerFactories()
            expect(mockRegisterFactory).toHaveBeenCalledTimes(10)
        })
    })
})
