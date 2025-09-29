import { SavedExport, SavedSetup, Strain, AIResponse, SavedStrainTip } from '../../types';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { addNotification } from './uiSlice';
import { getT } from '@/i18n';

export interface SavedItemsState {
    savedExports: SavedExport[];
    savedSetups: SavedSetup[];
    savedStrainTips: SavedStrainTip[];
}

const initialState: SavedItemsState = {
    savedExports: [],
    savedSetups: [],
    savedStrainTips: [],
};

export const addSetup = createAsyncThunk<SavedSetup, Omit<SavedSetup, 'id' | 'createdAt'>>(
    'savedItems/addSetup',
    async (setupData, { dispatch, rejectWithValue }) => {
        const t = getT();
        const newSetup: SavedSetup = {
            ...setupData,
            id: `setup-${Date.now()}`,
            createdAt: Date.now(),
        };

        try {
            dispatch(savedItemsSlice.actions._addSetup(newSetup));
            dispatch(addNotification({ message: t('equipmentView.configurator.setupSaveSuccess', { name: newSetup.name }), type: 'success' }));
            return newSetup;
        } catch (error) {
            console.error("Failed to save setup:", error);
            dispatch(addNotification({ message: t('common.saveErrorPreview'), type: 'error' }));
            return rejectWithValue('Failed to save');
        }
    }
);


const savedItemsSlice = createSlice({
    name: 'savedItems',
    initialState,
    reducers: {
        addExport: (state, action: PayloadAction<{ data: Omit<SavedExport, 'id' | 'createdAt' | 'count'>, strainIds: string[] }>) => {
            const { data, strainIds } = action.payload;
            const newExport: SavedExport = {
                ...data,
                id: `export-${Date.now()}`,
                createdAt: Date.now(),
                count: strainIds.length,
                strainIds,
            };
            state.savedExports.push(newExport);
        },
        updateExport: (state, action: PayloadAction<SavedExport>) => {
            const index = state.savedExports.findIndex(e => e.id === action.payload.id);
            if (index !== -1) {
                state.savedExports[index] = action.payload;
            }
        },
        deleteExport: (state, action: PayloadAction<string>) => {
            state.savedExports = state.savedExports.filter(e => e.id !== action.payload);
        },
        _addSetup: (state, action: PayloadAction<SavedSetup>) => {
            state.savedSetups.push(action.payload);
        },
        updateSetup: (state, action: PayloadAction<SavedSetup>) => {
            const index = state.savedSetups.findIndex(s => s.id === action.payload.id);
            if (index !== -1) {
                state.savedSetups[index] = action.payload;
            }
        },
        deleteSetup: (state, action: PayloadAction<string>) => {
            state.savedSetups = state.savedSetups.filter(s => s.id !== action.payload);
        },
        addStrainTip: (state, action: PayloadAction<{ strain: Strain, tip: AIResponse }>) => {
            const { strain, tip } = action.payload;
            const newTip: SavedStrainTip = {
                ...tip,
                id: `tip-${strain.id}-${Date.now()}`,
                createdAt: Date.now(),
                strainId: strain.id,
                strainName: strain.name,
            };
            state.savedStrainTips.push(newTip);
        },
        updateStrainTip: (state, action: PayloadAction<SavedStrainTip>) => {
            const index = state.savedStrainTips.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                state.savedStrainTips[index] = action.payload;
            }
        },
        deleteStrainTip: (state, action: PayloadAction<string>) => {
            state.savedStrainTips = state.savedStrainTips.filter(t => t.id !== action.payload);
        },
        // For migration
        setSavedExports: (state, action: PayloadAction<SavedExport[]>) => {
            state.savedExports = action.payload;
        },
        setSavedSetups: (state, action: PayloadAction<SavedSetup[]>) => {
            state.savedSetups = action.payload;
        },
        setSavedStrainTips: (state, action: PayloadAction<SavedStrainTip[]>) => {
            state.savedStrainTips = action.payload;
        },
    },
});

export const {
    addExport,
    updateExport,
    deleteExport,
    _addSetup,
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