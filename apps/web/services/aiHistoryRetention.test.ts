import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    AI_HISTORY_CLEAR_PENDING_KEY,
    clearArchivedAiResponsesFromSnapshot,
    clearPendingAiHistoryClear,
    getAiHistoryClearPhase,
    markAiHistoryRecoveryPending,
} from './aiHistoryRetention'

describe('AI history cleanup retry phases', () => {
    beforeEach(() => localStorage.clear())

    it('reads the legacy marker as active-snapshot cleanup', () => {
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')

        expect(getAiHistoryClearPhase()).toBe('active')
    })

    it('records recovery-only cleanup without requesting active archive deletion', () => {
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')

        expect(markAiHistoryRecoveryPending()).toBe(true)
        expect(getAiHistoryClearPhase()).toBe('recovery')
    })

    it('does not report a stuck recovery marker as cleared', () => {
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')
        const removeItem = Storage.prototype.removeItem
        const failedRemoval = vi
            .spyOn(Storage.prototype, 'removeItem')
            .mockImplementation(function (this: Storage, key: string) {
                if (key === AI_HISTORY_CLEAR_PENDING_KEY) return
                removeItem.call(this, key)
            })

        expect(clearPendingAiHistoryClear()).toBe(false)
        expect(getAiHistoryClearPhase()).toBe('recovery')
        failedRemoval.mockRestore()
    })
})

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
