import { growReminderService } from '@/services/growReminderService'
import { platform } from '@/services/platformService'

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

/** Bounds the removal, so a stuck lookup can never hold the desktop start. */
export const DESKTOP_WORKER_REMOVAL_MS = 2000
/** Set before the one reload, so a page that is still controlled afterwards starts anyway. */
export const DESKTOP_WORKER_RELOAD_FLAG = 'cg.pwa.desktopWorkerRemoved'

const unregisterAll = async (): Promise<boolean> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), DESKTOP_WORKER_REMOVAL_MS)
    })
    // Caught here, so a removal that fails after the deadline won is not left unhandled.
    const removal = (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
        return true
    })().catch((error: unknown) => {
        console.debug('[SW] Could not remove the desktop service worker:', error)
        return false
    })
    try {
        return await Promise.race([removal, deadline])
    } finally {
        clearTimeout(timer)
    }
}

/**
 * The desktop shell runs no service worker: it ships its bundle and updates through its
 * signed updater, and a worker that once took over answers a later start network-first from
 * its own context, which can end on the offline page (GH #931). This removes a registration
 * an older build left. A worker that still controls this page keeps intercepting its
 * requests after it is unregistered, so the page then reloads once, before the app starts
 * and writes anything, and comes back without it.
 * @returns true when that reload is under way and the start must stop here.
 */
export const leaveDesktopServiceWorker = async (): Promise<boolean> => {
    if (!platform.isTauri || !('serviceWorker' in navigator)) {
        return false
    }
    if (!(await unregisterAll())) {
        return false
    }
    if (navigator.serviceWorker.controller === null) {
        return false
    }
    try {
        if (sessionStorage.getItem(DESKTOP_WORKER_RELOAD_FLAG) !== null) return false
        sessionStorage.setItem(DESKTOP_WORKER_RELOAD_FLAG, '1')
    } catch {
        return false
    }
    window.location.reload()
    return true
}

export const registerServiceWorker = (): void => {
    if (!('serviceWorker' in navigator)) {
        return
    }
    // The desktop shell runs no service worker (see leaveDesktopServiceWorker).
    if (platform.isTauri) {
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
