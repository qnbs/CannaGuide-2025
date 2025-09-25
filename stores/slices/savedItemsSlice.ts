import { SavedExport, SavedSetup } from '@/types';
import type { StoreSet } from '@/stores/useAppStore';

export interface SavedItemsSlice {
    savedExports: SavedExport[];
    savedSetups: SavedSetup[];
    addExport: (newExport: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[]) => SavedExport;
    updateExport: (updatedExport: SavedExport) => void;
    deleteExport: (exportId: string) => void;
    addSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
}

export const createSavedItemsSlice = (set: StoreSet): SavedItemsSlice => ({
    savedExports: [],
    savedSetups: [],
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
});