import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTtsStore, getInitialTtsState } from './useTtsStore'

// Mock ttsService
vi.mock('@/services/ttsService', () => ({
    ttsService: {
        speak: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        cancel: vi.fn(),
    },
}))

describe('useTtsStore', () => {
    beforeEach(() => {
        useTtsStore.setState(getInitialTtsState())
    })

    it('initializes with empty state', () => {
        const state = useTtsStore.getState()
        expect(state.ttsQueue).toEqual([])
        expect(state.isTtsSpeaking).toBe(false)
        expect(state.isTtsPaused).toBe(false)
        expect(state.currentlySpeakingId).toBeNull()
    })

    it('addToTtsQueue adds an item', () => {
        useTtsStore.getState().addToTtsQueue({ id: 'test-1', text: 'Hello' })
        expect(useTtsStore.getState().ttsQueue).toHaveLength(1)
        expect(useTtsStore.getState().ttsQueue[0]?.id).toBe('test-1')
    })

    it('addToTtsQueue deduplicates by id', () => {
        const { addToTtsQueue } = useTtsStore.getState()
        addToTtsQueue({ id: 'test-1', text: 'Hello' })
        addToTtsQueue({ id: 'test-1', text: 'Hello again' })
        expect(useTtsStore.getState().ttsQueue).toHaveLength(1)
    })

    it('pause sets paused state', () => {
        useTtsStore.setState({ isTtsSpeaking: true })
        useTtsStore.getState().pause()
        expect(useTtsStore.getState().isTtsSpeaking).toBe(false)
        expect(useTtsStore.getState().isTtsPaused).toBe(true)
    })

    it('stop clears all state', () => {
        useTtsStore.setState({
            ttsQueue: [{ id: '1', text: 'a' }],
            isTtsSpeaking: true,
            currentlySpeakingId: '1',
        })
        useTtsStore.getState().stop()
        const state = useTtsStore.getState()
        expect(state.ttsQueue).toEqual([])
        expect(state.isTtsSpeaking).toBe(false)
        expect(state.isTtsPaused).toBe(false)
        expect(state.currentlySpeakingId).toBeNull()
    })

    it('play resumes when paused', () => {
        useTtsStore.setState({ isTtsPaused: true, currentlySpeakingId: 'x' })
        const mockSettings = {
            general: { language: 'en' },
            tts: { enabled: true },
        } as never
        useTtsStore.getState().play(mockSettings)
        expect(useTtsStore.getState().isTtsSpeaking).toBe(true)
        expect(useTtsStore.getState().isTtsPaused).toBe(false)
    })
})
