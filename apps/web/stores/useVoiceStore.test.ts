import { describe, it, expect, beforeEach } from 'vitest'
import { useVoiceStore, getInitialVoiceState } from './useVoiceStore'
import { VoiceMode } from '@/types'

describe('useVoiceStore', () => {
    beforeEach(() => {
        useVoiceStore.setState(getInitialVoiceState())
    })

    it('initializes with idle mode and empty state', () => {
        const state = useVoiceStore.getState()
        expect(state.mode).toBe(VoiceMode.IDLE)
        expect(state.transcriptHistory).toEqual([])
        expect(state.lastMatchedCommand).toBeNull()
        expect(state.confirmationPending).toBeNull()
        expect(state.error).toBeNull()
    })

    it('setMode updates the mode', () => {
        useVoiceStore.getState().setMode(VoiceMode.LISTENING)
        expect(useVoiceStore.getState().mode).toBe(VoiceMode.LISTENING)
    })

    it('addTranscript appends to history', () => {
        useVoiceStore.getState().addTranscript('hello')
        useVoiceStore.getState().addTranscript('world')
        const { transcriptHistory } = useVoiceStore.getState()
        expect(transcriptHistory).toEqual(['hello', 'world'])
    })

    it('addTranscript caps at MAX_TRANSCRIPT_HISTORY (50)', () => {
        for (let i = 0; i < 55; i++) {
            useVoiceStore.getState().addTranscript(`t-${i}`)
        }
        const { transcriptHistory } = useVoiceStore.getState()
        expect(transcriptHistory).toHaveLength(50)
        expect(transcriptHistory[0]).toBe('t-5')
        expect(transcriptHistory[49]).toBe('t-54')
    })

    it('setLastMatchedCommand updates the value', () => {
        useVoiceStore.getState().setLastMatchedCommand('nav_plants')
        expect(useVoiceStore.getState().lastMatchedCommand).toBe('nav_plants')
    })

    it('setLastMatchedCommand can be set to null', () => {
        useVoiceStore.getState().setLastMatchedCommand('nav_plants')
        useVoiceStore.getState().setLastMatchedCommand(null)
        expect(useVoiceStore.getState().lastMatchedCommand).toBeNull()
    })

    it('setConfirmation enters CONFIRMATION mode', () => {
        const confirmation = {
            commandId: 'plant_water_all',
            question: 'Water all plants?',
            onConfirm: () => {},
            onCancel: () => {},
        }
        useVoiceStore.getState().setConfirmation(confirmation)
        const state = useVoiceStore.getState()
        expect(state.mode).toBe(VoiceMode.CONFIRMATION)
        expect(state.confirmationPending).toBe(confirmation)
    })

    it('setConfirmation with null returns to IDLE', () => {
        useVoiceStore.getState().setMode(VoiceMode.CONFIRMATION)
        useVoiceStore.getState().setConfirmation(null)
        expect(useVoiceStore.getState().mode).toBe(VoiceMode.IDLE)
        expect(useVoiceStore.getState().confirmationPending).toBeNull()
    })

    it('clearConfirmation resets confirmation and returns to IDLE', () => {
        useVoiceStore.getState().setConfirmation({
            commandId: 'test',
            question: 'Sure?',
            onConfirm: () => {},
            onCancel: () => {},
        })
        useVoiceStore.getState().clearConfirmation()
        const state = useVoiceStore.getState()
        expect(state.mode).toBe(VoiceMode.IDLE)
        expect(state.confirmationPending).toBeNull()
    })

    it('setError stores the error string', () => {
        useVoiceStore.getState().setError('Something went wrong')
        expect(useVoiceStore.getState().error).toBe('Something went wrong')
    })

    it('setError with null clears the error', () => {
        useVoiceStore.getState().setError('err')
        useVoiceStore.getState().setError(null)
        expect(useVoiceStore.getState().error).toBeNull()
    })

    it('reset restores initial state', () => {
        useVoiceStore.getState().setMode(VoiceMode.SPEAKING)
        useVoiceStore.getState().addTranscript('hello')
        useVoiceStore.getState().setError('err')
        useVoiceStore.getState().setLastMatchedCommand('cmd')

        useVoiceStore.getState().reset()

        const state = useVoiceStore.getState()
        expect(state.mode).toBe(VoiceMode.IDLE)
        expect(state.transcriptHistory).toEqual([])
        expect(state.lastMatchedCommand).toBeNull()
        expect(state.error).toBeNull()
    })

    it('getInitialVoiceState returns a fresh copy', () => {
        const a = getInitialVoiceState()
        const b = getInitialVoiceState()
        expect(a).toEqual(b)
        expect(a).not.toBe(b)
    })
})
