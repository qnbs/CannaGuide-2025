// ---------------------------------------------------------------------------
// useIoTToasts -- subscribes to sensorStore.toastEvents and bridges them
// to the app's notification system.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { sensorStore, type IoTToastEvent } from '@/stores/sensorStore'
import { useUIStore } from '@/stores/useUIStore'

/** Auto-dismiss delay in ms. */
const AUTO_DISMISS_MS = 8000

/**
 * Hook that watches sensorStore for new IoT toast events and dispatches
 * them as app-level notifications. Mount once in the app shell.
 */
export function useIoTToasts(): void {
    useEffect(() => {
        let lastSeenId = ''

        const unsubscribe = sensorStore.subscribe(
            (s) => s.toastEvents,
            (events) => {
                if (events.length === 0) return
                const latest = events[events.length - 1]
                if (!latest || latest.id === lastSeenId) return
                lastSeenId = latest.id

                dispatchToast(latest)

                // Auto-dismiss from sensor store
                setTimeout(() => {
                    sensorStore.getState().dismissToast(latest.id)
                }, AUTO_DISMISS_MS)
            },
        )

        return unsubscribe
    }, [])
}

function dispatchToast(event: IoTToastEvent): void {
    const addNotification = useUIStore.getState().addNotification
    if (!addNotification) return

    const variant =
        event.type === 'connection_restored'
            ? 'success'
            : event.type === 'wss_warning'
              ? 'info'
              : 'error'

    addNotification({
        message: event.message,
        type: variant,
    })
}
