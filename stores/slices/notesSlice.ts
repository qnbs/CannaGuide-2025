import type { StoreSet } from '@/stores/useAppStore';

export interface NotesSlice {
    strainNotes: Record<string, string>;
    updateNoteForStrain: (strainId: string, content: string) => void;
}

export const createNotesSlice = (set: StoreSet): NotesSlice => ({
    strainNotes: {},
    updateNoteForStrain: (strainId, content) => set(state => {
        state.strainNotes[strainId] = content;
    }),
});