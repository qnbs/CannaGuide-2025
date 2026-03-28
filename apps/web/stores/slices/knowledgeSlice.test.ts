import { describe, it, expect } from 'vitest'
import knowledgeReducer, {
    updateKnowledgeProgress,
    setKnowledgeProgress,
} from '@/stores/slices/knowledgeSlice'

const initial = { knowledgeProgress: {} }

describe('knowledgeSlice', () => {
    it('returns initial state', () => {
        const state = knowledgeReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('updateKnowledgeProgress adds a new section with item', () => {
        const state = knowledgeReducer(
            initial,
            updateKnowledgeProgress({ sectionId: 'basics', itemId: 'item-1' }),
        )
        expect(state.knowledgeProgress['basics']).toContain('item-1')
    })

    it('updateKnowledgeProgress does not duplicate items', () => {
        let state = knowledgeReducer(
            initial,
            updateKnowledgeProgress({ sectionId: 'basics', itemId: 'item-1' }),
        )
        state = knowledgeReducer(
            state,
            updateKnowledgeProgress({ sectionId: 'basics', itemId: 'item-1' }),
        )
        expect(state.knowledgeProgress['basics']).toHaveLength(1)
    })

    it('updateKnowledgeProgress handles multiple sections', () => {
        let state = knowledgeReducer(
            initial,
            updateKnowledgeProgress({ sectionId: 'basics', itemId: 'item-1' }),
        )
        state = knowledgeReducer(
            state,
            updateKnowledgeProgress({ sectionId: 'advanced', itemId: 'item-2' }),
        )
        expect(state.knowledgeProgress['basics']).toHaveLength(1)
        expect(state.knowledgeProgress['advanced']).toHaveLength(1)
    })

    it('setKnowledgeProgress replaces progress state', () => {
        const newProgress = { section1: ['a', 'b'], section2: ['c'] }
        const state = knowledgeReducer(initial, setKnowledgeProgress(newProgress))
        expect(state.knowledgeProgress).toEqual(newProgress)
    })
})
