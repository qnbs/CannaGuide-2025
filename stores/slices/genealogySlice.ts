import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GenealogyNode, Strain } from '@/types';
import { geneticsService } from '@/services/geneticsService';
import type { RootState } from '../store';

export interface GenealogyState {
    computedTrees: { [strainId: string]: GenealogyNode | null };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: GenealogyState = {
    computedTrees: {},
    status: 'idle',
};

export const fetchAndBuildGenealogy = createAsyncThunk<
    { strainId: string, tree: GenealogyNode | null },
    string,
    { state: RootState }
>('genealogy/fetchAndBuild', async (strainId, { getState }) => {
    const { genealogy } = getState();

    // Return cached tree if it exists
    if (genealogy.computedTrees[strainId]) {
        return { strainId, tree: genealogy.computedTrees[strainId] };
    }
    
    // Dynamically import strain data to avoid circular dependencies at startup
    const { allStrainsData } = await import('@/data/strains');
    
    const tree = geneticsService.buildGenealogyTree(strainId, allStrainsData);
    return { strainId, tree };
});

const genealogySlice = createSlice({
    name: 'genealogy',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAndBuildGenealogy.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAndBuildGenealogy.fulfilled, (state, action: PayloadAction<{ strainId: string, tree: GenealogyNode | null }>) => {
                state.status = 'succeeded';
                if (action.payload) {
                    state.computedTrees[action.payload.strainId] = action.payload.tree;
                }
            })
            .addCase(fetchAndBuildGenealogy.rejected, (state) => {
                state.status = 'failed';
            });
    },
});

export default genealogySlice.reducer;