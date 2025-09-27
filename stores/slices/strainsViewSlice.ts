import { StrainViewTab } from '@/types';
import type { StoreSet, StoreGet } from '@/stores/useAppStore';

export interface StrainsViewSlice {
    strainsViewTab: StrainViewTab;
    strainsViewMode: 'list' | 'grid';
    selectedStrainIds: Set<string>;
    setStrainsViewTab: (tab: StrainViewTab) => void;
    setStrainsViewMode: (mode: 'list' | 'grid') => void;
    toggleStrainSelection: (id: string) => void;
    toggleAllStrainSelection: (ids: string[], areAllCurrentlySelected: boolean) => void;
    clearStrainSelection: () => void;
}

export const createStrainsViewSlice = (set: StoreSet, get: StoreGet): StrainsViewSlice => ({
    strainsViewTab: 'all',
    strainsViewMode: 'list',
    selectedStrainIds: new Set(),
    
    setStrainsViewTab: (tab) => set(state => { state.strainsViewTab = tab; }),
    
    setStrainsViewMode: (mode) => set(state => { state.strainsViewMode = mode; }),

    toggleStrainSelection: (id) => set(state => {
        const newSet = new Set(state.selectedStrainIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        state.selectedStrainIds = newSet;
    }),

    toggleAllStrainSelection: (ids, areAllCurrentlySelected) => set(state => {
        if (areAllCurrentlySelected) {
            state.selectedStrainIds = new Set();
        } else {
            state.selectedStrainIds = new Set(ids);
        }
    }),

    clearStrainSelection: () => set(state => { state.selectedStrainIds = new Set(); }),
});