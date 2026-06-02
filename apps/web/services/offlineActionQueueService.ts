/**
 * PWA offline action queue — read/manage IndexedDB `offline_actions` store.
 *
 * Queued actions are replayed locally by the service worker when connectivity
 * returns (see `public/sw.js`). This is separate from `offlineSyncQueueService`
 * (GitHub Gist cloud sync).
 */
import { dbService } from '@/services/dbService'

export type OfflineActionRecord = {
    id?: number
    type?: string
    idempotencyKey?: string
    queuedAt?: number
    [key: string]: unknown
}

const formatActionType = (action: OfflineActionRecord): string => {
    if (typeof action.type === 'string' && action.type.length > 0) {
        return action.type
    }
    return 'unknown'
}

export const offlineActionQueueService = {
    list: (): Promise<OfflineActionRecord[]> => dbService.listOfflineActions(),

    count: (): Promise<number> => dbService.countOfflineActions(),

    clear: (): Promise<void> => dbService.clearOfflineActions(),

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
        try {
            const registration = await navigator.serviceWorker.ready
            if ('sync' in registration) {
                await // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Background Sync API
                (registration.sync as { register: (tag: string) => Promise<void> }).register(
                    'data-sync',
                )
                return true
            }
        } catch (err) {
            console.debug('[offlineActionQueue] Background sync registration failed:', err)
        }
        return false
    },
}
