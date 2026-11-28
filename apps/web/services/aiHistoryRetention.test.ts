import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    AI_HISTORY_CLEAR_PENDING_KEY,
    clearArchivedAiResponsesFromSnapshot,
    clearPendingAiHistoryClear,
    getAiHistoryClearMarker,
    getAiHistoryClearPhase,
    getAiHistoryClearRequestRevision,
    markAiHistoryClearPending,
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

        const recoveryMarker = markAiHistoryRecoveryPending('1')

        expect(recoveryMarker).toMatch(/^2:/)
        expect(getAiHistoryClearPhase()).toBe('recovery')
    })

    it('does not retire a newer pagehide request when earlier recovery finishes', () => {
        const olderMarker = markAiHistoryClearPending()
        if (olderMarker === null) throw new Error('Expected an active clear marker')
        const recoveryMarker = markAiHistoryRecoveryPending(olderMarker)
        if (recoveryMarker === null) throw new Error('Expected a recovery clear marker')

        const newerMarker = markAiHistoryClearPending()
        if (newerMarker === null) throw new Error('Expected the new exit marker')

        expect(clearPendingAiHistoryClear(recoveryMarker)).toBe(false)
        expect(getAiHistoryClearMarker()).toBe(newerMarker)
        expect(getAiHistoryClearPhase()).toBe('active')
    })

    it('preserves the observed snapshot revision when active cleanup becomes recovery-only', () => {
        const activeMarker = markAiHistoryClearPending('revision-before-exit')
        if (activeMarker === null) throw new Error('Expected an active clear marker')

        const recoveryMarker = markAiHistoryRecoveryPending(activeMarker)

        expect(recoveryMarker).toMatch(/^2:/)
        expect(getAiHistoryClearRequestRevision()).toBe('revision-before-exit')
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

        expect(clearPendingAiHistoryClear('2')).toBe(false)
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

    it('clears known Mentor replies when migration repairs a malformed Advisor collection', () => {
        const original = JSON.stringify({
            version: 5,
            archives: {
                archivedMentorResponses: [{ id: 'mentor-private' }],
                archivedAdvisorResponses: null,
                futureArchiveField: 'preserve',
            },
        })

        const result = clearArchivedAiResponsesFromSnapshot(original)

        expect(result.status).toBe('sanitized')
        if (result.status !== 'sanitized') return
        expect(JSON.parse(result.serialized).archives).toEqual({
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
            futureArchiveField: 'preserve',
        })
    })
})
