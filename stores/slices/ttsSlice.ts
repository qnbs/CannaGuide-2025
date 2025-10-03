import { SpeechQueueItem, TTSSettings } from '@/types';
import { ttsService } from '../../services/ttsService';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface TtsState {
    ttsQueue: SpeechQueueItem[];
    isTtsSpeaking: boolean;
    isTtsPaused: boolean;
    currentlySpeakingId: string | null;
}

const initialState: TtsState = {
    ttsQueue: [],
    isTtsSpeaking: false,
    isTtsPaused: false,
    currentlySpeakingId: null,
};

// Thunk for starting the next item in the queue
const startNextInQueue = createAsyncThunk<void, void, { state: RootState }>(
    'tts/startNextInQueue',
    (_, { getState, dispatch }) => {
        const state = getState().tts;
        const settings = getState().settings.settings;

        if (state.ttsQueue.length === 0) {
            dispatch(ttsSlice.actions._setSpeakingState({ isSpeaking: false, isPaused: false, id: null }));
            return;
        }

        const nextItem = state.ttsQueue[0];
        dispatch(ttsSlice.actions._setSpeakingState({ isSpeaking: true, isPaused: false, id: nextItem.id }));

        const onEnd = () => {
            dispatch(ttsSlice.actions._itemFinished());
            dispatch(startNextInQueue());
        };

        ttsService.speak(nextItem.text, settings.language, onEnd, settings.tts);
    }
);

export const playTts = createAsyncThunk<void, void, { state: RootState }>(
    'tts/play',
    (_, { getState, dispatch }) => {
        const { isTtsPaused, ttsQueue } = getState().tts;
        if (isTtsPaused) {
            ttsService.resume();
            dispatch(ttsSlice.actions._setSpeakingState({ isSpeaking: true, isPaused: false, id: getState().tts.currentlySpeakingId }));
        } else if (ttsQueue.length > 0) {
            dispatch(startNextInQueue());
        }
    }
);

export const nextTts = createAsyncThunk<void, void, { state: RootState }>(
    'tts/next',
    (_, { dispatch }) => {
        ttsService.cancel();
    }
);


const ttsSlice = createSlice({
    name: 'tts',
    initialState,
    reducers: {
        addToTtsQueue: (state, action: PayloadAction<SpeechQueueItem>) => {
            if (!state.ttsQueue.some(queued => queued.id === action.payload.id)) {
                state.ttsQueue.push(action.payload);
            }
        },
        pauseTts: (state) => {
            ttsService.pause();
            state.isTtsSpeaking = false;
            state.isTtsPaused = true;
        },
        stopTts: (state) => {
            ttsService.cancel();
            state.ttsQueue = [];
            state.isTtsSpeaking = false;
            state.isTtsPaused = false;
            state.currentlySpeakingId = null;
        },
        _setSpeakingState: (state, action: PayloadAction<{ isSpeaking: boolean, isPaused: boolean, id: string | null }>) => {
            state.isTtsSpeaking = action.payload.isSpeaking;
            state.isTtsPaused = action.payload.isPaused;
            state.currentlySpeakingId = action.payload.id;
        },
        _itemFinished: (state) => {
            state.ttsQueue.shift();
        }
    }
});

export const { addToTtsQueue, pauseTts, stopTts } = ttsSlice.actions;
export default ttsSlice.reducer;