/**
 * PWA offline action queue — read/manage IndexedDB `offline_actions` store.
 *
 * Queued actions are replayed locally by the service worker when connectivity
 * returns (see `public/sw.js`). This is separate from `offlineSyncQueueService`
 * (GitHub Gist cloud sync).
 */
import { OFFLINE_ACTION_TYPES } from '@/constants/offlineActions'
import { dbService } from '@/services/dbService'
import { platform } from '@/services/platformService'
import type { JournalEntry } from '@/types'

export type OfflineActionRecord = {
    id?: number
    type?: string
    idempotencyKey?: string
    queuedAt?: number
    [key: string]: unknown
}

/**
 * How long a sync request waits for an active service worker. `ready` never settles when no
 * worker registers -- a failed registration, or the desktop shell, which runs none (GH #931).
 */
export const SERVICE_WORKER_READY_MS = 5000

const readyWithin = async (ms: number): Promise<ServiceWorkerRegistration | undefined> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), ms)
    })
    try {
        return await Promise.race([navigator.serviceWorker.ready, deadline])
    } finally {
        clearTimeout(timer)
    }
}

/**
 * One late registration is enough: the sync tag coalesces, so a second waiter would only
 * stack another pending continuation for every action queued while no worker is active.
 */
let lateSyncScheduled = false

const registerDataSync = async (registration: ServiceWorkerRegistration): Promise<boolean> => {
    if (!('sync' in registration)) return false
    await // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Background Sync API
    (registration.sync as { register: (tag: string) => Promise<void> }).register('data-sync')
    return true
}

const formatActionType = (action: OfflineActionRecord): string => {
    if (action.type === OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY) {
        return 'journalEntry'
    }
    if (typeof action.type === 'string' && action.type.length > 0) {
        return action.type
    }
    return 'unknown'
}

export const buildJournalEntryIdempotencyKey = (plantId: string, entryId: string): string =>
    `journal-entry-${plantId}-${entryId}`

export const offlineActionQueueService = {
    list: (): Promise<OfflineActionRecord[]> => dbService.listOfflineActions(),

    count: (): Promise<number> => dbService.countOfflineActions(),

    clear: (): Promise<void> => dbService.clearOfflineActions(),

    queueJournalEntry: async (plantId: string, entry: JournalEntry): Promise<void> => {
        await dbService.addOfflineAction({
            type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
            plantId,
            entry,
            idempotencyKey: buildJournalEntryIdempotencyKey(plantId, entry.id),
            queuedAt: Date.now(),
        })
    },

    /** Human-readable label for settings UI (action `type` field). */
    describeAction: (action: OfflineActionRecord): string => formatActionType(action),

    /**
     * Registers a Background Sync replay when the API is available.
     * No-op when offline sync is unsupported.
     */
    requestBackgroundSync: async (): Promise<boolean> => {
        if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
            return false
        }
        // The desktop shell runs no service worker, so there is nothing to replay the queue.
        if (platform.isTauri) {
            return false
        }
        try {
            const registration = await readyWithin(SERVICE_WORKER_READY_MS)
            if (registration === undefined) {
                // The caller hears "unavailable" now, but a worker that becomes ready later
                // still gets the replay scheduled, so the queued entry is not stranded.
                if (!lateSyncScheduled) {
                    lateSyncScheduled = true
                    void navigator.serviceWorker.ready
                        .then(registerDataSync)
                        .catch((err: unknown) => {
                            console.debug(
                                '[offlineActionQueue] Late background sync registration failed:',
                                err,
                            )
                        })
                        .finally(() => {
                            lateSyncScheduled = false
                        })
                }
                return false
            }
            return await registerDataSync(registration)
        } catch (err) {
            console.debug('[offlineActionQueue] Background sync registration failed:', err)
        }
        return false
    },
}
