import { syncService } from '@/services/syncService'
import { useUIStore } from '@/stores/useUIStore'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000

class OfflineSyncQueueService {
    private retryCount = 0
    private retryTimer: ReturnType<typeof setTimeout> | null = null
    private onlineHandler: (() => void) | null = null
    private gistId: string | null = null
    private encryptionKey: string | null = null

    /**
     * Queue a push sync for when the device comes back online.
     * If already online, attempts immediately.
     * Max 3 retries with exponential backoff (2s, 4s, 8s).
     */
    queueSyncWhenOnline(gistId: string | null, encryptionKeyBase64: string | null): void {
        this.gistId = gistId
        this.encryptionKey = encryptionKeyBase64
        this.retryCount = 0

        const ui = useUIStore.getState()
        ui.setSyncPendingRetries(MAX_RETRIES)

        if (navigator.onLine) {
            void this.attemptPush()
            return
        }

        // Wait for network to come back
        this.cleanupListener()
        this.onlineHandler = () => {
            this.cleanupListener()
            void this.attemptPush()
        }
        globalThis.addEventListener('online', this.onlineHandler)
    }

    /** Cancel any pending retries and clean up listeners. */
    cancelPending(): void {
        this.cleanupListener()
        if (this.retryTimer !== null) {
            clearTimeout(this.retryTimer)
            this.retryTimer = null
        }
        this.retryCount = 0
        const ui = useUIStore.getState()
        ui.setSyncPendingRetries(0)
    }

    /** Whether there is a queued sync waiting to execute. */
    hasPendingSync(): boolean {
        return this.retryCount > 0 || this.onlineHandler !== null
    }

    private async attemptPush(): Promise<void> {
        const ui = useUIStore.getState()

        try {
            this.retryCount++
            ui.setSyncPendingRetries(Math.max(0, MAX_RETRIES - this.retryCount))
            ui.setSyncStatus('syncing')

            const result = await syncService.pushToGist(this.gistId, this.encryptionKey)

            // Success
            ui.setSyncStatus('synced')
            ui.setSyncLastSyncAt(result.syncedAt)
            ui.setSyncPendingRetries(0)
            this.retryCount = 0
        } catch {
            if (this.retryCount >= MAX_RETRIES) {
                ui.setSyncStatus('error', 'Sync failed after retries')
                ui.setSyncPendingRetries(0)
                this.retryCount = 0
                return
            }

            // Exponential backoff: 2s, 4s, 8s
            const delay = BASE_DELAY_MS * Math.pow(2, this.retryCount - 1)
            this.retryTimer = setTimeout(() => {
                this.retryTimer = null
                void this.attemptPush()
            }, delay)
        }
    }

    private cleanupListener(): void {
        if (this.onlineHandler) {
            globalThis.removeEventListener('online', this.onlineHandler)
            this.onlineHandler = null
        }
    }
}

export const offlineSyncQueueService = new OfflineSyncQueueService()
