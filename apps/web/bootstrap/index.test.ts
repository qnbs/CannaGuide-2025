import { beforeEach, describe, expect, it, vi } from 'vitest'

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

    it('stops before the app mounts while the page reloads without an old worker (GH #931)', async () => {
        mocks.leave.mockResolvedValue(true)
        const { startApp } = await import('./index')
        await startApp()
        expect(mocks.register).not.toHaveBeenCalled()
        expect(mocks.mount).not.toHaveBeenCalled()
    })

    it('registers and mounts when no reload is needed', async () => {
        mocks.leave.mockResolvedValue(false)
        const { startApp } = await import('./index')
        await startApp()
        expect(mocks.register).toHaveBeenCalledTimes(1)
        expect(mocks.mount).toHaveBeenCalledTimes(1)
    })
})
