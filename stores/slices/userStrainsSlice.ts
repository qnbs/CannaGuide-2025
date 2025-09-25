import { Strain } from '@/types';
import type { StoreSet, StoreGet } from '@/stores/useAppStore';

export interface UserStrainsSlice {
    userStrains: Strain[];
    isUserStrain: (strainId: string) => boolean;
    addUserStrain: (strain: Strain) => boolean; // returns success status
    updateUserStrain: (strain: Strain) => void;
    deleteUserStrain: (strainId: string) => void;
}

export const createUserStrainsSlice = (set: StoreSet, get: StoreGet): UserStrainsSlice => ({
    userStrains: [],
    isUserStrain: (strainId) => get().userStrains.some(s => s.id === strainId),
    addUserStrain: (strain) => {
        const isDuplicate = get().userStrains.some(s => s.name.toLowerCase() === strain.name.toLowerCase());
        if (isDuplicate) {
            return false; // Signal failure to the component
        }
        set(state => { state.userStrains.push(strain) });
        return true; // Signal success
    },
    updateUserStrain: (updatedStrain) => {
        set(state => {
            const index = state.userStrains.findIndex(s => s.id === updatedStrain.id);
            if (index !== -1) {
                state.userStrains[index] = updatedStrain;
            }
        });
    },
    deleteUserStrain: (strainId) => set(state => ({ userStrains: state.userStrains.filter(s => s.id !== strainId) })),
});