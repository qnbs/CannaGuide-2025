import { SavedExport, SavedSetup, Strain, AIResponse, SavedStrainTip } from '../../types';
import { createSlice, PayloadAction, createAsyncThunk, createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { addNotification } from './uiSlice';
import { getT } from '@/i18n';

// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
export const savedExportsAdapter = createEntityAdapter<SavedExport, string>();
// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
export const savedSetupsAdapter = createEntityAdapter<SavedSetup, string>();
// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
export const savedStrainTipsAdapter = createEntityAdapter<SavedStrainTip, string>();

export interface SavedItemsState {
// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
    savedExports: EntityState<SavedExport, string>;
// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
    savedSetups: EntityState<SavedSetup, string>;
// FIX: Generic type 'EntityState<T, Id>' requires 2 type argument(s). Added string as the ID type.
    savedStrainTips: EntityState<SavedStrainTip, string>;
}

const initialState: SavedItemsState = {
    savedExports: savedExportsAdapter.getInitialState(),
    savedSetups: savedSetupsAdapter.getInitialState(),
    savedStrainTips: savedStrainTipsAdapter.getInitialState(),
};

export const addSetup = createAsyncThunk<SavedSetup, Omit<SavedSetup, 'id' | 'createdAt'>>(
    'savedItems/addSetup',
    async (setupData, { rejectWithValue }) => {
        const newSetup: SavedSetup = {
            ...setupData,
            id: `setup-${Date.now()}`,
            createdAt: Date.now(),
        };

        try {
            return newSetup;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save setup';
            return rejectWithValue(message);
        }
    }
);


const savedItemsSlice = createSlice({
    name: 'savedItems',
    initialState,
    reducers: {
        // FIX: Correctly omit 'strainIds' from the 'data' object type, as it's passed separately.
        addExport: (state, action: PayloadAction<{ data: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[] }>) => {
            const { data, strainIds } = action.payload;
            if (!data.name?.trim() || !strainIds || strainIds.length === 0) {
                console.error('[savedItemsSlice] Attempted to add an empty or invalid export. Aborted.');
                return;
            }
            const newExport: SavedExport = {
                ...data,
                id: `export-${Date.now()}`,
                createdAt: Date.now(),
                count: strainIds.length,
                strainIds,
            };
            savedExportsAdapter.addOne(state.savedExports, newExport);
        },
        updateExport: (state, action: PayloadAction<SavedExport>) => {
            savedExportsAdapter.updateOne(state.savedExports, { id: action.payload.id, changes: action.payload });
        },
        deleteExport: (state, action: PayloadAction<string>) => {
            savedExportsAdapter.removeOne(state.savedExports, action.payload);
        },
        updateSetup: (state, action: PayloadAction<SavedSetup>) => {
            savedSetupsAdapter.updateOne(state.savedSetups, { id: action.payload.id, changes: action.payload });
        },
        deleteSetup: (state, action: PayloadAction<string>) => {
            savedSetupsAdapter.removeOne(state.savedSetups, action.payload);
        },
        addStrainTip: (state, action: PayloadAction<{ strain: Strain, tip: AIResponse, imageUrl?: string }>) => {
            const { strain, tip, imageUrl } = action.payload;
            if (!tip || !tip.title?.trim() || !tip.content?.trim()) {
                console.error("[savedItemsSlice] Attempted to save an empty or invalid strain tip. Aborted.");
                return;
            }
            const newTip: SavedStrainTip = {
                ...tip,
                id: `tip-${strain.id}-${Date.now()}`,
                createdAt: Date.now(),
                strainId: strain.id,
                strainName: strain.name,
                imageUrl,
            };
            savedStrainTipsAdapter.addOne(state.savedStrainTips, newTip);
        },
        updateStrainTip: (state, action: PayloadAction<SavedStrainTip>) => {
            savedStrainTipsAdapter.updateOne(state.savedStrainTips, { id: action.payload.id, changes: action.payload });
        },
        deleteStrainTip: (state, action: PayloadAction<string>) => {
            savedStrainTipsAdapter.removeOne(state.savedStrainTips, action.payload);
        },
        // For migration
        setSavedExports: (state, action: PayloadAction<SavedExport[]>) => {
            savedExportsAdapter.setAll(state.savedExports, action.payload);
        },
        setSavedSetups: (state, action: PayloadAction<SavedSetup[]>) => {
            savedSetupsAdapter.setAll(state.savedSetups, action.payload);
        },
        setSavedStrainTips: (state, action: PayloadAction<SavedStrainTip[]>) => {
            savedStrainTipsAdapter.setAll(state.savedStrainTips, action.payload);
        },
    },
    extraReducers: (builder) => {
        builder.addCase(addSetup.fulfilled, (state, action) => {
            savedSetupsAdapter.addOne(state.savedSetups, action.payload);
        });
    }
});

export const {
    addExport,
    updateExport,
    deleteExport,
    updateSetup,
    deleteSetup,
    addStrainTip,
    updateStrainTip,
    deleteStrainTip,
    setSavedExports,
    setSavedSetups,
    setSavedStrainTips,
} = savedItemsSlice.actions;

export default savedItemsSlice.reducer;