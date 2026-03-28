import { KnowledgeProgress } from '@/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface KnowledgeState {
    knowledgeProgress: KnowledgeProgress
}

const initialState: KnowledgeState = {
    knowledgeProgress: {},
}

const knowledgeSlice = createSlice({
    name: 'knowledge',
    initialState,
    reducers: {
        updateKnowledgeProgress: (
            state,
            action: PayloadAction<{ sectionId: string; itemId: string }>,
        ) => {
            const { sectionId, itemId } = action.payload
            if (!state.knowledgeProgress[sectionId]) {
                state.knowledgeProgress[sectionId] = []
            }
            if (!state.knowledgeProgress[sectionId].includes(itemId)) {
                state.knowledgeProgress[sectionId].push(itemId)
            }
        },
        // For migration
        setKnowledgeProgress: (state, action: PayloadAction<KnowledgeProgress>) => {
            state.knowledgeProgress = action.payload
        },
    },
})

export const { updateKnowledgeProgress, setKnowledgeProgress } = knowledgeSlice.actions
export default knowledgeSlice.reducer
