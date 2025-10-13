import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GenealogyNode, Strain } from '@/types';
import { geneticsService } from '@/services/geneticsService';
import type { RootState } from '../store';

// Define a plain object for serializable transform state
interface SerializableZoomTransform {
    k: number;
    x: number;
    y: number;
}

export interface GenealogyState {
    computedTrees: { [strainId: string]: GenealogyNode | null };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    selectedStrainId: string | null;
    zoomTransform: SerializableZoomTransform | null;
    layoutOrientation: 'horizontal' | 'vertical';
}

const initialState: GenealogyState = {
    computedTrees: {},
    status: 'idle',
    selectedStrainId: null, // Start with no strain selected
    zoomTransform: null,
    layoutOrientation: 'horizontal',
};

export const fetchAndBuildGenealogy = createAsyncThunk<
    { strainId: string; tree: GenealogyNode | null },
    { strainId: string; allStrains: Strain[] },
    { state: RootState }
>('genealogy/fetchAndBuild', async ({ strainId, allStrains }, { getState }) => {
    const { genealogy } = getState();
    // Check cache first
    if (genealogy.computedTrees[strainId]) {
        return { strainId, tree: genealogy.computedTrees[strainId] };
    }
    const tree = geneticsService.buildGenealogyTree(strainId, allStrains);
    return { strainId, tree };
});

// Helper function to find and toggle a node in the tree
const findAndToggleNode = (node: GenealogyNode, nodeId: string): boolean => {
    if (node.id === nodeId) {
        if (node.children) {
            node._children = node.children;
            delete node.children;
        } else if (node._children) {
            node.children = node._children;
            delete node._children;
        }
        return true;
    }
    const children = node.children || node._children;
    if (children) {
        for (const child of children) {
            if (findAndToggleNode(child, nodeId)) return true;
        }
    }
    return false;
};


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
                state.zoomTransform = null; // Signal to recenter view
            }
        },
        setGenealogyZoom: (state, action: PayloadAction<SerializableZoomTransform>) => {
            state.zoomTransform = action.payload;
        },
        resetGenealogyZoom: (state) => {
            state.zoomTransform = null; // Signal to recenter view
        },
        setGenealogyLayout: (state, action: PayloadAction<'horizontal' | 'vertical'>) => {
            state.layoutOrientation = action.payload;
            state.zoomTransform = null; // Signal to recenter view
        },
        toggleGenealogyNode: (state, action: PayloadAction<{ strainId: string; nodeId: string }>) => {
            const { strainId, nodeId } = action.payload;
            const tree = state.computedTrees[strainId];
            if (tree) {
                findAndToggleNode(tree, nodeId);
            }
        },
        resetGenealogy: () => initialState,
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
    setGenealogyZoom,
    resetGenealogyZoom,
    setGenealogyLayout,
    toggleGenealogyNode,
    resetGenealogy,
} = genealogySlice.actions;

export default genealogySlice.reducer;