import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NoteHistory {
    past: string[];
    present: string;
    future: string[];
}

export interface NotesState {
    strainNotes: Record<string, NoteHistory>;
}

const initialState: NotesState = {
    strainNotes: {},
};

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        updateNote: (state, action: PayloadAction<{ strainId: string, note: string }>) => {
            const { strainId, note } = action.payload;
            const previous = state.strainNotes[strainId]?.present;

            if (!state.strainNotes[strainId]) {
                state.strainNotes[strainId] = { past: [], present: note, future: [] };
            } else if (previous !== note) {
                state.strainNotes[strainId].past.push(previous);
                state.strainNotes[strainId].present = note;
                state.strainNotes[strainId].future = []; // Clear future on new edit
            }
        },
        undoNoteChange: (state, action: PayloadAction<{ strainId: string }>) => {
            const history = state.strainNotes[action.payload.strainId];
            if (history && history.past.length > 0) {
                const previous = history.past.pop()!;
                history.future.unshift(history.present);
                history.present = previous;
            }
        },
        redoNoteChange: (state, action: PayloadAction<{ strainId: string }>) => {
            const history = state.strainNotes[action.payload.strainId];
            if (history && history.future.length > 0) {
                const next = history.future.shift()!;
                history.past.push(history.present);
                history.present = next;
            }
        },
        // For migration
        setStrainNotes: (state, action: PayloadAction<Record<string, string | NoteHistory>>) => {
            // This migration logic handles both old (string) and new (NoteHistory) formats
            const newNotesState: Record<string, NoteHistory> = {};
            for (const strainId in action.payload) {
                const noteData = action.payload[strainId];
                if (typeof noteData === 'string') {
                    // Convert old string format to new history format
                    newNotesState[strainId] = { past: [], present: noteData, future: [] };
                } else if (noteData && 'present' in noteData) {
                    // It's already in the new format
                    newNotesState[strainId] = noteData;
                }
            }
            state.strainNotes = newNotesState;
        }
    },
});

export const { updateNote, undoNoteChange, redoNoteChange, setStrainNotes } = notesSlice.actions;
export default notesSlice.reducer;
