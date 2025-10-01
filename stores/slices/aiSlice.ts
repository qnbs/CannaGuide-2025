
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Plant, PlantDiagnosisResponse, DeepDiveGuide } from '@/types';
import { geminiService } from '@/services/geminiService';
import { RootState } from '../store';

// FIX: This file was empty. Its content has been created to resolve multiple import errors across the application.
// It uses the async thunk pattern which appears to be partially replaced by RTK Query in other parts of the app.
// This implementation provides the missing state and actions that components are still trying to import.

// State interfaces
interface DiagnosticsState {
    isLoading: boolean;
    response: PlantDiagnosisResponse | null;
    error: string | null;
}

interface DeepDiveState {
    [key: string]: { // key is plantId-topic
        isLoading: boolean;
        response: DeepDiveGuide | null;
        error: string | null;
    }
}

interface AiState {
    diagnostics: DiagnosticsState;
    deepDive: DeepDiveState;
    // mentorChat is managed in component local state
}

const initialState: AiState = {
    diagnostics: { isLoading: false, response: null, error: null },
    deepDive: {},
};

// Async Thunks
export const startDiagnostics = createAsyncThunk(
    'ai/startDiagnostics',
    async (args: { base64Image: string, mimeType: string, plant: Plant, userNotes: string }, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        const response = await geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang);
        return response;
    }
);

export const startDeepDiveGeneration = createAsyncThunk(
    'ai/startDeepDiveGeneration',
    async (args: { topic: string, plant: Plant }, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        const response = await geminiService.generateDeepDive(args.topic, args.plant, lang);
        return { response, key: `${args.plant.id}-${args.topic}` };
    }
);

const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        clearMentorChat: (state) => { 
            // This is a no-op to satisfy component imports. Mentor chat state is local to its component.
        },
        resetDiagnosticsState: (state) => {
            state.diagnostics = { isLoading: false, response: null, error: null };
        }
    },
    extraReducers: (builder) => {
        builder
            // Diagnostics
            .addCase(startDiagnostics.pending, (state) => {
                state.diagnostics = { isLoading: true, response: null, error: null };
            })
            .addCase(startDiagnostics.fulfilled, (state, action: PayloadAction<PlantDiagnosisResponse>) => {
                state.diagnostics = { isLoading: false, response: action.payload, error: null };
            })
            .addCase(startDiagnostics.rejected, (state, action) => {
                state.diagnostics = { isLoading: false, response: null, error: action.error.message || 'Failed to get diagnosis' };
            })
            // Deep Dive
            .addCase(startDeepDiveGeneration.pending, (state, action) => {
                const key = `${action.meta.arg.plant.id}-${action.meta.arg.topic}`;
                state.deepDive[key] = { isLoading: true, response: null, error: null };
            })
            .addCase(startDeepDiveGeneration.fulfilled, (state, action) => {
                state.deepDive[action.payload.key] = { isLoading: false, response: action.payload.response, error: null };
            })
            .addCase(startDeepDiveGeneration.rejected, (state, action) => {
                const key = `${action.meta.arg.plant.id}-${action.meta.arg.topic}`;
                state.deepDive[key] = { isLoading: false, response: null, error: action.error.message || 'Failed to get deep dive' };
            });
    }
});

export const { clearMentorChat, resetDiagnosticsState } = aiSlice.actions;
export default aiSlice.reducer;
