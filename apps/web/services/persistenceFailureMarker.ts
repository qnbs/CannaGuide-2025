const TAB_ID_KEY = 'cannaguide.persistenceTabId'
const FAILURE_MARKER_PREFIX = 'cannaguide.pendingSnapshotSaveFailure:'

let fallbackTabId: string | undefined
const closedTabSessions = new Set<string>()

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
    /** Whether the previous-session warning is still owed or has been queued in the UI. */
    warningState: 'unpresented' | 'presented'
    /** True after pagehide; a presented orphan remains unresolved but must not warn again. */
    ownerClosed: boolean
}

const readMarker = (tabId: string): PendingSnapshotSaveFailureMarker | null => {
    try {
        const stored = localStorage.getItem(markerKey(tabId))
        if (!stored) return null
        try {
            const parsed: unknown = JSON.parse(stored)
            if (
                typeof parsed === 'object' &&
                parsed !== null &&
                'token' in parsed &&
                typeof parsed.token === 'string' &&
                'warningState' in parsed &&
                (parsed.warningState === 'unpresented' || parsed.warningState === 'presented') &&
                'ownerClosed' in parsed &&
                typeof parsed.ownerClosed === 'boolean'
            ) {
                return {
                    tabId,
                    token: parsed.token,
                    warningState: parsed.warningState,
                    ownerClosed: parsed.ownerClosed,
                }
            }
        } catch {
            // Older releases stored an opaque token. Treat it as an unpresented warning.
        }
        return { tabId, token: stored, warningState: 'unpresented', ownerClosed: false }
    } catch {
        return null
    }
}

const writeMarker = (marker: PendingSnapshotSaveFailureMarker): void => {
    try {
        localStorage.setItem(
            markerKey(marker.tabId),
            JSON.stringify({
                token: marker.token,
                warningState: marker.warningState,
                ownerClosed: marker.ownerClosed,
            }),
        )
    } catch {
        // The marker is best-effort and must never change the IndexedDB result.
    }
}

export const activatePersistenceFailureTab = (tabId: string): void => {
    closedTabSessions.delete(tabId)
    const marker = readMarker(tabId)
    if (marker?.ownerClosed) writeMarker({ ...marker, ownerClosed: false })
}

export const markPersistenceFailureTabClosed = (tabId: string): void => {
    closedTabSessions.add(tabId)
    const marker = readMarker(tabId)
    if (!marker) return
    writeMarker({ ...marker, ownerClosed: true })
}

export const markPendingSnapshotSaveFailure = (tabId: string): void => {
    const current = readMarker(tabId)
    writeMarker({
        tabId,
        token: current?.token ?? createTabId(),
        warningState: 'unpresented',
        ownerClosed: closedTabSessions.has(tabId),
    })
}

export const markSnapshotSaveFailurePresented = (
    observed: PendingSnapshotSaveFailureMarker,
): void => {
    const current = readMarker(observed.tabId)
    if (!current || current.token !== observed.token) return
    if (current.warningState !== 'presented') {
        writeMarker({ ...current, warningState: 'presented' })
    }
}

export const clearSnapshotSaveFailureForTab = (
    tabId: string,
    observedAtStartup: readonly PendingSnapshotSaveFailureMarker[] = [],
): void => {
    const current = readMarker(tabId)
    if (
        current &&
        current.warningState === 'unpresented' &&
        observedAtStartup.some(
            (observed) => observed.tabId === tabId && observed.token === current.token,
        )
    ) {
        return
    }
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
                const tabId = key.slice(FAILURE_MARKER_PREFIX.length)
                const marker = readMarker(tabId)
                if (marker) markers.push(marker)
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
