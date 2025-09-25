import { SpeechQueueItem } from '@/types';
import { StoreSet, StoreGet } from '@/stores/useAppStore';
import { ttsService } from '@/services/ttsService';

export interface TTSSlice {
    ttsQueue: SpeechQueueItem[];
    isTtsSpeaking: boolean;
    isTtsPaused: boolean;
    currentlySpeakingId: string | null;

    addToTtsQueue: (item: SpeechQueueItem) => void;
    playTts: () => void;
    pauseTts: () => void;
    stopTts: () => void;
    nextTts: () => void;
    clearTtsQueue: () => void;
    _startNextInQueue: () => void;
    _setCurrentlySpeakingId: (id: string | null) => void;
}

export const createTtsSlice = (set: StoreSet, get: StoreGet): TTSSlice => ({
    ttsQueue: [],
    isTtsSpeaking: false,
    isTtsPaused: false,
    currentlySpeakingId: null,

    addToTtsQueue: (item) => {
        set(state => {
            // Avoid adding duplicate text blocks
            if (!state.ttsQueue.some(queued => queued.id === item.id)) {
                state.ttsQueue.push(item);
            }
        });
        if (!get().isTtsSpeaking) {
            get().playTts();
        }
    },

    playTts: () => {
        const { isTtsPaused, ttsQueue } = get();
        if (isTtsPaused) {
            ttsService.resume();
            set({ isTtsSpeaking: true, isTtsPaused: false });
        } else if (ttsQueue.length > 0) {
            get()._startNextInQueue();
        }
    },

    pauseTts: () => {
        ttsService.pause();
        set({ isTtsSpeaking: false, isTtsPaused: true });
    },

    stopTts: () => {
        ttsService.cancel();
        set({ ttsQueue: [], isTtsSpeaking: false, isTtsPaused: false, currentlySpeakingId: null });
    },

    nextTts: () => {
        ttsService.cancel(); // This will trigger the 'onend' event, which calls _startNextInQueue
    },

    clearTtsQueue: () => {
        set({ ttsQueue: [] });
    },
    
    _startNextInQueue: () => {
        const { ttsQueue, settings } = get();
        if (ttsQueue.length === 0) {
            set({ isTtsSpeaking: false, isTtsPaused: false, currentlySpeakingId: null });
            return;
        }

        const nextItem = ttsQueue[0];
        set({ isTtsSpeaking: true, isTtsPaused: false, currentlySpeakingId: nextItem.id });

        const onEnd = () => {
            set(state => {
                // Remove the item that just finished
                state.ttsQueue.shift();
            });
            // Immediately try to start the next one
            get()._startNextInQueue();
        };

        ttsService.speak(nextItem.text, settings.language, onEnd, settings.tts);
    },
    
    _setCurrentlySpeakingId: (id) => {
        set({ currentlySpeakingId: id });
    },
});