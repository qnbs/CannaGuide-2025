import type { RootState } from '@/stores/store'

export const AI_HISTORY_CLEAR_PENDING_KEY = 'cg.ai.clear-on-exit.pending'

export const hasPendingAiHistoryClear = (): boolean => {
    try {
        return (
            typeof localStorage !== 'undefined' &&
            localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) === '1'
        )
    } catch {
        return false
    }
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

export const clearPendingAiHistoryClear = (): boolean => {
    try {
        if (typeof localStorage === 'undefined') return false
        localStorage.removeItem(AI_HISTORY_CLEAR_PENDING_KEY)
        return localStorage.getItem(AI_HISTORY_CLEAR_PENDING_KEY) !== '1'
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

/** Clears only the two recognized archive fields; malformed recovery data is preserved. */
export const clearArchivedAiResponsesFromSnapshot = (serialized: string): SanitizedSnapshot => {
    let parsed: unknown
    try {
        parsed = JSON.parse(serialized) as unknown
    } catch {
        return { status: 'unrecognized' }
    }

    if (!isRecord(parsed) || typeof parsed.version !== 'number') {
        return { status: 'unrecognized' }
    }
    if (!Object.hasOwn(parsed, 'archives')) return { status: 'clean', serialized }

    const archives = parsed.archives
    if (
        !isRecord(archives) ||
        !Array.isArray(archives.archivedMentorResponses) ||
        !isRecord(archives.archivedAdvisorResponses)
    ) {
        return { status: 'unrecognized' }
    }

    if (
        archives.archivedMentorResponses.length === 0 &&
        Object.keys(archives.archivedAdvisorResponses).length === 0
    ) {
        return { status: 'clean', serialized }
    }

    return {
        status: 'sanitized',
        serialized: JSON.stringify({
            ...parsed,
            archives: {
                ...archives,
                archivedMentorResponses: [],
                archivedAdvisorResponses: {},
            },
        }),
    }
}
