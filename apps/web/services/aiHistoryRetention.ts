import type { RootState } from '@/stores/store'

export const AI_HISTORY_CLEAR_PENDING_KEY = 'cg.ai.clear-on-exit.pending'

export type AiHistoryClearPhase = 'active' | 'recovery' | null
export type AiHistoryClearMarker = string

let markerFallbackSequence = 0

const createMarkerId = (): string => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID()
        }
    } catch {
        // Continue with a non-sensitive uniqueness fallback for older browsers.
    }
    markerFallbackSequence += 1
    return `${Date.now().toString(36)}-${markerFallbackSequence.toString(36)}-${Math.random()
        .toString(36)
        .slice(2)}`
}

const phaseForMarker = (marker: string | null): AiHistoryClearPhase => {
    if (marker === '1' || /^1:[a-zA-Z0-9-]+$/.test(marker ?? '')) return 'active'
    if (marker === '2' || /^2:[a-zA-Z0-9-]+$/.test(marker ?? '')) return 'recovery'
    return null
}

export const getAiHistoryClearMarker = (): AiHistoryClearMarker | null => {
    try {
        if (typeof localStorage === 'undefined') return null
        const marker = localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)
        return phaseForMarker(marker) === null ? null : marker
    } catch {
        return null
    }
}

/** `1` is the legacy value and means the active snapshot still needs clearing. */
export const getAiHistoryClearPhase = (): AiHistoryClearPhase => {
    return phaseForMarker(getAiHistoryClearMarker())
}

export const hasPendingAiHistoryClear = (): boolean => {
    return getAiHistoryClearPhase() !== null
}

export const markAiHistoryClearPending = (): AiHistoryClearMarker | null => {
    try {
        if (typeof localStorage === 'undefined') return null
        const marker = `1:${createMarkerId()}`
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, marker)
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === marker ? marker : null
    } catch {
        return null
    }
}

/** The primary snapshot is already committed; only recovery copies remain. */
export const markAiHistoryRecoveryPending = (
    expectedMarker: AiHistoryClearMarker,
): AiHistoryClearMarker | null => {
    try {
        if (typeof localStorage === 'undefined') return null
        if (localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) !== expectedMarker) return null
        if (phaseForMarker(expectedMarker) !== 'active') return null
        const requestId = expectedMarker.includes(':')
            ? expectedMarker.slice(expectedMarker.indexOf(':') + 1)
            : createMarkerId()
        const recoveryMarker = `2:${requestId}`
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, recoveryMarker)
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === recoveryMarker
            ? recoveryMarker
            : null
    } catch {
        return null
    }
}

export const clearPendingAiHistoryClear = (expectedMarker: AiHistoryClearMarker): boolean => {
    try {
        if (
            typeof localStorage === 'undefined' ||
            localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) !== expectedMarker
        ) {
            return false
        }
        localStorage.removeItem(AI_HISTORY_CLEAR_PENDING_KEY)
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === null
    } catch {
        return false
    }
}

export const hasNoArchivedAiResponses = (archives: RootState['archives'] | undefined): boolean =>
    archives === undefined ||
    (archives.archivedMentorResponses.length === 0 &&
        Object.keys(archives.archivedAdvisorResponses).length === 0)

type SanitizedSnapshot =
    { status: 'unrecognized' } | { status: 'clean' | 'sanitized'; serialized: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

type Snapshot = Record<string, unknown>
type ArchiveSnapshot = Record<string, unknown> & {
    archivedMentorResponses: unknown[]
    archivedAdvisorResponses: Record<string, unknown>
}

const parseSnapshot = (serialized: string): Snapshot | null => {
    try {
        const parsed: unknown = JSON.parse(serialized)
        return isRecord(parsed) && typeof parsed.version === 'number' ? parsed : null
    } catch {
        return null
    }
}

const parseArchives = (value: unknown): ArchiveSnapshot | null => {
    if (!isRecord(value)) return null
    const archivedMentorResponses = value.archivedMentorResponses
    const archivedAdvisorResponses = value.archivedAdvisorResponses
    if (!Array.isArray(archivedMentorResponses)) return null
    if (!isRecord(archivedAdvisorResponses)) return null
    return { ...value, archivedMentorResponses, archivedAdvisorResponses }
}

const hasSavedArchiveEntries = (archives: ArchiveSnapshot): boolean =>
    archives.archivedMentorResponses.length > 0 ||
    Object.keys(archives.archivedAdvisorResponses).length > 0

const sanitizeSnapshot = (snapshot: Snapshot, archives: ArchiveSnapshot): string =>
    JSON.stringify({
        ...snapshot,
        archives: {
            ...archives,
            archivedMentorResponses: [],
            archivedAdvisorResponses: {},
        },
    })

/** Clears only the two recognized archive fields; malformed recovery data is preserved. */
export const clearArchivedAiResponsesFromSnapshot = (serialized: string): SanitizedSnapshot => {
    const snapshot = parseSnapshot(serialized)
    if (snapshot === null) return { status: 'unrecognized' }
    if (!Object.hasOwn(snapshot, 'archives')) return { status: 'clean', serialized }

    const archives = parseArchives(snapshot.archives)
    if (archives === null) return { status: 'unrecognized' }
    if (!hasSavedArchiveEntries(archives)) return { status: 'clean', serialized }

    return {
        status: 'sanitized',
        serialized: sanitizeSnapshot(snapshot, archives),
    }
}
