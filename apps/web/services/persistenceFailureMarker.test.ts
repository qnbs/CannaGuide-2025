import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    activatePersistenceFailureTab,
    clearSnapshotSaveFailureForTab,
    getPendingSnapshotSaveFailureMarkers,
    getPersistenceFailureMarkerTabId,
    markPendingSnapshotSaveFailure,
    markPersistenceFailureTabClosed,
    markSnapshotSaveFailurePresented,
} from './persistenceFailureMarker'

const TAB_ID_KEY = 'cannaguide.persistenceTabId'
const runtimeState = globalThis as typeof globalThis & {
    __cannaguidePersistenceFailureTabId?: string
}

describe('persistence failure marker lifecycle (#669)', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        localStorage.clear()
        sessionStorage.clear()
        delete runtimeState.__cannaguidePersistenceFailureTabId
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
        delete runtimeState.__cannaguidePersistenceFailureTabId
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
        delete runtimeState.__cannaguidePersistenceFailureTabId
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

    it('assigns a distinct ID to a new tab with cloned session storage', () => {
        const ownerTabId = getPersistenceFailureMarkerTabId()
        markPendingSnapshotSaveFailure(ownerTabId)
        const ownerFailure = getPendingSnapshotSaveFailureMarkers()[0]!

        // An opener may clone sessionStorage into a new same-origin browsing context.
        sessionStorage.setItem(TAB_ID_KEY, ownerTabId)
        delete runtimeState.__cannaguidePersistenceFailureTabId
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
            { type: 'navigate' } as PerformanceNavigationTiming,
        ])

        const clonedTabId = getPersistenceFailureMarkerTabId()
        expect(clonedTabId).not.toBe(ownerTabId)

        clearSnapshotSaveFailureForTab(clonedTabId)
        expect(getPendingSnapshotSaveFailureMarkers()).toEqual([ownerFailure])
    })

    it('preserves the tab ID across a document reload', () => {
        sessionStorage.setItem(TAB_ID_KEY, 'reloading-tab')
        vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
            { type: 'reload' } as PerformanceNavigationTiming,
        ])

        expect(getPersistenceFailureMarkerTabId()).toBe('reloading-tab')
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
