import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    leave: vi.fn<() => Promise<boolean>>(),
    register: vi.fn(),
    mount: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/i18n', () => ({ i18nPromise: Promise.resolve() }))
vi.mock('./serviceWorker', () => ({
    leaveDesktopServiceWorker: mocks.leave,
    registerServiceWorker: mocks.register,
}))
vi.mock('./mountHydratedApp', () => ({ mountHydratedApp: mocks.mount }))

describe('startApp', () => {
    beforeEach(() => {
        mocks.leave.mockReset()
        mocks.register.mockReset()
        mocks.mount.mockReset().mockResolvedValue(undefined)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('waits for the reload without an old worker before anything mounts (GH #931)', async () => {
        vi.useFakeTimers()
        mocks.leave.mockResolvedValue(true)
        const { DESKTOP_RELOAD_FALLBACK_MS, startApp } = await import('./index')
        const started = startApp()
        await vi.advanceTimersByTimeAsync(DESKTOP_RELOAD_FALLBACK_MS - 1)
        expect(mocks.register).not.toHaveBeenCalled()
        expect(mocks.mount).not.toHaveBeenCalled()
        // A reload that never happened must not leave the window blank.
        await vi.advanceTimersByTimeAsync(1)
        await started
        expect(mocks.register).toHaveBeenCalledTimes(1)
        expect(mocks.mount).toHaveBeenCalledTimes(1)
    })

    it('registers and mounts when no reload is needed', async () => {
        mocks.leave.mockResolvedValue(false)
        const { startApp } = await import('./index')
        await startApp()
        expect(mocks.register).toHaveBeenCalledTimes(1)
        expect(mocks.mount).toHaveBeenCalledTimes(1)
    })
})
