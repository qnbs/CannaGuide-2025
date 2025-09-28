import { AIResponse, Plant, Recommendation, PlantDiagnosisResponse, MentorMessage, Strain, StructuredGrowTips, DeepDiveGuide } from '../../types';
import { geminiService } from '../../services/geminiService';
import { i18nInstance } from '../../i18n';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

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
export const startEquipmentGeneration = createAsyncThunk(
    'ai/startEquipmentGeneration',
    async ({ prompt, details }: { prompt: string, details: any }) => {
        const recommendation = await geminiService.getEquipmentRecommendation(prompt);
        return { recommendation, details };
    }
);

export const startDiagnostics = createAsyncThunk(
    'ai/startDiagnostics',
    async ({ base64Image, mimeType, context }: { base64Image: string, mimeType: string, context: any }) => {
        return await geminiService.diagnosePlant(base64Image, mimeType, context);
    }
);

export const startAdvisorGeneration = createAsyncThunk(
    'ai/startAdvisorGeneration',
    async (plant: Plant) => {
        const advice = await geminiService.getPlantAdvice(plant);
        return { plantId: plant.id, advice };
    }
);

export const startProactiveDiagnosis = createAsyncThunk(
    'ai/startProactiveDiagnosis',
    async (plant: Plant) => {
        return await geminiService.getProactiveDiagnosis(plant);
    }
);

export const startPlantMentorChat = createAsyncThunk(
    'ai/startPlantMentorChat',
    async ({ plant, query }: { plant: Plant, query: string }) => {
        const response = await geminiService.getMentorResponse(plant, query);
        return { plantId: plant.id, response };
    }
);

export const startStrainTipGeneration = createAsyncThunk(
    'ai/startStrainTipGeneration',
    async ({ strain, context }: { strain: Strain, context: { focus: string, stage: string, experience: string } }) => {
        const tips = await geminiService.getStrainTips(strain, context);
        return { strainId: strain.id, tips };
    }
);

export const startDeepDiveGeneration = createAsyncThunk(
    'ai/startDeepDiveGeneration',
    async ({ topic, plant }: { topic: string, plant: Plant }) => {
        const guide = await geminiService.generateDeepDive(topic, plant);
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

export const { resetEquipmentGenerationState, clearMentorChat } = aiSlice.actions;
export default aiSlice.reducer;
