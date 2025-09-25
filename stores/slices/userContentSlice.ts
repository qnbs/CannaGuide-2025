import { Strain, SavedExport, SavedSetup, ArchivedMentorResponse, AIResponse, SavedStrainTip, ArchivedAdvisorResponse } from '@/types';
import type { StoreSet, StoreGet } from '@/stores/useAppStore';

export interface UserContentSlice {
    // From original userContentSlice
    userStrains: Strain[];
    savedExports: SavedExport[];
    savedSetups: SavedSetup[];
    archivedMentorResponses: ArchivedMentorResponse[];
    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>;
    savedStrainTips: SavedStrainTip[];
    
    // Merged from userSlice
    favoriteIds: Set<string>;
    strainNotes: Record<string, string>;
    isUserStrain: (strainId: string) => boolean;
    toggleFavorite: (strainId: string) => void;
    updateNoteForStrain: (strainId: string, content: string) => void;
    
    // Actions from original userContentSlice
    addUserStrain: (strain: Strain) => void;
    updateUserStrain: (strain: Strain) => void;
    deleteUserStrain: (strainId: string) => void;
    
    addExport: (newExport: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[]) => SavedExport;
    updateExport: (updatedExport: SavedExport) => void;
    deleteExport: (exportId: string) => void;
    
    addSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
    
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

export const createUserContentSlice = (set: StoreSet, get: StoreGet): UserContentSlice => ({
    userStrains: [],
    savedExports: [],
    savedSetups: [],
    archivedMentorResponses: [],
    archivedAdvisorResponses: {},
    savedStrainTips: [],
    favoriteIds: new Set(),
    strainNotes: {},
    
    isUserStrain: (strainId) => get().userStrains.some(s => s.id === strainId),
    
    toggleFavorite: (strainId) => set(state => {
        if (state.favoriteIds.has(strainId)) {
            state.favoriteIds.delete(strainId);
        } else {
            state.favoriteIds.add(strainId);
        }
    }),

    updateNoteForStrain: (strainId, content) => set(state => {
        state.strainNotes[strainId] = content;
    }),

    addUserStrain: (strain) => set(state => { state.userStrains.push(strain) }),
    updateUserStrain: (updatedStrain) => set(state => {
        const index = state.userStrains.findIndex(s => s.id === updatedStrain.id);
        if (index !== -1) state.userStrains[index] = updatedStrain;
    }),
    deleteUserStrain: (strainId) => set(state => ({ userStrains: state.userStrains.filter(s => s.id !== strainId) })),
    
    addExport: (newExport, strainIds) => {
        const savedExport: SavedExport = { ...newExport, id: `export-${Date.now()}`, createdAt: Date.now(), count: strainIds.length, strainIds };
        set(state => { state.savedExports.push(savedExport) });
        return savedExport;
    },
    updateExport: (updatedExport) => set(state => {
        const index = state.savedExports.findIndex(e => e.id === updatedExport.id);
        if (index !== -1) state.savedExports[index] = updatedExport;
    }),
    deleteExport: (exportId) => set(state => ({ savedExports: state.savedExports.filter(e => e.id !== exportId) })),
    
    addSetup: (setup) => {
        const newSetup: SavedSetup = { ...setup, id: `setup-${Date.now()}`, createdAt: Date.now() };
        set(state => { state.savedSetups.push(newSetup) });
    },
    updateSetup: (updatedSetup) => set(state => {
        const index = state.savedSetups.findIndex(s => s.id === updatedSetup.id);
        if (index !== -1) state.savedSetups[index] = updatedSetup;
    }),
    deleteSetup: (setupId) => set(state => ({ savedSetups: state.savedSetups.filter(s => s.id !== setupId) })),
    
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