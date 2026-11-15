import { beforeEach, describe, expect, it } from 'vitest'
import {
    activatePersistenceFailureTab,
    clearSnapshotSaveFailureForTab,
    getPendingSnapshotSaveFailureMarkers,
    getPersistenceFailureMarkerTabId,
    markPendingSnapshotSaveFailure,
    markPersistenceFailureTabClosed,
    markSnapshotSaveFailurePresented,
} from './persistenceFailureMarker'

describe('persistence failure marker lifecycle (#669)', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    it('keeps an unresolved marker after presentation while its owner tab is active', () => {
        const ownerTabId = getPersistenceFailureMarkerTabId()
        activatePersistenceFailureTab(ownerTabId)
        markPendingSnapshotSaveFailure(ownerTabId)
        const failure = getPendingSnapshotSaveFailureMarkers()[0]!

        expect(failure.warningState).toBe('unpresented')
        expect(failure.ownerClosed).toBe(false)

        markSnapshotSaveFailurePresented(failure)

        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([
            { ...failure, warningState: 'presented' },
        ])

        clearSnapshotSaveFailureForTab(ownerTabId)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([])
    })

    it('retires a closed tab marker only after the warning has been presented', () => {
        const ownerTabId = getPersistenceFailureMarkerTabId()
        activatePersistenceFailureTab(ownerTabId)
        markPendingSnapshotSaveFailure(ownerTabId)
        const failure = getPendingSnapshotSaveFailureMarkers()[0]!

        markPersistenceFailureTabClosed(ownerTabId)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([{ ...failure, ownerClosed: true }])

        sessionStorage.clear()
        const nextTabId = getPersistenceFailureMarkerTabId()
        activatePersistenceFailureTab(nextTabId)
        expect(nextTabId).not.toBe(ownerTabId)

        markSnapshotSaveFailurePresented(failure)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([
            { ...failure, warningState: 'presented', ownerClosed: true },
        ])
    })

    it('does not let a different active tab retire the owner marker', () => {
        const ownerTabId = getPersistenceFailureMarkerTabId()
        activatePersistenceFailureTab(ownerTabId)
        markPendingSnapshotSaveFailure(ownerTabId)
        const failure = getPendingSnapshotSaveFailureMarkers()[0]!

        sessionStorage.clear()
        const otherTabId = getPersistenceFailureMarkerTabId()
        activatePersistenceFailureTab(otherTabId)
        expect(otherTabId).not.toBe(ownerTabId)

        markSnapshotSaveFailurePresented(failure)
        markPersistenceFailureTabClosed(otherTabId)

        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([
            { ...failure, warningState: 'presented' },
        ])

        markPersistenceFailureTabClosed(ownerTabId)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([
            { ...failure, warningState: 'presented', ownerClosed: true },
        ])
    })

    it('does not let a stale presentation retire a newer failure token', () => {
        const tabId = getPersistenceFailureMarkerTabId()
        markPendingSnapshotSaveFailure(tabId)
        const staleFailure = getPendingSnapshotSaveFailureMarkers()[0]!
        clearSnapshotSaveFailureForTab(tabId)
        markPendingSnapshotSaveFailure(tabId)
        const currentFailure = getPendingSnapshotSaveFailureMarkers()[0]!

        markSnapshotSaveFailurePresented(staleFailure)

        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([currentFailure])
    })
})
