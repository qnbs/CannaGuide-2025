import { describe, it, expect } from 'vitest'
import sandboxReducer, {
    saveExperiment,
    clearCurrentExperiment,
    deleteExperiment,
} from '@/stores/slices/sandboxSlice'

const initial = { currentExperiment: null, status: 'idle' as const, savedExperiments: [] }

describe('sandboxSlice', () => {
    it('returns initial state', () => {
        const state = sandboxReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('clearCurrentExperiment resets experiment and status', () => {
        const running = { ...initial, status: 'succeeded' as const, currentExperiment: { id: 'exp-1' } as any }
        const state = sandboxReducer(running, clearCurrentExperiment())
        expect(state.currentExperiment).toBeNull()
        expect(state.status).toBe('idle')
    })

    it('deleteExperiment removes by id', () => {
        const withExps = {
            ...initial,
            savedExperiments: [
                { id: 'exp-1' } as any,
                { id: 'exp-2' } as any,
            ],
        }
        const state = sandboxReducer(withExps, deleteExperiment('exp-1'))
        expect(state.savedExperiments).toHaveLength(1)
        expect(state.savedExperiments[0].id).toBe('exp-2')
    })

    it('saveExperiment saves current experiment and resets state', () => {
        const withExp = {
            ...initial,
            status: 'succeeded' as const,
            currentExperiment: { plantA: {}, plantB: {} } as any,
        }
        const state = sandboxReducer(
            withExp,
            saveExperiment({ scenario: { id: 'sc-1' } as any, basePlantName: 'TestPlant' }),
        )
        expect(state.savedExperiments).toHaveLength(1)
        expect(state.savedExperiments[0].basePlantName).toBe('TestPlant')
        expect(state.currentExperiment).toBeNull()
        expect(state.status).toBe('idle')
    })
})
