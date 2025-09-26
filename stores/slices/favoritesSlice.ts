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
        const newFavoriteIds = new Set(state.favoriteIds);
        if (newFavoriteIds.has(strainId)) {
            newFavoriteIds.delete(strainId);
        } else {
            newFavoriteIds.add(strainId);
        }
        state.favoriteIds = newFavoriteIds;
    }),
    addMultipleToFavorites: (ids) => set(state => {
        const newSet = new Set(state.favoriteIds);
        ids.forEach(id => newSet.add(id));
        state.favoriteIds = newSet;
    }),
    removeMultipleFromFavorites: (ids) => set(state => {
        const newSet = new Set(state.favoriteIds);
        ids.forEach(id => newSet.delete(id));
        state.favoriteIds = newSet;
    }),
});