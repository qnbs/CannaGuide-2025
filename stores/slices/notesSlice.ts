
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotesState {
    strainNotes: Record<string, string>;
}

const initialState: NotesState = {
    strainNotes: {},
};

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        updateNote: (state, action: PayloadAction<{ strainId: string, note: string }>) => {
            state.strainNotes[action.payload.strainId] = action.payload.note;
        },
        // For migration
        setStrainNotes: (state, action: PayloadAction<Record<string, string>>) => {
            state.strainNotes = action.payload;
        }
    },
});

export const { updateNote, setStrainNotes } = notesSlice.actions;
export default notesSlice.reducer;
