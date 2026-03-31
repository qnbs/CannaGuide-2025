import { ArchivedAdvisorResponse, ArchivedMentorResponse, AIResponse, Plant } from '@/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ArchivesState {
    archivedMentorResponses: ArchivedMentorResponse[]
    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>
}

const MAX_MENTOR_ARCHIVES = 100
const MAX_ADVISOR_ARCHIVES_PER_PLANT = 50

const initialState: ArchivesState = {
    archivedMentorResponses: [],
    archivedAdvisorResponses: {},
}

const archivesSlice = createSlice({
    name: 'archives',
    initialState,
    reducers: {
        addArchivedMentorResponse: (
            state,
            action: PayloadAction<Omit<ArchivedMentorResponse, 'id' | 'createdAt'>>,
        ) => {
            const response = action.payload
            if (
                !response ||
                typeof response.title !== 'string' ||
                !response.title.trim() ||
                typeof response.content !== 'string' ||
                !response.content.trim()
            ) {
                console.error(
                    '[ArchivesSlice] Attempted to add an invalid mentor response. Data was discarded.',
                    response,
                )
                return
            }
            const newResponse: ArchivedMentorResponse = {
                ...response,
                id: `mentor-${Date.now()}`,
                createdAt: Date.now(),
            }
            state.archivedMentorResponses.push(newResponse)
            if (state.archivedMentorResponses.length > MAX_MENTOR_ARCHIVES) {
                state.archivedMentorResponses =
                    state.archivedMentorResponses.slice(-MAX_MENTOR_ARCHIVES)
            }
        },
        updateArchivedMentorResponse: (state, action: PayloadAction<ArchivedMentorResponse>) => {
            const index = state.archivedMentorResponses.findIndex((r) => r.id === action.payload.id)
            if (index !== -1) {
                state.archivedMentorResponses[index] = action.payload
            }
        },
        deleteArchivedMentorResponse: (state, action: PayloadAction<string>) => {
            state.archivedMentorResponses = state.archivedMentorResponses.filter(
                (r) => r.id !== action.payload,
            )
        },
        addArchivedAdvisorResponse: (
            state,
            action: PayloadAction<{ plant: Plant; response: AIResponse; query: string }>,
        ) => {
            const { plant, response, query } = action.payload
            if (
                !plant ||
                !response ||
                typeof response.title !== 'string' ||
                !response.title.trim() ||
                typeof response.content !== 'string' ||
                !response.content.trim()
            ) {
                console.error(
                    '[ArchivesSlice] Attempted to add an invalid advisor response. Data was discarded.',
                    { plant, response },
                )
                return
            }
            const newResponse: ArchivedAdvisorResponse = {
                ...response,
                id: `advisor-${plant.id}-${Date.now()}`,
                createdAt: Date.now(),
                plantId: plant.id,
                plantStage: plant.stage,
                query: query,
            }
            if (!state.archivedAdvisorResponses[plant.id]) {
                state.archivedAdvisorResponses[plant.id] = []
            }
            state.archivedAdvisorResponses[plant.id]!.push(newResponse)
            if (state.archivedAdvisorResponses[plant.id]!.length > MAX_ADVISOR_ARCHIVES_PER_PLANT) {
                state.archivedAdvisorResponses[plant.id] = state.archivedAdvisorResponses[
                    plant.id
                ]!.slice(-MAX_ADVISOR_ARCHIVES_PER_PLANT)
            }
        },
        updateArchivedAdvisorResponse: (state, action: PayloadAction<ArchivedAdvisorResponse>) => {
            const updatedResponse = action.payload
            const plantArchive = state.archivedAdvisorResponses[updatedResponse.plantId]
            if (plantArchive) {
                const index = plantArchive.findIndex((r) => r.id === updatedResponse.id)
                if (index !== -1) {
                    plantArchive[index] = updatedResponse
                }
            }
        },
        deleteArchivedAdvisorResponse: (
            state,
            action: PayloadAction<{ plantId: string; responseId: string }>,
        ) => {
            const { plantId, responseId } = action.payload
            const plantArchive = state.archivedAdvisorResponses[plantId]
            if (plantArchive) {
                state.archivedAdvisorResponses[plantId] = plantArchive.filter(
                    (r) => r.id !== responseId,
                )
            }
        },
        clearArchives: (state) => {
            state.archivedMentorResponses = []
            state.archivedAdvisorResponses = {}
        },
        setArchivedMentorResponses: (state, action: PayloadAction<ArchivedMentorResponse[]>) => {
            state.archivedMentorResponses = action.payload
        },
        setArchivedAdvisorResponses: (
            state,
            action: PayloadAction<Record<string, ArchivedAdvisorResponse[]>>,
        ) => {
            state.archivedAdvisorResponses = action.payload
        },
        setMentorResponseFeedback: (
            state,
            action: PayloadAction<{ id: string; feedback: 'positive' | 'negative' }>,
        ) => {
            const { id, feedback } = action.payload
            const response = state.archivedMentorResponses.find((r) => r.id === id)
            if (response) {
                response.feedback = response.feedback === feedback ? undefined : feedback
            }
        },
        setAdvisorResponseFeedback: (
            state,
            action: PayloadAction<{
                plantId: string
                responseId: string
                feedback: 'positive' | 'negative'
            }>,
        ) => {
            const { plantId, responseId, feedback } = action.payload
            const plantArchive = state.archivedAdvisorResponses[plantId]
            if (plantArchive) {
                const response = plantArchive.find((r) => r.id === responseId)
                if (response) {
                    response.feedback = response.feedback === feedback ? undefined : feedback
                }
            }
        },
    },
})

export const {
    addArchivedMentorResponse,
    updateArchivedMentorResponse,
    deleteArchivedMentorResponse,
    addArchivedAdvisorResponse,
    updateArchivedAdvisorResponse,
    deleteArchivedAdvisorResponse,
    clearArchives,
    setArchivedMentorResponses,
    setArchivedAdvisorResponses,
    setMentorResponseFeedback,
    setAdvisorResponseFeedback,
} = archivesSlice.actions

export default archivesSlice.reducer
