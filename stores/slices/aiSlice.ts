import { AIResponse, Plant, Recommendation, PlantDiagnosisResponse, MentorMessage, Strain, StructuredGrowTips, DeepDiveGuide } from '@/types';
import { StoreSet, StoreGet } from '../useAppStore';
import { geminiService } from '@/services/geminiService';
import { i18nInstance } from '@/i18n';

export interface AiState<T> {
    isLoading: boolean;
    response: T | null;
    error: string | null;
    sourceDetails?: any;
}

export interface AiSlice {
    equipmentGeneration: AiState<Recommendation>;
    diagnostics: AiState<PlantDiagnosisResponse>;
    advisorChats: Record<string, AiState<AIResponse>>;
    mentorChats: Record<string, { history: MentorMessage[], isLoading: boolean, error: string | null }>;
    strainTips: Record<string, AiState<StructuredGrowTips>>;
    deepDives: Record<string, AiState<DeepDiveGuide>>;

    startEquipmentGeneration: (prompt: string, details: any) => Promise<void>;
    resetEquipmentGenerationState: () => void;
    
    startDiagnostics: (base64Image: string, mimeType: string, context: any) => Promise<void>;
    
    startAdvisorGeneration: (plant: Plant) => Promise<void>;
    
    startPlantMentorChat: (plant: Plant, query: string) => Promise<void>;
    clearMentorChat: (plantId: string) => void;

    startStrainTipGeneration: (strain: Strain, context: { focus: string, stage: string, experience: string }) => Promise<void>;
    
    startDeepDiveGeneration: (topic: string, plant: Plant) => Promise<void>;
}

export const createAiSlice = (set: StoreSet, get: StoreGet): AiSlice => ({
    equipmentGeneration: { isLoading: false, response: null, error: null },
    diagnostics: { isLoading: false, response: null, error: null },
    advisorChats: {},
    mentorChats: {},
    strainTips: {},
    deepDives: {},

    startEquipmentGeneration: async (prompt, details) => {
        set(state => {
            state.equipmentGeneration = { isLoading: true, response: null, error: null, sourceDetails: details };
        });
        try {
            const recommendation = await geminiService.getEquipmentRecommendation(prompt, i18nInstance.t);
            set(state => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.response = recommendation;
            });
        } catch (e: any) {
            set(state => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
    resetEquipmentGenerationState: () => {
        set(state => {
            state.equipmentGeneration = { isLoading: false, response: null, error: null };
        });
    },

    startDiagnostics: async (base64Image, mimeType, context) => {
        set(state => {
            state.diagnostics = { isLoading: true, response: null, error: null };
        });
        try {
            const diagnosis = await geminiService.diagnosePlant(base64Image, mimeType, context, i18nInstance.t);
            set(state => {
                state.diagnostics.isLoading = false;
                state.diagnostics.response = diagnosis;
            });
        } catch (e: any) {
            set(state => {
                state.diagnostics.isLoading = false;
                state.diagnostics.error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
    
    startAdvisorGeneration: async (plant) => {
        set(state => {
            state.advisorChats[plant.id] = { isLoading: true, response: null, error: null };
        });
        try {
            const advice = await geminiService.getPlantAdvice(plant, i18nInstance.t);
            set(state => {
                state.advisorChats[plant.id].isLoading = false;
                state.advisorChats[plant.id].response = advice;
            });
        } catch (e: any) {
            set(state => {
                state.advisorChats[plant.id].isLoading = false;
                state.advisorChats[plant.id].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },

    startPlantMentorChat: async (plant, query) => {
        set(state => {
            if (!state.mentorChats[plant.id]) {
                state.mentorChats[plant.id] = { history: [], isLoading: false, error: null };
            }
            state.mentorChats[plant.id].history.push({ role: 'user', content: query });
            state.mentorChats[plant.id].isLoading = true;
            state.mentorChats[plant.id].error = null;
        });
        try {
            const response = await geminiService.getMentorResponse(plant, query, i18nInstance.t);
            set(state => {
                state.mentorChats[plant.id].history.push({ role: 'model', ...response });
                state.mentorChats[plant.id].isLoading = false;
            });
        } catch (e: any) {
             set(state => {
                const errorMessage = i18nInstance.t(e.message || 'ai.error.unknown');
                state.mentorChats[plant.id].history.push({ role: 'model', title: i18nInstance.t('common.error'), content: errorMessage });
                state.mentorChats[plant.id].isLoading = false;
                state.mentorChats[plant.id].error = errorMessage;
            });
        }
    },
    clearMentorChat: (plantId) => {
        set(state => {
            if (state.mentorChats[plantId]) {
                state.mentorChats[plantId].history = [];
            }
        });
    },
    
    startStrainTipGeneration: async (strain, context) => {
        set(state => {
            state.strainTips[strain.id] = { isLoading: true, response: null, error: null };
        });
        try {
            const tips = await geminiService.getStrainTips(strain, context, i18nInstance.t);
            set(state => {
                state.strainTips[strain.id].isLoading = false;
                state.strainTips[strain.id].response = tips;
            });
        } catch (e: any) {
            set(state => {
                state.strainTips[strain.id].isLoading = false;
                state.strainTips[strain.id].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },

    startDeepDiveGeneration: async (topic, plant) => {
        const key = `${plant.id}-${topic}`;
        set(state => {
            state.deepDives[key] = { isLoading: true, response: null, error: null };
        });
        try {
            const guide = await geminiService.generateDeepDive(topic, plant, i18nInstance.t);
            set(state => {
                state.deepDives[key].isLoading = false;
                state.deepDives[key].response = guide;
            });
        } catch (e: any) {
            set(state => {
                state.deepDives[key].isLoading = false;
                state.deepDives[key].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
});
