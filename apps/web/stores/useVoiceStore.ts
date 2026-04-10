import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { VoiceConfirmation, VoiceSessionState } from '@/types'
import { VoiceMode } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TRANSCRIPT_HISTORY = 50

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type VoiceState = VoiceSessionState

export interface VoiceActions {
    setMode: (mode: VoiceMode) => void
    addTranscript: (transcript: string) => void
    setLastMatchedCommand: (commandId: string | null) => void
    setConfirmation: (confirmation: VoiceConfirmation | null) => void
    clearConfirmation: () => void
    setError: (error: string | null) => void
    reset: () => void
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: VoiceState = {
    mode: VoiceMode.IDLE,
    transcriptHistory: [],
    lastMatchedCommand: null,
    confirmationPending: null,
    continuousListeningEnabled: false,
    error: null,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useVoiceStore = create<VoiceState & VoiceActions>()(
    devtools(
        subscribeWithSelector((set) => ({
            ...initialState,

            setMode: (mode) => set({ mode }),

            addTranscript: (transcript) =>
                set((state) => ({
                    transcriptHistory: [
                        ...state.transcriptHistory.slice(-(MAX_TRANSCRIPT_HISTORY - 1)),
                        transcript,
                    ],
                })),

            setLastMatchedCommand: (commandId) => set({ lastMatchedCommand: commandId }),

            setConfirmation: (confirmation) =>
                set({
                    confirmationPending: confirmation,
                    mode: confirmation ? VoiceMode.CONFIRMATION : VoiceMode.IDLE,
                }),

            clearConfirmation: () => set({ confirmationPending: null, mode: VoiceMode.IDLE }),

            setError: (error) => set({ error }),

            reset: () => set({ ...initialState }),
        })),
        { name: 'voice', enabled: import.meta.env.DEV },
    ),
)

// Re-export initial state for test resets
export const getInitialVoiceState = (): VoiceState => ({ ...initialState })
