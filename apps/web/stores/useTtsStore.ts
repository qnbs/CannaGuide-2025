import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { SpeechQueueItem, AppSettings } from '@/types'
import { ttsService } from '@/services/ttsService'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface TtsState {
    ttsQueue: SpeechQueueItem[]
    isTtsSpeaking: boolean
    isTtsPaused: boolean
    currentlySpeakingId: string | null
}

export interface TtsActions {
    addToTtsQueue: (item: SpeechQueueItem) => void
    play: (settings: AppSettings) => void
    pause: () => void
    stop: () => void
    next: () => void
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: TtsState = {
    ttsQueue: [],
    isTtsSpeaking: false,
    isTtsPaused: false,
    currentlySpeakingId: null,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTtsStore = create<TtsState & TtsActions>()(
    devtools((set, get) => {
    const startNextInQueue = (settings: AppSettings): void => {
        const state = get()

        if (state.ttsQueue.length === 0) {
            set({ isTtsSpeaking: false, isTtsPaused: false, currentlySpeakingId: null })
            return
        }

        const nextItem = state.ttsQueue[0]
        if (!nextItem) return

        set({ isTtsSpeaking: true, isTtsPaused: false, currentlySpeakingId: nextItem.id })

        const onEnd = (): void => {
            set((s) => ({ ttsQueue: s.ttsQueue.slice(1) }))
            startNextInQueue(settings)
        }

        ttsService.speak(nextItem.text, settings.general.language, onEnd, settings.tts)
    }

    return {
        ...initialState,

        addToTtsQueue: (item) =>
            set((state) => {
                if (state.ttsQueue.some((queued) => queued.id === item.id)) {
                    return state
                }
                return { ttsQueue: [...state.ttsQueue, item] }
            }),

        play: (settings) => {
            const { isTtsPaused, ttsQueue, currentlySpeakingId } = get()
            if (isTtsPaused) {
                ttsService.resume()
                set({ isTtsSpeaking: true, isTtsPaused: false, currentlySpeakingId })
            } else if (ttsQueue.length > 0) {
                startNextInQueue(settings)
            }
        },

        pause: () => {
            ttsService.pause()
            set({ isTtsSpeaking: false, isTtsPaused: true })
        },

        stop: () => {
            ttsService.cancel()
            set({
                ttsQueue: [],
                isTtsSpeaking: false,
                isTtsPaused: false,
                currentlySpeakingId: null,
            })
        },

        next: () => {
            ttsService.cancel()
            // The onEnd callback from the current utterance will trigger startNextInQueue
        },
    }
    },
    { name: 'tts', enabled: import.meta.env.DEV },
    ),
)

// Re-export initial state for test resets
export const getInitialTtsState = (): TtsState => ({ ...initialState })
