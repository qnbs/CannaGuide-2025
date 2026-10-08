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

describe('service worker install does not skip waiting', () => {
    it('keeps skipWaiting on the SKIP_WAITING message only', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
        const installAt = source.indexOf("self.addEventListener('install'")
        const activateAt = source.indexOf("self.addEventListener('activate'")
        const installBody = source.slice(installAt, activateAt)

        expect(installAt).toBeGreaterThan(-1)
        expect(activateAt).toBeGreaterThan(installAt)
        expect(installBody).not.toContain('self.skipWaiting')
        expect(source.match(/self\.skipWaiting\(\)/g)).toHaveLength(1)
        expect(source).toContain("event.data.type === 'SKIP_WAITING'")
        expect(source).toContain('self.skipWaiting()')
    })
})
