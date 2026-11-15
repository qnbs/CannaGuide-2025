const TAB_ID_KEY = 'cannaguide.persistenceTabId'
const FAILURE_MARKER_PREFIX = 'cannaguide.pendingSnapshotSaveFailure:'

let fallbackTabId: string | undefined

const createTabId = (): string => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    } catch {
        // Fall through to a non-secret best-effort identifier.
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Stable across reloads in this tab, distinct across normal tab sessions. */
export const getPersistenceFailureMarkerTabId = (): string => {
    try {
        const existing = sessionStorage.getItem(TAB_ID_KEY)
        if (existing) return existing
        const created = createTabId()
        sessionStorage.setItem(TAB_ID_KEY, created)
        return created
    } catch {
        fallbackTabId ??= createTabId()
        return fallbackTabId
    }
}

const markerKey = (tabId: string): string => `${FAILURE_MARKER_PREFIX}${tabId}`

export interface PendingSnapshotSaveFailureMarker {
    tabId: string
    token: string
}

export const markPendingSnapshotSaveFailure = (tabId: string): void => {
    try {
        localStorage.setItem(markerKey(tabId), createTabId())
    } catch {
        // The marker is best-effort and must never change the IndexedDB result.
    }
}

export const clearSnapshotSaveFailureForTab = (tabId: string): void => {
    try {
        localStorage.removeItem(markerKey(tabId))
    } catch {
        // The marker is best-effort and must never change the IndexedDB result.
    }
}

export const hasPendingSnapshotSaveFailure = (): boolean => {
    return getPendingSnapshotSaveFailureMarkers().length > 0
}

export const getPendingSnapshotSaveFailureMarkers = (): PendingSnapshotSaveFailureMarker[] => {
    try {
        const markers: PendingSnapshotSaveFailureMarker[] = []
        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index)
            if (key?.startsWith(FAILURE_MARKER_PREFIX)) {
                const token = localStorage.getItem(key)
                if (token) markers.push({ tabId: key.slice(FAILURE_MARKER_PREFIX.length), token })
            }
        }
        return markers
    } catch {
        return []
    }
}

/** Full reset/import intentionally replaces every pending snapshot lineage. */
export const clearAllSnapshotSaveFailures = (): void => {
    try {
        const keys = Array.from({ length: localStorage.length }, (_, index) =>
            localStorage.key(index),
        ).filter((key): key is string => key?.startsWith(FAILURE_MARKER_PREFIX) === true)
        for (const key of keys) localStorage.removeItem(key)
    } catch {
        // The marker is best-effort and must never interrupt reset or recovery.
    }
}
