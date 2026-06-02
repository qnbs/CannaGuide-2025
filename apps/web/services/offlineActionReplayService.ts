/**
 * Registers service-worker → client replay for queued offline actions.
 */
import type { AppStore } from '@/stores/store'
import {
    OFFLINE_ACTION_TYPES,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION,
} from '@/constants/offlineActions'
import type { JournalEntry } from '@/types'
import { applyQueuedJournalEntry } from '@/stores/slices/simulationSlice'
import type { OfflineActionRecord } from '@/services/offlineActionQueueService'

export type QueuedJournalEntryAction = {
    type: typeof OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY
    plantId: string
    entry: JournalEntry
    idempotencyKey: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

const isJournalEntry = (value: unknown): value is JournalEntry => {
    if (!isRecord(value)) return false
    return typeof value.id === 'string' && typeof value.createdAt === 'number'
}

const isOfflineActionRecord = (value: unknown): value is OfflineActionRecord =>
    isRecord(value) && typeof value.type === 'string'

const parseSwReplayPayload = (data: unknown): OfflineActionRecord | null => {
    if (!isRecord(data)) return null
    if (data.type !== SW_MESSAGE_REPLAY_OFFLINE_ACTION) return null
    const payload = data.payload
    return isOfflineActionRecord(payload) ? payload : null
}

const parseQueuedJournalAction = (raw: OfflineActionRecord): QueuedJournalEntryAction | null => {
    if (raw.type !== OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY) return null
    if (typeof raw.plantId !== 'string') return null
    if (!isJournalEntry(raw.entry)) return null
    const idempotencyKey =
        typeof raw.idempotencyKey === 'string'
            ? raw.idempotencyKey
            : `journal-entry-${raw.plantId}-${raw.entry.id}`
    return {
        type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
        plantId: raw.plantId,
        entry: raw.entry,
        idempotencyKey,
    }
}

export const replayOfflineAction = (store: AppStore, raw: OfflineActionRecord): boolean => {
    const journalAction = parseQueuedJournalAction(raw)
    if (!journalAction) {
        console.debug('[offlineReplay] Unsupported action type:', raw.type)
        return false
    }

    store.dispatch(
        applyQueuedJournalEntry({
            plantId: journalAction.plantId,
            entry: journalAction.entry,
        }),
    )
    return true
}

let unregisterMessageListener: (() => void) | null = null

export const registerOfflineActionReplayListener = (store: AppStore): (() => void) => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
        return () => undefined
    }

    unregisterMessageListener?.()

    const handler = (event: MessageEvent): void => {
        const payload = parseSwReplayPayload(event.data)
        if (!payload) return
        replayOfflineAction(store, payload)
    }

    navigator.serviceWorker.addEventListener('message', handler)
    unregisterMessageListener = () => {
        navigator.serviceWorker.removeEventListener('message', handler)
    }

    return unregisterMessageListener
}
