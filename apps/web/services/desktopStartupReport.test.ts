import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    platform: { isTauri: true },
    hasStoredItem: vi.fn<(name: string) => Promise<boolean>>(),
    invoke: vi.fn<(cmd: string, args?: Record<string, unknown>) => Promise<unknown>>(),
    localOnly: false,
    hydration: 'fresh' as 'snapshot' | 'backup' | 'fresh',
    idle: Promise.resolve() as Promise<void>,
}))

vi.mock('./platformService', () => ({ platform: mocks.platform }))
vi.mock('@/stores/indexedDBStorage', () => ({ hasStoredItem: mocks.hasStoredItem }))
vi.mock('./localOnlyModeService', () => ({ isLocalOnlyMode: () => mocks.localOnly }))
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@/stores/store', () => ({ getStartupHydration: () => mocks.hydration }))
vi.mock('@/bootstrap/persistenceCoordinator', () => ({ whenPersistenceIdle: () => mocks.idle }))

const load = async () => import('./desktopStartupReport')

const documentWith = (html: string): Document => {
    const doc = document.implementation.createHTMLDocument('test')
    doc.body.innerHTML = html
    return doc
}

describe('desktopStartupReport', () => {
    beforeEach(() => {
        vi.resetModules()
        mocks.platform.isTauri = true
        mocks.localOnly = false
        mocks.hydration = 'fresh'
        mocks.idle = Promise.resolve()
        mocks.hasStoredItem.mockReset().mockResolvedValue(true)
        mocks.invoke.mockReset().mockResolvedValue(undefined)
        document.body.innerHTML = '<div id="root"><main id="main-content"></main></div>'
    })

    it('tells the main view, a dialog and an empty page apart', async () => {
        const { currentStartupView } = await load()
        expect(currentStartupView(documentWith('<main id="main-content"></main>'))).toBe('app')
        // Onboarding on a first start is a Radix dialog portalled into <body>.
        expect(currentStartupView(documentWith('<div role="dialog"></div>'))).toBe('dialog')
        // The static loading placeholder from index.html is not a rendered app.
        expect(currentStartupView(documentWith('<div id="root"><div>Loading</div></div>'))).toBe(
            'none',
        )
    })

    it('builds a report without user data, and an error only by its class name', async () => {
        mocks.localOnly = true
        mocks.hydration = 'backup'
        mocks.hasStoredItem.mockResolvedValue(false)
        const { buildDesktopStartupReport } = await load()
        const doc = documentWith('<div role="dialog"></div>')
        Object.defineProperty(doc, 'visibilityState', { value: 'visible' })

        const started = await buildDesktopStartupReport('started', undefined, doc)
        expect(started).toEqual({
            outcome: 'started',
            frontendVersion: __APP_VERSION__,
            view: 'dialog',
            visible: true,
            hydration: 'backup',
            localOnly: true,
            savedSnapshotPresent: false,
            serviceWorkerControlled: false,
            serviceWorkerRegistered: false,
        })
        expect(mocks.hasStoredItem).toHaveBeenCalledWith('cannaguide-redux-storage')

        const failed = await buildDesktopStartupReport(
            'error',
            new TypeError('my grow notes, my address'),
            doc,
        )
        expect(failed.errorCode).toBe('TypeError')
        expect(JSON.stringify(failed)).not.toContain('grow notes')
    })

    it('reduces anything but a plain class name to a fixed code', async () => {
        const { errorCodeOf } = await load()
        class QuotaExceededError extends Error {
            override name = 'QuotaExceededError'
        }
        expect(errorCodeOf(new QuotaExceededError('full'))).toBe('QuotaExceededError')
        const odd = new Error('x')
        odd.name = 'Error: secret note'
        expect(errorCodeOf(odd)).toBe('UnrecognizedError')
        expect(errorCodeOf('a string')).toBe('string')
    })

    it('reports a service worker that is registered and controls the page', async () => {
        // A scope that does not cover the page still counts: the check is origin-wide.
        const getRegistrations = vi
            .fn()
            .mockResolvedValue([{ scope: 'http://tauri.localhost/other/' }])
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { controller: { state: 'activated' }, getRegistrations },
        })
        try {
            const { buildDesktopStartupReport } = await load()
            const report = await buildDesktopStartupReport('started', undefined, documentWith(''))
            expect(report.serviceWorkerControlled).toBe(true)
            expect(report.serviceWorkerRegistered).toBe(true)

            // A lookup that fails is unknown, not "none": the smoke gate must not pass on it.
            getRegistrations.mockRejectedValue(new Error('storage error'))
            const unreadable = await buildDesktopStartupReport(
                'started',
                undefined,
                documentWith(''),
            )
            expect(unreadable.serviceWorkerRegistered).toBeNull()
        } finally {
            Reflect.deleteProperty(navigator, 'serviceWorker')
        }
    })

    it('reads the registration only after the page has loaded', async () => {
        const getRegistrations = vi.fn().mockResolvedValue([])
        let readyState = 'loading'
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { controller: null, getRegistrations },
        })
        Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState })
        try {
            const { buildDesktopStartupReport } = await load()
            const pending = buildDesktopStartupReport('started', undefined, documentWith(''))
            await Promise.resolve()
            await Promise.resolve()
            // The old code registered from a load listener: reading before load could miss it.
            expect(getRegistrations).not.toHaveBeenCalled()
            readyState = 'complete'
            window.dispatchEvent(new Event('load'))
            const report = await pending
            expect(getRegistrations).toHaveBeenCalledTimes(1)
            expect(report.serviceWorkerRegistered).toBe(false)
        } finally {
            Reflect.deleteProperty(navigator, 'serviceWorker')
            Reflect.deleteProperty(document, 'readyState')
        }
    })

    it('gives a late load its own bound, so a slow start is not read as unknown', async () => {
        vi.useFakeTimers()
        const getRegistrations = vi.fn().mockResolvedValue([])
        let readyState = 'loading'
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: { controller: null, getRegistrations },
        })
        Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState })
        try {
            const { buildDesktopStartupReport, LOAD_WAIT_MS, SNAPSHOT_PROBE_MS } = await load()
            // Load fires after the 2 s probe time: the lookup still runs and answers.
            const late = buildDesktopStartupReport('started', undefined, documentWith(''))
            await vi.advanceTimersByTimeAsync(SNAPSHOT_PROBE_MS + 1000)
            readyState = 'complete'
            window.dispatchEvent(new Event('load'))
            await vi.advanceTimersByTimeAsync(0)
            expect((await late).serviceWorkerRegistered).toBe(false)

            // A page that never loads is unknown once the load bound runs out.
            readyState = 'loading'
            const never = buildDesktopStartupReport('started', undefined, documentWith(''))
            await vi.advanceTimersByTimeAsync(LOAD_WAIT_MS)
            expect((await never).serviceWorkerRegistered).toBeNull()
            expect(getRegistrations).toHaveBeenCalledTimes(1)
        } finally {
            vi.useRealTimers()
            Reflect.deleteProperty(navigator, 'serviceWorker')
            Reflect.deleteProperty(document, 'readyState')
        }
    })

    it('reports a storage that cannot be read as no saved snapshot', async () => {
        mocks.hasStoredItem.mockRejectedValue(new Error('IndexedDB unavailable'))
        const { buildDesktopStartupReport } = await load()
        const report = await buildDesktopStartupReport('started', undefined, documentWith(''))
        expect(report.savedSnapshotPresent).toBe(false)
    })

    it('waits for the startup writes and reads the outcome only then', async () => {
        vi.useFakeTimers()
        try {
            let finishWrite: () => void = () => undefined
            mocks.idle = new Promise<void>((resolve) => {
                finishWrite = resolve
            })
            let stale = false
            const { reportDesktopStartup, PAINT_WAIT_MS } = await load()
            const sent = reportDesktopStartup(() => (stale ? 'stale' : 'started'))
            // Long past the paint wait: only the pending write holds the report back.
            await vi.advanceTimersByTimeAsync(PAINT_WAIT_MS * 3)
            expect(mocks.invoke).not.toHaveBeenCalled()
            // The startup save is refused while the report waits: the page went stale.
            stale = true
            finishWrite()
            await vi.advanceTimersByTimeAsync(PAINT_WAIT_MS)
            await sent
        } finally {
            vi.useRealTimers()
        }
        expect(mocks.invoke).toHaveBeenCalledWith('frontend_ready', {
            report: expect.objectContaining({ outcome: 'stale' }),
        })
    })

    it('sends the report to the native side once per page', async () => {
        const { reportDesktopStartup } = await load()
        await reportDesktopStartup('started')
        await reportDesktopStartup('error', new Error('later'))

        expect(mocks.invoke).toHaveBeenCalledTimes(1)
        expect(mocks.invoke).toHaveBeenCalledWith('frontend_ready', {
            report: expect.objectContaining({ outcome: 'started', view: 'app' }),
        })
    })

    it('does nothing outside the desktop app', async () => {
        mocks.platform.isTauri = false
        const { reportDesktopStartup } = await load()
        await reportDesktopStartup('started')
        expect(mocks.invoke).not.toHaveBeenCalled()
        expect(mocks.hasStoredItem).not.toHaveBeenCalled()
    })

    it('reports a hidden page as not visible', async () => {
        const { buildDesktopStartupReport } = await load()
        const doc = documentWith('<main id="main-content"></main>')
        Object.defineProperty(doc, 'visibilityState', { value: 'hidden' })
        expect((await buildDesktopStartupReport('started', undefined, doc)).visible).toBe(false)
    })

    it('still reports when a hidden window never paints a frame', async () => {
        vi.useFakeTimers()
        const raf = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0)
        try {
            const { reportDesktopStartup, PAINT_WAIT_MS } = await load()
            const sent = reportDesktopStartup('started')
            await vi.advanceTimersByTimeAsync(PAINT_WAIT_MS)
            await sent
            expect(mocks.invoke).toHaveBeenCalledTimes(1)
        } finally {
            raf.mockRestore()
            vi.useRealTimers()
        }
    })

    it('never throws when the native side refuses the report', async () => {
        mocks.invoke.mockRejectedValue(new Error('command frontend_ready not found'))
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const { reportDesktopStartup } = await load()
        await expect(reportDesktopStartup('started')).resolves.toBeUndefined()
        expect(debug).toHaveBeenCalled()
        debug.mockRestore()
    })
})

describe('desktopStartupReport probe bound', () => {
    beforeEach(() => {
        vi.resetModules()
        mocks.platform.isTauri = true
        mocks.idle = Promise.resolve()
        mocks.invoke.mockReset().mockResolvedValue(undefined)
    })

    it('still reports when the snapshot probe never answers (a blocked IndexedDB open)', async () => {
        vi.useFakeTimers()
        try {
            mocks.hasStoredItem.mockReset().mockReturnValue(new Promise<boolean>(() => undefined))
            const { reportDesktopStartup, SNAPSHOT_PROBE_MS, PAINT_WAIT_MS } = await load()
            const sent = reportDesktopStartup('started')
            await vi.advanceTimersByTimeAsync(PAINT_WAIT_MS + SNAPSHOT_PROBE_MS)
            await sent
            expect(mocks.invoke).toHaveBeenCalledWith('frontend_ready', {
                report: expect.objectContaining({ savedSnapshotPresent: false }),
            })
        } finally {
            vi.useRealTimers()
        }
    })
})
