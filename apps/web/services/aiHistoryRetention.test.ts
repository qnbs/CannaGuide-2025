import { describe, expect, it } from 'vitest'
import { clearArchivedAiResponsesFromSnapshot } from './aiHistoryRetention'

describe('clear archived AI responses from a saved snapshot', () => {
    it('clears recognized archives while preserving unrelated saved state', () => {
        const original = JSON.stringify({
            version: 5,
            simulation: { selectedPlantId: 'plant-1' },
            archives: {
                archivedMentorResponses: [{ id: 'mentor-1' }],
                archivedAdvisorResponses: { 'plant-1': [{ id: 'advisor-1' }] },
                futureArchiveField: 'preserve',
            },
        })

        const result = clearArchivedAiResponsesFromSnapshot(original)

        expect(result.status).toBe('sanitized')
        if (result.status !== 'sanitized') return
        expect(JSON.parse(result.serialized)).toEqual({
            version: 5,
            simulation: { selectedPlantId: 'plant-1' },
            archives: {
                archivedMentorResponses: [],
                archivedAdvisorResponses: {},
                futureArchiveField: 'preserve',
            },
        })
    })

    it('preserves malformed or unrecognized recovery snapshots', () => {
        expect(clearArchivedAiResponsesFromSnapshot('{broken')).toEqual({
            status: 'unrecognized',
        })
        expect(
            clearArchivedAiResponsesFromSnapshot(
                JSON.stringify({ version: 5, archives: { archivedMentorResponses: 'unknown' } }),
            ),
        ).toEqual({ status: 'unrecognized' })
    })
})
