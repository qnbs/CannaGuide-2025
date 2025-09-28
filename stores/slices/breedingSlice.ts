import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BreedingState, Seed } from '@/types';

const initialState: BreedingState = {
    collectedSeeds: [],
    breedingSlots: {
        parentA: null,
        parentB: null,
    },
};

const breedingSlice = createSlice({
    name: 'breeding',
    initialState,
    reducers: {
        addSeed: (state, action: PayloadAction<Seed>) => {
            state.collectedSeeds.push(action.payload);
        },
        setParentA: (state, action: PayloadAction<string | null>) => {
            state.breedingSlots.parentA = action.payload;
        },
        setParentB: (state, action: PayloadAction<string | null>) => {
            state.breedingSlots.parentB = action.payload;
        },
        clearBreedingSlots: (state) => {
            state.breedingSlots.parentA = null;
            state.breedingSlots.parentB = null;
        },
        setCollectedSeeds: (state, action: PayloadAction<Seed[]>) => {
            state.collectedSeeds = action.payload;
        },
    },
});

export const { addSeed, setParentA, setParentB, clearBreedingSlots, setCollectedSeeds } = breedingSlice.actions;
export default breedingSlice.reducer;
