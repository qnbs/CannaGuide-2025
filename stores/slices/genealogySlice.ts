import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GenealogyNode, Strain } from '@/types';
import { geneticsService } from '@/services/geneticsService';
import type { RootState } from '../store';

export interface GenealogyState {
    computedTrees: { [strainId: string]: GenealogyNode | null };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    selectedStrainId: string | null;
    collapsedNodeIds: string[];
    zoomTransform: { k: number; x: number; y: number } | null;
    layoutOrientation: 'horizontal' | 'vertical';
}

const initialState: GenealogyState = {
    computedTrees: {},
    status: 'idle',
    selectedStrainId: 'gorilla-glue-4',
    collapsedNodeIds: [],
    zoomTransform: null,
    layoutOrientation: 'horizontal',
};

export const fetchAndBuildGenealogy = createAsyncThunk<
    { strainId: string, tree: GenealogyNode | null },
    string,
    { state: RootState }
>('genealogy/fetchAndBuild', async (strainId, { getState }) => {
    const { genealogy } = getState();
    if (genealogy.computedTrees[strainId]) {
        return { strainId, tree: genealogy.computedTrees[strainId] };
    }
    const { allStrainsData } = await import('@/data/strains');
    const tree = geneticsService.buildGenealogyTree(strainId, allStrainsData);
    return { strainId, tree };
});

const genealogySlice = createSlice({
    name: 'genealogy',
    initialState,
    reducers: {
        setGenealogyState: (state, action: PayloadAction<GenealogyState>) => {
            return action.payload;
        },
        setSelectedGenealogyStrain: (state, action: PayloadAction<string | null>) => {
            if (state.selectedStrainId !== action.payload) {
                state.selectedStrainId = action.payload;
                state.collapsedNodeIds = [];
                state.zoomTransform = null;
            }
        },
        toggleGenealogyNode: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            const index = state.collapsedNodeIds.indexOf(id);
            if (index > -1) {
                // If it was collapsed (in the list), un-collapse it by removing it.
                state.collapsedNodeIds.splice(index, 1);
            } else {
                // If it was expanded, collapse it by adding it.
                state.collapsedNodeIds.push(id);
            }
        },
        setGenealogyZoom: (state, action: PayloadAction<{ k: number; x: number; y: number }>) => {
            state.zoomTransform = action.payload;
        },
        setGenealogyLayout: (state, action: PayloadAction<'horizontal' | 'vertical'>) => {
            state.layoutOrientation = action.payload;
            state.zoomTransform = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAndBuildGenealogy.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAndBuildGenealogy.fulfilled, (state, action) => {
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

export const { 
    setGenealogyState,
    setSelectedGenealogyStrain, 
    toggleGenealogyNode, 
    setGenealogyZoom, 
    setGenealogyLayout,
} = genealogySlice.actions;

export default genealogySlice.reducer;