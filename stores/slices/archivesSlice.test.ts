import { describe, it, expect } from 'vitest'
import archivesReducer, {
    addArchivedMentorResponse,
    updateArchivedMentorResponse,
    deleteArchivedMentorResponse,
    addArchivedAdvisorResponse,
    deleteArchivedAdvisorResponse,
    clearArchives,
    type ArchivesState,
} from '@/stores/slices/archivesSlice'
import { PlantStage } from '@/types'

const initial: ArchivesState = { archivedMentorResponses: [], archivedAdvisorResponses: {} }

describe('archivesSlice', () => {
    it('returns initial state', () => {
        const state = archivesReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    describe('mentor responses', () => {
        it('adds a valid mentor response', () => {
            const state = archivesReducer(
                initial,
                addArchivedMentorResponse({ title: 'Test', content: 'Content', tags: [] } as any),
            )
            expect(state.archivedMentorResponses).toHaveLength(1)
            expect(state.archivedMentorResponses[0]!.title).toBe('Test')
            expect(state.archivedMentorResponses[0]!.id).toMatch(/^mentor-/)
        })

        it('rejects invalid mentor response (empty title)', () => {
            const state = archivesReducer(
                initial,
                addArchivedMentorResponse({ title: '', content: 'Content', tags: [] } as any),
            )
            expect(state.archivedMentorResponses).toHaveLength(0)
        })

        it('rejects invalid mentor response (empty content)', () => {
            const state = archivesReducer(
                initial,
                addArchivedMentorResponse({ title: 'Title', content: '  ', tags: [] } as any),
            )
            expect(state.archivedMentorResponses).toHaveLength(0)
        })

        it('limits mentor responses to 100', () => {
            let state = initial
            for (let i = 0; i < 105; i++) {
                state = archivesReducer(
                    state,
                    addArchivedMentorResponse({ title: `T${i}`, content: `C${i}`, tags: [] } as any),
                )
            }
            expect(state.archivedMentorResponses.length).toBeLessThanOrEqual(100)
        })

        it('updates a mentor response', () => {
            let state = archivesReducer(
                initial,
                addArchivedMentorResponse({ title: 'Original', content: 'Original', tags: [] } as any),
            )
            const id = state.archivedMentorResponses[0]!.id
            state = archivesReducer(
                state,
                updateArchivedMentorResponse({ ...state.archivedMentorResponses[0]!, title: 'Updated' }),
            )
            expect(state.archivedMentorResponses[0]!.title).toBe('Updated')
            expect(state.archivedMentorResponses[0]!.id).toBe(id)
        })

        it('deletes a mentor response', () => {
            let state = archivesReducer(
                initial,
                addArchivedMentorResponse({ title: 'Delete Me', content: 'Content', tags: [] } as any),
            )
            const id = state.archivedMentorResponses[0]!.id
            state = archivesReducer(state, deleteArchivedMentorResponse(id))
            expect(state.archivedMentorResponses).toHaveLength(0)
        })
    })

    describe('advisor responses', () => {
        const mockPlant = { id: 'plant-1', name: 'Test', stage: PlantStage.Vegetative }
        const mockResponse = { title: 'Advice', content: 'Do this' }

        it('adds a valid advisor response', () => {
            const state = archivesReducer(
                initial,
                addArchivedAdvisorResponse({ plant: mockPlant as any, response: mockResponse as any, query: 'help' }),
            )
            expect(state.archivedAdvisorResponses['plant-1']).toHaveLength(1)
        })

        it('rejects invalid advisor response', () => {
            const state = archivesReducer(
                initial,
                addArchivedAdvisorResponse({ plant: mockPlant as any, response: { title: '', content: '' } as any, query: '' }),
            )
            expect(state.archivedAdvisorResponses['plant-1']).toBeUndefined()
        })

        it('deletes an advisor response', () => {
            let state = archivesReducer(
                initial,
                addArchivedAdvisorResponse({ plant: mockPlant as any, response: mockResponse as any, query: 'help' }),
            )
            const responseId = state.archivedAdvisorResponses['plant-1']![0]!.id
            state = archivesReducer(
                state,
                deleteArchivedAdvisorResponse({ plantId: 'plant-1', responseId }),
            )
            expect(state.archivedAdvisorResponses['plant-1']).toHaveLength(0)
        })
    })

    it('clearArchives resets everything', () => {
        let state = archivesReducer(
            initial,
            addArchivedMentorResponse({ title: 'T', content: 'C', tags: [] } as any),
        )
        state = archivesReducer(state, clearArchives())
        expect(state.archivedMentorResponses).toHaveLength(0)
        expect(state.archivedAdvisorResponses).toEqual({})
    })
})
