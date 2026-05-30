import { growReminderService } from '@/services/growReminderService'

export const registerServiceWorker = (): void => {
    if (!('serviceWorker' in navigator)) {
        return
    }

    const baseUrl = import.meta.env.BASE_URL || '/'
    const scopeUrl = new URL(baseUrl, window.location.origin)
    const swUrl = new URL('sw.js', scopeUrl)

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(swUrl.pathname, { scope: scopeUrl.pathname, updateViaCache: 'none' })
            .then((registration) => {
                console.debug('ServiceWorker registration successful:', registration)
                void growReminderService.registerPeriodicSync(registration).catch((error) => {
                    console.debug('[SW] Could not register periodic reminder sync:', error)
                })

                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.addEventListener(
                        'controllerchange',
                        () => {
                            window.location.reload()
                        },
                        { once: true },
                    )
                }

                const dispatchSwUpdate = () => {
                    const event = new CustomEvent('swUpdate', { detail: registration })
                    window.dispatchEvent(event)
                }

                if (registration.waiting && navigator.serviceWorker.controller) {
                    dispatchSwUpdate()
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                dispatchSwUpdate()
                                console.debug(
                                    '[SW] New content is available and will be used when all tabs for this page are closed. Firing swUpdate event.',
                                )
                            }
                        })
                    }
                })

                const triggerUpdateCheck = () => {
                    registration.update().catch((error) => {
                        console.debug('[SW] Update check failed:', error)
                    })
                }

                triggerUpdateCheck()
                window.setInterval(triggerUpdateCheck, 5 * 60 * 1000)
                window.addEventListener('focus', triggerUpdateCheck)
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        triggerUpdateCheck()
                    }
                })
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error)
            })
    })
}
