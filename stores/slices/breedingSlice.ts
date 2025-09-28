import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Seed, Strain, Plant } from '@/types';
import { strainService } from '@/services/strainService';
import { getT } from '@/i18n';
import { addUserStrain } from './userStrainsSlice';
import { addNotification } from './uiSlice';
import { AppDispatch, RootState } from '../store';

interface BreedingState {
    collectedSeeds: Seed[];
}

const initialState: BreedingState = {
    collectedSeeds: [],
};

const breedingSlice = createSlice({
    name: 'breeding',
    initialState,
    reducers: {
        addCollectedSeed: (state, action: PayloadAction<Plant>) => {
            const plant = action.payload;
            if (plant.postHarvest && plant.postHarvest.finalQuality > 90) {
                const newSeed: Seed = {
                    id: `seed-${plant.id}-${Date.now()}`,
                    name: `${plant.name} Seed`,
                    strainId: plant.strain.id,
                    genetics: plant.strain.genetics || `${plant.strain.name} Landrace`,
                    quality: plant.postHarvest.finalQuality,
                    createdAt: Date.now(),
                };
                state.collectedSeeds.push(newSeed);
                // Notification must be dispatched from component
            }
        },
        _addBredStrain: (state, action: PayloadAction<Strain>) => {
            // This is an internal helper, actual strain add is in userStrainsSlice
        }
    },
});

export const { addCollectedSeed, _addBredStrain } = breedingSlice.actions;

export const breedStrains = (payload: { parentAId: string, parentBId: string, newName: string }) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { parentAId, parentBId, newName } = payload;
    const state = getState();
    const { collectedSeeds } = state.breeding;
    
    const parentASeed = collectedSeeds.find(s => s.id === parentAId);
    const parentBSeed = collectedSeeds.find(s => s.id === parentBId);
    if (!parentASeed || !parentBSeed) return;

    const parentAStrain = await strainService.getStrainById(parentASeed.strainId);
    const parentBStrain = await strainService.getStrainById(parentBSeed.strainId);

    if (!parentAStrain || !parentBStrain) return;

    const childStrain: Strain = {
        id: `${newName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        name: newName,
        type: Math.random() > 0.5 ? parentAStrain.type : parentBStrain.type,
        floweringType: Math.random() > 0.5 ? parentAStrain.floweringType : parentBStrain.floweringType,
        thc: parseFloat(((parentAStrain.thc + parentBStrain.thc) / 2 + (Math.random() - 0.5) * 2).toFixed(1)),
        cbd: parseFloat(Math.max(0, (parentAStrain.cbd + parentBStrain.cbd) / 2 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        floweringTime: parseFloat(((parentAStrain.floweringTime + parentBStrain.floweringTime) / 2 + (Math.random() - 0.5)).toFixed(1)),
        genetics: `${parentAStrain.name} x ${parentBStrain.name}`,
        agronomic: {
            difficulty: Math.random() > 0.66 ? 'Hard' : Math.random() > 0.33 ? 'Medium' : 'Easy',
            yield: Math.random() > 0.66 ? 'High' : Math.random() > 0.33 ? 'Medium' : 'Low',
            height: Math.random() > 0.66 ? 'Tall' : Math.random() > 0.33 ? 'Medium' : 'Short',
        },
        aromas: [...new Set([...(parentAStrain.aromas || []).slice(0, 2), ...(parentBStrain.aromas || []).slice(0, 2)])],
        dominantTerpenes: [...new Set([...(parentAStrain.dominantTerpenes || []).slice(0, 1), ...(parentBStrain.dominantTerpenes || []).slice(0, 1)])],
        description: `A unique hybrid of ${parentAStrain.name} and ${parentBStrain.name}.`,
    };

    dispatch(addUserStrain(childStrain));
    dispatch(addNotification({ message: getT()('knowledgeView.breeding.breedSuccess', { name: newName }), type: 'success' }));
};

export default breedingSlice.reducer;
