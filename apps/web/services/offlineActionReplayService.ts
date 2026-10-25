/**
 * Registers service-worker → client replay for queued offline actions.
 */
import type { AppStore } from '@/stores/store'
import {
    OFFLINE_ACTION_TYPES,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION_ACK,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION_PROBE,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION_READY_ACK,
} from '@/constants/offlineActions'
import type { JournalEntry } from '@/types'
import { applyQueuedJournalEntry } from '@/stores/slices/simulationSlice'
import type { OfflineActionRecord } from '@/services/offlineActionQueueService'
import type { FlushPersistedState } from '@/bootstrap/persistence'

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

    const plant = store.getState().simulation.plants.entities[journalAction.plantId]
    if (!plant) {
        console.debug(
            '[offlineReplay] Plant is missing; keep the queued action:',
            journalAction.plantId,
        )
        return false
    }
    if (plant.journal.some((entry) => entry.id === journalAction.entry.id)) return true

    store.dispatch(
        applyQueuedJournalEntry({
            plantId: journalAction.plantId,
            entry: journalAction.entry,
        }),
    )
    return true
}

let unregisterMessageListener: (() => void) | null = null

export const registerOfflineActionReplayListener = (
    store: AppStore,
    flushPersistedState?: FlushPersistedState,
): (() => void) => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
        return () => undefined
    }

    unregisterMessageListener?.()

    const handler = async (event: MessageEvent): Promise<void> => {
        const message = event.data
        const queueId = isRecord(message) ? message.queueId : undefined
        const replyPort = event.ports[0]
        if (isRecord(message) && message.type === SW_MESSAGE_REPLAY_OFFLINE_ACTION_PROBE) {
            if (!Number.isSafeInteger(queueId) || !replyPort || !flushPersistedState) {
                replyPort?.close()
                return
            }
            try {
                replyPort.postMessage({
                    type: SW_MESSAGE_REPLAY_OFFLINE_ACTION_READY_ACK,
                    queueId,
                    ready: true,
                })
            } catch (error) {
                console.debug(
                    '[offlineReplay] Sending the readiness acknowledgement failed:',
                    error,
                )
            } finally {
                replyPort.close()
            }
            return
        }

        const payload = parseSwReplayPayload(message)
        if (!payload) {
            replyPort?.close()
            return
        }
        if (!replyPort) {
            replayOfflineAction(store, payload)
            return
        }
        if (!Number.isSafeInteger(queueId) || !flushPersistedState) {
            replyPort.close()
            return
        }

        const acknowledge = (persisted: boolean, rejected = false): void => {
            try {
                replyPort.postMessage({
                    type: SW_MESSAGE_REPLAY_OFFLINE_ACTION_ACK,
                    queueId,
                    persisted,
                    ...(rejected ? { rejected: true } : {}),
                })
            } catch (error) {
                console.debug('[offlineReplay] Sending the replay acknowledgement failed:', error)
            } finally {
                replyPort.close()
            }
        }
        if (!replayOfflineAction(store, payload)) {
            acknowledge(false, true)
            return
        }

        try {
            acknowledge(await flushPersistedState())
        } catch (error) {
            console.debug('[offlineReplay] Persisting the replayed action failed:', error)
            acknowledge(false)
        }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    unregisterMessageListener = () => {
        navigator.serviceWorker.removeEventListener('message', handler)
    }

    return unregisterMessageListener
}
