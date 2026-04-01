import { useEffect } from 'react'
import { useAlertsStore } from '@/stores/useAlertsStore'

/**
 * Syncs active (non-dismissed) smart-coach alert count to the
 * PWA Badging API so the home-screen icon shows a counter.
 */
export const useBadgeApi = (): void => {
    const alerts = useAlertsStore((s) => s.alerts)

    useEffect(() => {
        if (!('setAppBadge' in navigator)) {
            return
        }

        const activeCount = alerts.filter((a) => !a.isDismissed).length

        if (activeCount > 0) {
            navigator.setAppBadge(activeCount).catch(() => {
                /* badge permission not granted -- ignore */
            })
        } else {
            navigator.clearAppBadge().catch(() => {
                /* ignore */
            })
        }
    }, [alerts])
}
