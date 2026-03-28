import { describe, it, expect } from 'vitest'
import notesReducer, {
    updateNote,
    undoNoteChange,
    redoNoteChange,
    setStrainNotes,
} from '@/stores/slices/notesSlice'

const initial = { strainNotes: {} }

describe('notesSlice', () => {
    it('returns initial state', () => {
        const state = notesReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('updateNote creates a new note entry', () => {
        const state = notesReducer(initial, updateNote({ strainId: 's1', note: 'First note' }))
        expect(state.strainNotes['s1']!.present).toBe('First note')
        expect(state.strainNotes['s1']!.past).toEqual([])
        expect(state.strainNotes['s1']!.future).toEqual([])
    })

    it('updateNote pushes previous to past and clears future', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'A' }))
        state = notesReducer(state, updateNote({ strainId: 's1', note: 'B' }))
        state = notesReducer(state, updateNote({ strainId: 's1', note: 'C' }))

        expect(state.strainNotes['s1']!.present).toBe('C')
        expect(state.strainNotes['s1']!.past).toEqual(['A', 'B'])
        expect(state.strainNotes['s1']!.future).toEqual([])
    })

    it('updateNote with same text does not create history entry', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'Same' }))
        state = notesReducer(state, updateNote({ strainId: 's1', note: 'Same' }))
        expect(state.strainNotes['s1']!.past).toEqual([])
    })

    it('undoNoteChange restores previous note', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'A' }))
        state = notesReducer(state, updateNote({ strainId: 's1', note: 'B' }))
        state = notesReducer(state, undoNoteChange({ strainId: 's1' }))

        expect(state.strainNotes['s1']!.present).toBe('A')
        expect(state.strainNotes['s1']!.future).toEqual(['B'])
    })

    it('undoNoteChange does nothing when no history', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'Only' }))
        state = notesReducer(state, undoNoteChange({ strainId: 's1' }))
        expect(state.strainNotes['s1']!.present).toBe('Only')
    })

    it('redoNoteChange restores next note', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'A' }))
        state = notesReducer(state, updateNote({ strainId: 's1', note: 'B' }))
        state = notesReducer(state, undoNoteChange({ strainId: 's1' }))
        state = notesReducer(state, redoNoteChange({ strainId: 's1' }))

        expect(state.strainNotes['s1']!.present).toBe('B')
    })

    it('redoNoteChange does nothing when no future', () => {
        let state = notesReducer(initial, updateNote({ strainId: 's1', note: 'A' }))
        state = notesReducer(state, redoNoteChange({ strainId: 's1' }))
        expect(state.strainNotes['s1']!.present).toBe('A')
    })

    it('setStrainNotes handles migration from old string format', () => {
        const state = notesReducer(initial, setStrainNotes({ s1: 'legacy note' }))
        expect(state.strainNotes['s1']!.present).toBe('legacy note')
        expect(state.strainNotes['s1']!.past).toEqual([])
    })

    it('setStrainNotes handles new NoteHistory format', () => {
        const history = { past: ['old'], present: 'current', future: ['next'] }
        const state = notesReducer(initial, setStrainNotes({ s1: history }))
        expect(state.strainNotes['s1']).toEqual(history)
    })

    it('limits undo history to 50 entries', () => {
        let state = notesReducer(undefined, { type: 'unknown' })
        for (let i = 0; i < 60; i++) {
            state = notesReducer(state, updateNote({ strainId: 's1', note: `note-${i}` }))
        }
        expect(state.strainNotes['s1']!.past.length).toBeLessThanOrEqual(50)
    })
})
