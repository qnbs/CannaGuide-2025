import { growReminderService } from '@/services/growReminderService'

const postSkipWaiting = (worker: ServiceWorker): void => {
    worker.postMessage({ type: 'SKIP_WAITING' })
}

let pendingUpdate: ServiceWorkerRegistration | null = null

/** The latest update that is still waiting. Survives a listener that mounts later. */
export const readPendingServiceWorkerUpdate = (): ServiceWorkerRegistration | null => {
    if (!pendingUpdate?.waiting) {
        pendingUpdate = null
        return null
    }
    return pendingUpdate
}

/** User accepted the prompt. Posts SKIP_WAITING to the waiting worker only. */
export const acceptServiceWorkerUpdate = (waiting: ServiceWorker | null): boolean => {
    if (!waiting) {
        return false
    }
    postSkipWaiting(waiting)
    return true
}

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

                // controllerchange means a client already posted SKIP_WAITING.
                // A worker that is only installed does not reach this listener.
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.addEventListener(
                        'controllerchange',
                        () => {
                            window.location.reload()
                        },
                        { once: true },
                    )
                }

                const watched = new WeakSet<ServiceWorker>()
                const watchInstalled = (worker: ServiceWorker | null): void => {
                    if (!worker || watched.has(worker)) {
                        return
                    }
                    watched.add(worker)

                    const onInstalled = (): void => {
                        if (worker.state !== 'installed') {
                            return
                        }
                        // First visit: take control so offline works without a
                        // second load. An update stays waiting for the prompt.
                        if (!navigator.serviceWorker.controller) {
                            postSkipWaiting(worker)
                            return
                        }
                        pendingUpdate = registration
                        window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }))
                        console.debug(
                            '[SW] Update is waiting. The page reloads after the user accepts it.',
                        )
                    }

                    if (worker.state === 'installed') {
                        onInstalled()
                        return
                    }
                    worker.addEventListener('statechange', onInstalled)
                }

                watchInstalled(registration.installing ?? registration.waiting)
                registration.addEventListener('updatefound', () => {
                    watchInstalled(registration.installing)
                })

                const triggerUpdateCheck = (): void => {
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
