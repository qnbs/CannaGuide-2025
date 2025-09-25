import { ArchivedMentorResponse, AIResponse, SavedStrainTip, ArchivedAdvisorResponse, Strain } from '@/types';
import type { StoreSet, StoreGet } from '@/stores/useAppStore';

export interface ArchivesSlice {
    archivedMentorResponses: ArchivedMentorResponse[];
    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>;
    savedStrainTips: SavedStrainTip[];
    addArchivedMentorResponse: (response: Omit<ArchivedMentorResponse, 'id' | 'createdAt'>) => void;
    updateArchivedMentorResponse: (updatedResponse: ArchivedMentorResponse) => void;
    deleteArchivedMentorResponse: (responseId: string) => void;
    addArchivedAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateArchivedAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteArchivedAdvisorResponse: (plantId: string, responseId: string) => void;
    addStrainTip: (strain: Strain, tip: AIResponse) => void;
    updateStrainTip: (updatedTip: SavedStrainTip) => void;
    deleteStrainTip: (tipId: string) => void;
}

export const createArchivesSlice = (set: StoreSet, get: StoreGet): ArchivesSlice => ({
    archivedMentorResponses: [],
    archivedAdvisorResponses: {},
    savedStrainTips: [],
    addArchivedMentorResponse: (response) => {
        const newResponse: ArchivedMentorResponse = { ...response, id: `mentor-${Date.now()}`, createdAt: Date.now() };
        set(state => { state.archivedMentorResponses.push(newResponse) });
    },
    updateArchivedMentorResponse: (updatedResponse) => set(state => {
        const index = state.archivedMentorResponses.findIndex(r => r.id === updatedResponse.id);
        if (index !== -1) state.archivedMentorResponses[index] = updatedResponse;
    }),
    deleteArchivedMentorResponse: (responseId) => set(state => ({ archivedMentorResponses: state.archivedMentorResponses.filter(r => r.id !== responseId) })),
    addArchivedAdvisorResponse: (plantId, response, query) => {
        const plant = get().plants[plantId];
        if (!plant) return;
        const newResponse: ArchivedAdvisorResponse = { ...response, id: `advisor-${plantId}-${Date.now()}`, createdAt: Date.now(), plantId, plantStage: plant.stage, query };
        set(state => {
            if (!state.archivedAdvisorResponses[plantId]) state.archivedAdvisorResponses[plantId] = [];
            state.archivedAdvisorResponses[plantId].push(newResponse);
        });
    },
    updateArchivedAdvisorResponse: (updatedResponse) => set(state => {
        const { plantId } = updatedResponse;
        const archive = state.archivedAdvisorResponses[plantId];
        if (!archive) return;
        const index = archive.findIndex(r => r.id === updatedResponse.id);
        if (index !== -1) archive[index] = updatedResponse;
    }),
    deleteArchivedAdvisorResponse: (plantId, responseId) => set(state => {
        const archive = state.archivedAdvisorResponses[plantId];
        if (archive) state.archivedAdvisorResponses[plantId] = archive.filter(r => r.id !== responseId);
    }),
    addStrainTip: (strain, tip) => {
        const newTip: SavedStrainTip = { ...tip, id: `tip-${strain.id}-${Date.now()}`, createdAt: Date.now(), strainId: strain.id, strainName: strain.name };
        set(state => { state.savedStrainTips.push(newTip) });
    },
    updateStrainTip: (updatedTip) => set(state => {
        const index = state.savedStrainTips.findIndex(t => t.id === updatedTip.id);
        if (index !== -1) state.savedStrainTips[index] = updatedTip;
    }),
    deleteStrainTip: (tipId) => set(state => ({ savedStrainTips: state.savedStrainTips.filter(t => t.id !== tipId) })),
});