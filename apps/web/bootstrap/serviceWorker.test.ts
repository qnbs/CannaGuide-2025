import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/growReminderService', () => ({
    growReminderService: {
        registerPeriodicSync: vi.fn().mockResolvedValue(undefined),
    },
}))

type Listener = (event: Event) => void

class FakeWorker extends EventTarget {
    state = 'installing'
    postMessage = vi.fn()

    becomeInstalled(): void {
        this.state = 'installed'
        this.dispatchEvent(new Event('statechange'))
    }
}

const loadServiceWorker = async () => {
    vi.resetModules()
    return import('./serviceWorker')
}

const flush = async () => {
    await Promise.resolve()
    await Promise.resolve()
}

describe('registerServiceWorker update order', () => {
    const listeners = new Map<string, Listener[]>()
    const windowListeners: Array<{ type: string; listener: EventListener }> = []
    const reload = vi.fn()
    const realAdd = window.addEventListener.bind(window)
    const realRemove = window.removeEventListener.bind(window)

    afterEach(() => {
        for (const entry of windowListeners) {
            realRemove(entry.type, entry.listener)
        }
        windowListeners.length = 0
        vi.useRealTimers()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        listeners.clear()
        reload.mockReset()
    })

    const installNavigator = (controller: ServiceWorker | null, worker: FakeWorker) => {
        listeners.clear()
        const registration: {
            installing: FakeWorker | null
            waiting: ServiceWorker | null
            active: null
            scope: string
            update: ReturnType<typeof vi.fn>
            addEventListener: ReturnType<typeof vi.fn>
        } = {
            installing: worker,
            waiting: null,
            active: null,
            scope: 'http://localhost/',
            update: vi.fn().mockResolvedValue(undefined),
            addEventListener: vi.fn(),
        }
        const serviceWorker = {
            controller,
            register: vi.fn().mockResolvedValue(registration),
            addEventListener: vi.fn((type: string, listener: Listener) => {
                const bucket = listeners.get(type) ?? []
                bucket.push(listener)
                listeners.set(type, bucket)
            }),
        }
        vi.stubGlobal('navigator', { serviceWorker })
        vi.spyOn(window, 'setInterval').mockReturnValue(
            0 as unknown as ReturnType<typeof setInterval>,
        )
        vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
            windowListeners.push({ type: String(type), listener: listener as EventListener })
            realAdd(type, listener, options)
        })
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { origin: 'http://localhost', reload },
        })
        return { registration, serviceWorker }
    }

    it('leaves an update waiting and reloads only after the user accepts it', async () => {
        const worker = new FakeWorker()
        const controller = new FakeWorker()
        const { serviceWorker } = installNavigator(controller as unknown as ServiceWorker, worker)
        const { registerServiceWorker } = await loadServiceWorker()

        const updates: Event[] = []
        window.addEventListener('swUpdate', (event) => {
            updates.push(event)
        })

        registerServiceWorker()
        window.dispatchEvent(new Event('load'))
        await flush()

        worker.becomeInstalled()

        expect(updates).toHaveLength(1)
        expect(worker.postMessage).not.toHaveBeenCalled()
        expect(reload).not.toHaveBeenCalled()

        const controllerListeners = listeners.get('controllerchange') ?? []
        expect(controllerListeners).toHaveLength(1)
        controllerListeners[0]?.(new Event('controllerchange'))
        expect(reload).toHaveBeenCalledTimes(1)

        expect(serviceWorker.register).toHaveBeenCalled()
    })

    it('activates the first install without reloading the page', async () => {
        const worker = new FakeWorker()
        installNavigator(null, worker)
        const { registerServiceWorker } = await loadServiceWorker()

        const updates: Event[] = []
        window.addEventListener('swUpdate', (event) => {
            updates.push(event)
        })

        registerServiceWorker()
        window.dispatchEvent(new Event('load'))
        await flush()

        worker.becomeInstalled()

        expect(worker.postMessage).toHaveBeenCalledTimes(1)
        expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
        expect(reload).not.toHaveBeenCalled()
        expect(updates).toHaveLength(0)
        expect(listeners.get('controllerchange') ?? []).toHaveLength(0)
    })

    it('keeps a waiting update for a late subscriber and accepts it with SKIP_WAITING', async () => {
        const worker = new FakeWorker()
        const controller = new FakeWorker()
        const { registration } = installNavigator(controller as unknown as ServiceWorker, worker)
        const { registerServiceWorker, readPendingServiceWorkerUpdate, acceptServiceWorkerUpdate } =
            await loadServiceWorker()

        registerServiceWorker()
        window.dispatchEvent(new Event('load'))
        await flush()

        registration.waiting = worker as unknown as ServiceWorker
        worker.becomeInstalled()

        const lateUpdates: Event[] = []
        window.addEventListener('swUpdate', (event) => {
            lateUpdates.push(event)
        })

        const pending = readPendingServiceWorkerUpdate()
        expect(pending?.waiting).toBe(worker)
        expect(lateUpdates).toHaveLength(0)
        expect(reload).not.toHaveBeenCalled()

        expect(acceptServiceWorkerUpdate(pending?.waiting ?? null)).toBe(true)
        expect(worker.postMessage).toHaveBeenCalledTimes(1)
        expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
        expect(acceptServiceWorkerUpdate(null)).toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })
})

describe('the desktop shell runs no service worker (GH #931)', () => {
    afterEach(() => {
        vi.doUnmock('@/services/platformService')
        vi.unstubAllGlobals()
    })

    const desktopNavigator = (controller: unknown, registrations: unknown[] = []) => {
        const serviceWorker = {
            controller,
            register: vi.fn(),
            getRegistrations: vi.fn().mockResolvedValue(registrations),
            addEventListener: vi.fn(),
        }
        vi.stubGlobal('navigator', { serviceWorker })
        return serviceWorker
    }

    const loadDesktop = async (isTauri = true) => {
        vi.resetModules()
        vi.doMock('@/services/platformService', () => ({ platform: { isTauri } }))
        return import('./serviceWorker')
    }

    const stubReload = () => {
        const reload = vi.fn()
        Object.defineProperty(window, 'location', { configurable: true, value: { reload } })
        return reload
    }

    it('registers nothing under Tauri', async () => {
        const serviceWorker = desktopNavigator(null)
        const { registerServiceWorker } = await loadDesktop()

        registerServiceWorker()
        window.dispatchEvent(new Event('load'))
        await flush()

        expect(serviceWorker.register).not.toHaveBeenCalled()
    })

    it("removes an older build's registrations and starts when none controls the page", async () => {
        const unregister = vi.fn().mockResolvedValue(true)
        const serviceWorker = desktopNavigator(null, [{ unregister }, { unregister }])
        const reload = stubReload()
        const { leaveDesktopServiceWorker } = await loadDesktop()

        await expect(leaveDesktopServiceWorker()).resolves.toBe(false)
        expect(serviceWorker.getRegistrations).toHaveBeenCalledTimes(1)
        expect(unregister).toHaveBeenCalledTimes(2)
        expect(reload).not.toHaveBeenCalled()
    })

    it('reloads once when an older worker still controls the page', async () => {
        sessionStorage.clear()
        const unregister = vi.fn().mockResolvedValue(true)
        desktopNavigator({ state: 'activated' }, [{ unregister }])
        const reload = stubReload()
        const { leaveDesktopServiceWorker, DESKTOP_WORKER_RELOAD_FLAG } = await loadDesktop()

        await expect(leaveDesktopServiceWorker()).resolves.toBe(true)
        expect(reload).toHaveBeenCalledTimes(1)
        expect(sessionStorage.getItem(DESKTOP_WORKER_RELOAD_FLAG)).toBe('1')

        // Still controlled after that reload: start anyway rather than loop.
        await expect(leaveDesktopServiceWorker()).resolves.toBe(false)
        expect(reload).toHaveBeenCalledTimes(1)
        sessionStorage.clear()
    })

    it('starts when the removal fails or never answers', async () => {
        const reload = stubReload()
        const serviceWorker = desktopNavigator({ state: 'activated' })
        serviceWorker.getRegistrations.mockRejectedValue(new Error('storage error'))
        const { leaveDesktopServiceWorker, DESKTOP_WORKER_REMOVAL_MS } = await loadDesktop()
        await expect(leaveDesktopServiceWorker()).resolves.toBe(false)

        vi.useFakeTimers()
        serviceWorker.getRegistrations.mockReturnValue(new Promise(() => undefined))
        const pending = leaveDesktopServiceWorker()
        await vi.advanceTimersByTimeAsync(DESKTOP_WORKER_REMOVAL_MS)
        await expect(pending).resolves.toBe(false)
        expect(reload).not.toHaveBeenCalled()
    })

    it('does nothing outside the desktop shell', async () => {
        const serviceWorker = desktopNavigator({ state: 'activated' })
        const { leaveDesktopServiceWorker } = await loadDesktop(false)

        await expect(leaveDesktopServiceWorker()).resolves.toBe(false)
        expect(serviceWorker.getRegistrations).not.toHaveBeenCalled()
    })

    it('stands the worker down when it runs inside the shell', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
        expect(source).toContain(
            "const IS_DESKTOP_SHELL = self.location.hostname === 'tauri.localhost'",
        )
        for (const event of ['install', 'activate', 'fetch']) {
            const at = source.indexOf(`self.addEventListener('${event}'`)
            expect(at, event).toBeGreaterThan(-1)
            // The shell guard is the first statement of each handler.
            expect(source.slice(at, at + 120), event).toMatch(/=> \{\s+if \(IS_DESKTOP_SHELL\) \{/)
        }
        const activateAt = source.indexOf("self.addEventListener('activate'")
        expect(source.slice(activateAt, activateAt + 200)).toContain(
            'event.waitUntil(self.registration.unregister())',
        )
    })
})

describe('service worker install does not skip waiting', () => {
    it('keeps the web install waiting; only the desktop shell and SKIP_WAITING skip it', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
        const installAt = source.indexOf("self.addEventListener('install'")
        const activateAt = source.indexOf("self.addEventListener('activate'")
        const installBody = source.slice(installAt, activateAt)
        const desktopGuard =
            /if \(IS_DESKTOP_SHELL\) \{[\s\S]*?\n {4}\}\n/.exec(installBody)?.[0] ?? ''

        expect(installAt).toBeGreaterThan(-1)
        expect(activateAt).toBeGreaterThan(installAt)
        // The desktop shell stands down at once; the web path waits for the user.
        expect(desktopGuard).toContain('self.skipWaiting()')
        expect(installBody.replace(desktopGuard, '')).not.toContain('self.skipWaiting')
        expect(source.match(/self\.skipWaiting\(\)/g)).toHaveLength(2)
        expect(source).toContain("event.data.type === 'SKIP_WAITING'")
    })
})
