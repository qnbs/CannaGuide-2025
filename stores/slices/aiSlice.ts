import { AIResponse, Recommendation, StructuredGrowTips, Plant, Strain } from '@/types';
import { geminiService } from '@/services/geminiService';
import type { AppState, StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';

type Area = '60x60' | '80x80' | '100x100' | '120x60' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'balanced' | 'yield';

interface EquipmentGenerationState {
    isLoading: boolean;
    recommendation: Recommendation | null;
    error: string | null;
    sourceDetails: { area: Area; budget: Budget; growStyle: GrowStyle; } | null;
}

interface MentorState {
    isLoading: boolean;
    response: AIResponse | null;
    error: string | null;
    lastQuery: string | null;
}

interface AdvisorState {
    isLoading: boolean;
    response: AIResponse | null;
    error: string | null;
}

interface StrainTipState {
    isLoading: boolean;
    tip: StructuredGrowTips | null;
    error: string | null;
}

export interface AiSlice {
    equipmentGenerationState: EquipmentGenerationState;
    mentorState: MentorState;
    advisorState: Record<string, AdvisorState>;
    strainTipState: Record<string, StrainTipState>;

    startEquipmentGeneration: (promptDetails: string, sourceDetails: { area: Area; budget: Budget; growStyle: GrowStyle; }) => Promise<void>;
    resetEquipmentGenerationState: () => void;
    
    startMentorGeneration: (query: string) => Promise<void>;
    
    startAdvisorGeneration: (plant: Plant) => Promise<void>;
    
    startStrainTipGeneration: (strain: Strain, context: { focus: string; stage: string; experience: string }) => Promise<void>;
}

export const createAiSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): AiSlice => ({
    equipmentGenerationState: { isLoading: false, recommendation: null, error: null, sourceDetails: null },
    mentorState: { isLoading: false, response: null, error: null, lastQuery: null },
    advisorState: {},
    strainTipState: {},

    startEquipmentGeneration: async (promptDetails, sourceDetails) => {
        set(state => {
            state.equipmentGenerationState = { isLoading: true, recommendation: null, error: null, sourceDetails };
        });
        try {
            const result = await geminiService.getEquipmentRecommendation(promptDetails, t());
            set(state => {
                state.equipmentGenerationState.recommendation = result;
            });
        } catch (err) {
            const errorMessageKey = err instanceof Error ? err.message : 'ai.error.unknown';
            const errorMessage = t()(errorMessageKey) === errorMessageKey ? t()('ai.error.unknown') : t()(errorMessageKey);
            set(state => {
                state.equipmentGenerationState.error = errorMessage;
            });
        } finally {
            set(state => {
                state.equipmentGenerationState.isLoading = false;
            });
        }
    },
    resetEquipmentGenerationState: () => set(state => {
        state.equipmentGenerationState = { isLoading: false, recommendation: null, error: null, sourceDetails: null };
    }),
    
    startMentorGeneration: async (query) => {
        set(state => {
            state.mentorState = { isLoading: true, response: null, error: null, lastQuery: query };
        });
        try {
            const res = await geminiService.getAiMentorResponse(query, t());
            set(state => {
                state.mentorState.response = res;
            });
        } catch (e) {
            const errorMessageKey = e instanceof Error ? e.message : 'ai.error.unknown';
            const errorMessage = t()(errorMessageKey) === errorMessageKey ? t()('ai.error.unknown') : t()(errorMessageKey);
            set(state => {
                state.mentorState.error = errorMessage;
                state.mentorState.response = { title: t()('common.error'), content: errorMessage };
            });
        } finally {
            set(state => {
                state.mentorState.isLoading = false;
            });
        }
    },
    
    startAdvisorGeneration: async (plant) => {
        set(state => {
            state.advisorState[plant.id] = { isLoading: true, response: null, error: null };
        });
        try {
            const res = await geminiService.getAiPlantAdvisorResponse(plant, t());
            set(state => {
                state.advisorState[plant.id].response = res;
            });
        } catch (error) {
            const errorMessageKey = error instanceof Error ? error.message : 'ai.error.unknown';
            const errorMessage = t()(errorMessageKey) === errorMessageKey ? t()('ai.error.unknown') : t()(errorMessageKey);
            set(state => {
                state.advisorState[plant.id].error = errorMessage;
                state.advisorState[plant.id].response = { title: t()('common.error'), content: errorMessage };
            });
        } finally {
            set(state => {
                state.advisorState[plant.id].isLoading = false;
            });
        }
    },
    
    startStrainTipGeneration: async (strain, context) => {
        set(state => {
            state.strainTipState[strain.id] = { isLoading: true, tip: null, error: null };
        });
        try {
            const result = await geminiService.getStrainGrowTips(strain, context, t());
            set(state => {
                state.strainTipState[strain.id].tip = result;
            });
        } catch (err) {
            const errorMessageKey = err instanceof Error ? err.message : 'ai.error.unknown';
            const errorMessage = t()(errorMessageKey) === errorMessageKey ? t()('ai.error.unknown') : t()(errorMessageKey);
            set(state => {
                state.strainTipState[strain.id].error = errorMessage;
            });
        } finally {
            set(state => {
                state.strainTipState[strain.id].isLoading = false;
            });
        }
    },
});