import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GenealogyNode } from '@/types';
import { RootState } from '../store';
import { strainService } from '@/services/strainService';
import { geneticsService } from '@/services/geneticsService';

export interface GenealogyState {
    computedTrees: Record<string, GenealogyNode>;
    isLoading: boolean;
    error: string | null;
}

const initialState: GenealogyState = {
    computedTrees: {},
    isLoading: false,
    error: null,
};

export const fetchAndBuildGenealogy = createAsyncThunk<
    { strainId: string; tree: GenealogyNode | null }, // Return type of the payload creator
    string, // First argument to the payload creator (strainId)
    { state: RootState; rejectValue: string } // ThunkApiConfig
>(
    'genealogy/fetchAndBuild',
    async (strainId, { getState, rejectWithValue }) => {
        try {
            // Ensure strains are loaded before trying to build the tree.
            const allStrains = await strainService.getAllStrains();
            if (allStrains.length === 0) {
                 throw new Error("Strain database not initialized.");
            }
            const tree = geneticsService.buildGenealogyTree(strainId, allStrains);
            return { strainId, tree };
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    },
    {
        // Prevent fetching if already cached or another fetch is in progress
        condition: (strainId, { getState }) => {
            const { genealogy } = getState();
            if (genealogy.computedTrees[strainId] || genealogy.isLoading) {
                return false;
            }
            return true;
        }
    }
);


const genealogySlice = createSlice({
    name: 'genealogy',
    initialState,
    reducers: {
        setGenealogyState: (state, action: PayloadAction<GenealogyState>) => {
            state.computedTrees = action.payload.computedTrees || {};
            state.isLoading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAndBuildGenealogy.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAndBuildGenealogy.fulfilled, (state, action) => {
                state.isLoading = false;
                if (action.payload.tree) {
                    state.computedTrees[action.payload.strainId] = action.payload.tree;
                }
            })
            .addCase(fetchAndBuildGenealogy.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Failed to build genealogy tree.';
            });
    },
});

export const { setGenealogyState } = genealogySlice.actions;
export default genealogySlice.reducer;