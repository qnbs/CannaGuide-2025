import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    platform: { isTauri: true },
    hasStoredItem: vi.fn<(name: string) => Promise<boolean>>(),
    invoke: vi.fn<(cmd: string, args?: Record<string, unknown>) => Promise<unknown>>(),
    localOnly: false,
}))

vi.mock('./platformService', () => ({ platform: mocks.platform }))
vi.mock('@/stores/indexedDBStorage', () => ({ hasStoredItem: mocks.hasStoredItem }))
vi.mock('./localOnlyModeService', () => ({ isLocalOnlyMode: () => mocks.localOnly }))
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))

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

    it('builds a report without user data and bounds the error detail', async () => {
        mocks.localOnly = true
        mocks.hasStoredItem.mockResolvedValue(false)
        const { buildDesktopStartupReport } = await load()
        const doc = documentWith('<div role="dialog"></div>')

        const started = await buildDesktopStartupReport('started', undefined, doc)
        expect(started).toEqual({
            outcome: 'started',
            frontendVersion: __APP_VERSION__,
            view: 'dialog',
            localOnly: true,
            savedSnapshotPresent: false,
        })
        expect(mocks.hasStoredItem).toHaveBeenCalledWith('cannaguide-redux-storage')

        const failed = await buildDesktopStartupReport('error', new TypeError('x'.repeat(500)), doc)
        expect(failed.detail?.startsWith('TypeError: x')).toBe(true)
        expect(failed.detail).toHaveLength(300)
    })

    it('reports a storage that cannot be read as no saved snapshot', async () => {
        mocks.hasStoredItem.mockRejectedValue(new Error('IndexedDB unavailable'))
        const { buildDesktopStartupReport } = await load()
        const report = await buildDesktopStartupReport('started', undefined, documentWith(''))
        expect(report.savedSnapshotPresent).toBe(false)
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

    it('never throws when the native side refuses the report', async () => {
        mocks.invoke.mockRejectedValue(new Error('command frontend_ready not found'))
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const { reportDesktopStartup } = await load()
        await expect(reportDesktopStartup('started')).resolves.toBeUndefined()
        expect(debug).toHaveBeenCalled()
        debug.mockRestore()
    })
})
