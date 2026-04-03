import { KnowledgeProgress, LearningPathProgress } from '@/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface KnowledgeState {
    knowledgeProgress: KnowledgeProgress
    learningPathProgress: LearningPathProgress
}

const initialState: KnowledgeState = {
    knowledgeProgress: {},
    learningPathProgress: {},
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
        completeLearningStep: (
            state,
            action: PayloadAction<{ pathId: string; stepId: string }>,
        ) => {
            const { pathId, stepId } = action.payload
            if (!state.learningPathProgress[pathId]) {
                state.learningPathProgress[pathId] = []
            }
            if (!state.learningPathProgress[pathId].includes(stepId)) {
                state.learningPathProgress[pathId].push(stepId)
            }
        },
        resetLearningPath: (state, action: PayloadAction<string>) => {
            delete state.learningPathProgress[action.payload]
        },
        setLearningPathProgress: (state, action: PayloadAction<LearningPathProgress>) => {
            state.learningPathProgress = action.payload
        },
    },
})

export const {
    updateKnowledgeProgress,
    setKnowledgeProgress,
    completeLearningStep,
    resetLearningPath,
    setLearningPathProgress,
} = knowledgeSlice.actions
export default knowledgeSlice.reducer
