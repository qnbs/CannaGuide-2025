import { AIResponse, Plant, Recommendation, PlantDiagnosisResponse, MentorMessage, Strain, StructuredGrowTips, DeepDiveGuide } from '../../types';
import { geminiService } from '../../services/geminiService';
import { i18nInstance } from '../../i18n';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface AiState<T> {
    isLoading: boolean;
    response: T | null;
    error: string | null;
    sourceDetails?: any;
}

export interface AiSliceState {
    equipmentGeneration: AiState<Recommendation>;
    diagnostics: AiState<PlantDiagnosisResponse>;
    proactiveDiagnosis: AiState<AIResponse>;
    advisorChats: Record<string, AiState<AIResponse>>;
    mentorChats: Record<string, { history: MentorMessage[], isLoading: boolean, error: string | null }>;
    strainTips: Record<string, AiState<StructuredGrowTips>>;
    deepDives: Record<string, AiState<DeepDiveGuide>>;
}

const initialState: AiSliceState = {
    equipmentGeneration: { isLoading: false, response: null, error: null },
    diagnostics: { isLoading: false, response: null, error: null },
    proactiveDiagnosis: { isLoading: false, response: null, error: null },
    advisorChats: {},
    mentorChats: {},
    strainTips: {},
    deepDives: {},
};

// --- Async Thunks ---
export const startEquipmentGeneration = createAsyncThunk<
    { recommendation: Recommendation, details: any },
    { prompt: string, details: any },
    { state: RootState }
>(
    'ai/startEquipmentGeneration',
    async ({ prompt, details }, { getState }) => {
        const lang = getState().settings.settings.language;
        const recommendation = await geminiService.getEquipmentRecommendation(prompt, lang);
        return { recommendation, details };
    }
);

export const startDiagnostics = createAsyncThunk<
    PlantDiagnosisResponse,
    { base64Image: string, mimeType: string, plant: Plant, userNotes: string },
    { state: RootState }
>(
    'ai/startDiagnostics',
    async ({ base64Image, mimeType, plant, userNotes }, { getState }) => {
        const lang = getState().settings.settings.language;
        return await geminiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang);
    }
);

export const startAdvisorGeneration = createAsyncThunk<
    { plantId: string, advice: AIResponse },
    Plant,
    { state: RootState }
>(
    'ai/startAdvisorGeneration',
    async (plant, { getState }) => {
        const lang = getState().settings.settings.language;
        const advice = await geminiService.getPlantAdvice(plant, lang);
        return { plantId: plant.id, advice };
    }
);

export const startProactiveDiagnosis = createAsyncThunk<
    AIResponse,
    Plant,
    { state: RootState }
>(
    'ai/startProactiveDiagnosis',
    async (plant, { getState }) => {
        const lang = getState().settings.settings.language;
        return await geminiService.getProactiveDiagnosis(plant, lang);
    }
);

export const startPlantMentorChat = createAsyncThunk<
    { plantId: string, response: Omit<MentorMessage, 'role'> },
    { plant: Plant, query: string },
    { state: RootState }
>(
    'ai/startPlantMentorChat',
    async ({ plant, query }, { getState }) => {
        const lang = getState().settings.settings.language;
        const response = await geminiService.getMentorResponse(plant, query, lang);
        return { plantId: plant.id, response };
    }
);

export const startStrainTipGeneration = createAsyncThunk<
    { strainId: string, tips: StructuredGrowTips },
    { strain: Strain, context: { focus: string, stage: string, experience: string } },
    { state: RootState }
>(
    'ai/startStrainTipGeneration',
    async ({ strain, context }, { getState }) => {
        const lang = getState().settings.settings.language;
        const tips = await geminiService.getStrainTips(strain, context, lang);
        return { strainId: strain.id, tips };
    }
);

export const startDeepDiveGeneration = createAsyncThunk<
    { key: string, guide: DeepDiveGuide },
    { topic: string, plant: Plant },
    { state: RootState }
>(
    'ai/startDeepDiveGeneration',
    async ({ topic, plant }, { getState }) => {
        const lang = getState().settings.settings.language;
        const guide = await geminiService.generateDeepDive(topic, plant, lang);
        return { key: `${plant.id}-${topic}`, guide };
    }
);


const aiSlice = createSlice({
    name: 'ai',
    initialState,
    reducers: {
        resetEquipmentGenerationState: (state) => {
            state.equipmentGeneration = { isLoading: false, response: null, error: null };
        },
        resetDiagnosticsState: (state) => {
            state.diagnostics = { isLoading: false, response: null, error: null };
        },
        clearMentorChat: (state, action: PayloadAction<string>) => {
            if (state.mentorChats[action.payload]) {
                state.mentorChats[action.payload].history = [];
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Equipment Generation
            .addCase(startEquipmentGeneration.pending, (state, action) => {
                state.equipmentGeneration = { isLoading: true, response: null, error: null, sourceDetails: action.meta.arg.details };
            })
            .addCase(startEquipmentGeneration.fulfilled, (state, action) => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.response = action.payload.recommendation;
            })
            .addCase(startEquipmentGeneration.rejected, (state, action) => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            })
            // Diagnostics
            .addCase(startDiagnostics.pending, (state) => {
                state.diagnostics = { isLoading: true, response: null, error: null };
            })
            .addCase(startDiagnostics.fulfilled, (state, action) => {
                state.diagnostics.isLoading = false;
                state.diagnostics.response = action.payload;
            })
            .addCase(startDiagnostics.rejected, (state, action) => {
                state.diagnostics.isLoading = false;
                state.diagnostics.error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            })
            // Advisor Generation
            .addCase(startAdvisorGeneration.pending, (state, action) => {
                state.advisorChats[action.meta.arg.id] = { isLoading: true, response: null, error: null };
            })
            .addCase(startAdvisorGeneration.fulfilled, (state, action) => {
                state.advisorChats[action.payload.plantId].isLoading = false;
                state.advisorChats[action.payload.plantId].response = action.payload.advice;
            })
            .addCase(startAdvisorGeneration.rejected, (state, action) => {
                state.advisorChats[action.meta.arg.id].isLoading = false;
                state.advisorChats[action.meta.arg.id].error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            })
            // Proactive Diagnosis
            .addCase(startProactiveDiagnosis.pending, (state) => {
                state.proactiveDiagnosis = { isLoading: true, response: null, error: null };
            })
            .addCase(startProactiveDiagnosis.fulfilled, (state, action) => {
                state.proactiveDiagnosis.isLoading = false;
                state.proactiveDiagnosis.response = action.payload;
            })
            .addCase(startProactiveDiagnosis.rejected, (state, action) => {
                state.proactiveDiagnosis.isLoading = false;
                state.proactiveDiagnosis.error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            })
            // Mentor Chat
            .addCase(startPlantMentorChat.pending, (state, action) => {
                const { plant, query } = action.meta.arg;
                if (!state.mentorChats[plant.id]) {
                    state.mentorChats[plant.id] = { history: [], isLoading: false, error: null };
                }
                state.mentorChats[plant.id].history.push({ role: 'user', content: query });
                state.mentorChats[plant.id].isLoading = true;
                state.mentorChats[plant.id].error = null;
            })
            .addCase(startPlantMentorChat.fulfilled, (state, action) => {
                const { plantId, response } = action.payload;
                state.mentorChats[plantId].history.push({ role: 'model', ...response });
                state.mentorChats[plantId].isLoading = false;
            })
            .addCase(startPlantMentorChat.rejected, (state, action) => {
                const { plant } = action.meta.arg;
                const errorMessage = i18nInstance.t(action.error.message || 'ai.error.unknown');
                state.mentorChats[plant.id].history.push({ role: 'model', title: i18nInstance.t('common.error'), content: errorMessage });
                state.mentorChats[plant.id].isLoading = false;
                state.mentorChats[plant.id].error = errorMessage;
            })
            // Strain Tips
            .addCase(startStrainTipGeneration.pending, (state, action) => {
                state.strainTips[action.meta.arg.strain.id] = { isLoading: true, response: null, error: null };
            })
            .addCase(startStrainTipGeneration.fulfilled, (state, action) => {
                state.strainTips[action.payload.strainId].isLoading = false;
                state.strainTips[action.payload.strainId].response = action.payload.tips;
            })
            .addCase(startStrainTipGeneration.rejected, (state, action) => {
                state.strainTips[action.meta.arg.strain.id].isLoading = false;
                state.strainTips[action.meta.arg.strain.id].error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            })
            // Deep Dives
            .addCase(startDeepDiveGeneration.pending, (state, action) => {
                 const { plant, topic } = action.meta.arg;
                 const key = `${plant.id}-${topic}`;
                state.deepDives[key] = { isLoading: true, response: null, error: null };
            })
            .addCase(startDeepDiveGeneration.fulfilled, (state, action) => {
                const { key, guide } = action.payload;
                state.deepDives[key].isLoading = false;
                state.deepDives[key].response = guide;
            })
            .addCase(startDeepDiveGeneration.rejected, (state, action) => {
                const { plant, topic } = action.meta.arg;
                const key = `${plant.id}-${topic}`;
                state.deepDives[key].isLoading = false;
                state.deepDives[key].error = i18nInstance.t(action.error.message || 'ai.error.unknown');
            });
    },
});

export const { resetEquipmentGenerationState, resetDiagnosticsState, clearMentorChat } = aiSlice.actions;
export default aiSlice.reducer;