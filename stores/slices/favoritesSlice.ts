import type { StoreSet } from '@/stores/useAppStore';

export interface FavoritesSlice {
    favoriteIds: Set<string>;
    toggleFavorite: (strainId: string) => void;
    addMultipleToFavorites: (ids: string[]) => void;
    removeMultipleFromFavorites: (ids: string[]) => void;
}

export const createFavoritesSlice = (set: StoreSet): FavoritesSlice => ({
    favoriteIds: new Set(),
    toggleFavorite: (strainId) => set(state => {
        const newSet = new Set(state.favoriteIds);
        if (newSet.has(strainId)) {
            newSet.delete(strainId);
        } else {
            newSet.add(strainId);
        }
        state.favoriteIds = newSet;
    }),
    addMultipleToFavorites: (ids) => set(state => {
        ids.forEach(id => state.favoriteIds.add(id));
    }),
    removeMultipleFromFavorites: (ids) => set(state => {
        ids.forEach(id => state.favoriteIds.delete(id));
    }),
});