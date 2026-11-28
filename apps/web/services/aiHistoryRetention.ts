import type { RootState } from '@/stores/store'

export const AI_HISTORY_CLEAR_PENDING_KEY = 'cg.ai.clear-on-exit.pending'

export type AiHistoryClearPhase = 'active' | 'recovery' | null

/** `1` is the legacy value and means the active snapshot still needs clearing. */
export const getAiHistoryClearPhase = (): AiHistoryClearPhase => {
    try {
        if (typeof localStorage === 'undefined') return null
        const marker = localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY)
        if (marker === '1') return 'active'
        if (marker === '2') return 'recovery'
        return null
    } catch {
        return null
    }
}

export const hasPendingAiHistoryClear = (): boolean => {
    return getAiHistoryClearPhase() !== null
}

export const markAiHistoryClearPending = (): boolean => {
    try {
        if (typeof localStorage === 'undefined') return false
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '1')
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === '1'
    } catch {
        return false
    }
}

/** The primary snapshot is already committed; only recovery copies remain. */
export const markAiHistoryRecoveryPending = (): boolean => {
    try {
        if (typeof localStorage === 'undefined') return false
        localStorage.setItem(AI_HISTORY_CLEAR_PENDING_KEY, '2')
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === '2'
    } catch {
        return false
    }
}

export const clearPendingAiHistoryClear = (): boolean => {
    try {
        if (typeof localStorage === 'undefined') return false
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
