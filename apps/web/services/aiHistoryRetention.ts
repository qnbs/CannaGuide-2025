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

type ParsedMarker = {
    phase: Exclude<AiHistoryClearPhase, null>
    requestId: string | null
    startingRevision: string | null
}

const parseMarker = (marker: string | null): ParsedMarker | null => {
    if (marker === '1') return { phase: 'active', requestId: null, startingRevision: null }
    if (marker === '2') return { phase: 'recovery', requestId: null, startingRevision: null }
    const match = /^(1|2):([a-zA-Z0-9-]+)(?::([a-zA-Z0-9-]+))?$/.exec(marker ?? '')
    if (match === null) return null
    const markerPhase = match[1]
    const requestId = match[2]
    if ((markerPhase !== '1' && markerPhase !== '2') || requestId === undefined) return null
    return {
        phase: markerPhase === '1' ? 'active' : 'recovery',
        requestId,
        startingRevision: match[3] ?? null,
    }
}

const phaseForMarker = (marker: string | null): AiHistoryClearPhase =>
    parseMarker(marker)?.phase ?? null

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

export const getAiHistoryClearRequestRevision = (): string | null =>
    parseMarker(getAiHistoryClearMarker())?.startingRevision ?? null

export const hasPendingAiHistoryClear = (): boolean => {
    return getAiHistoryClearPhase() !== null
}

export const markAiHistoryClearPending = (
    startingRevision?: string,
): AiHistoryClearMarker | null => {
    try {
        if (typeof localStorage === 'undefined') return null
        const revisionSuffix = startingRevision ? `:${startingRevision}` : ''
        const marker = `1:${createMarkerId()}${revisionSuffix}`
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
        const parsed = parseMarker(expectedMarker)
        if (parsed?.phase !== 'active') return null
        const requestId = parsed.requestId ?? createMarkerId()
        const revisionSuffix = parsed.startingRevision ? `:${parsed.startingRevision}` : ''
        const recoveryMarker = `2:${requestId}${revisionSuffix}`
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
const parseSnapshot = (serialized: string): Snapshot | null => {
    try {
        const parsed: unknown = JSON.parse(serialized)
        return isRecord(parsed) && typeof parsed.version === 'number' ? parsed : null
    } catch {
        return null
    }
}

const hasClearedArchiveFields = (archives: Record<string, unknown>): boolean =>
    Array.isArray(archives.archivedMentorResponses) &&
    archives.archivedMentorResponses.length === 0 &&
    isRecord(archives.archivedAdvisorResponses) &&
    Object.keys(archives.archivedAdvisorResponses).length === 0

const hasRecognizableArchiveField = (archives: Record<string, unknown>): boolean =>
    Array.isArray(archives.archivedMentorResponses) || isRecord(archives.archivedAdvisorResponses)

const sanitizeSnapshot = (snapshot: Snapshot, archives: Record<string, unknown>): string =>
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

    const archives = snapshot.archives
    if (!isRecord(archives)) return { status: 'unrecognized' }
    if (hasClearedArchiveFields(archives)) return { status: 'clean', serialized }
    if (!hasRecognizableArchiveField(archives)) return { status: 'unrecognized' }

    return {
        status: 'sanitized',
        serialized: sanitizeSnapshot(snapshot, archives),
    }
}
