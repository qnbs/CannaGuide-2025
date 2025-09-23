import type { StoreSet, StoreGet } from '@/stores/useAppStore';

export interface UserSlice {
    favoriteIds: Set<string>;
    strainNotes: Record<string, string>;
    isUserStrain: (strainId: string) => boolean;
    toggleFavorite: (strainId: string) => void;
    updateNoteForStrain: (strainId: string, content: string) => void;
}

export const createUserSlice = (set: StoreSet, get: StoreGet): UserSlice => ({
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
    })
});
