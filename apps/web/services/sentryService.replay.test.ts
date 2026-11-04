import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
    init: vi.fn(),
    close: vi.fn(),
    browserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}))

vi.mock('@sentry/react', () => sdk)

const loadService = () => {
    vi.resetModules()
    return import('./sentryService')
}

describe('Sentry Replay privacy (GH #586)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1')
        vi.stubEnv('PROD', true)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('masks all text and inputs and blocks all media in replays', async () => {
        const service = await loadService()

        service.initSentry()
        await service.Sentry.ready

        expect(sdk.replayIntegration).toHaveBeenCalledOnce()
        expect(sdk.replayIntegration).toHaveBeenCalledWith(
            expect.objectContaining({
                maskAllText: true,
                maskAllInputs: true,
                blockAllMedia: true,
            }),
        )
    })

    it('never configures an unmasked replay', async () => {
        const service = await loadService()

        service.initSentry()
        await service.Sentry.ready

        for (const [options] of sdk.replayIntegration.mock.calls) {
            expect(options).not.toMatchObject({ maskAllText: false })
            expect(options).not.toMatchObject({ maskAllInputs: false })
            expect(options).not.toMatchObject({ blockAllMedia: false })
        }
    })

    it('stops the running SDK, and with it the replay, when Local-Only Mode is applied after start', async () => {
        // Production order: Sentry starts first, the persisted Local-Only Mode is
        // applied once the store has hydrated.
        const service = await loadService()
        service.initSentry()
        await service.Sentry.ready
        expect(sdk.init).toHaveBeenCalledOnce()

        service.disableSentry()

        expect(sdk.close).toHaveBeenCalledOnce()
    })

    it('starts no replay at all when Local-Only Mode is on before start', async () => {
        const service = await loadService()

        service.disableSentry()
        service.initSentry()
        await service.Sentry.ready

        expect(sdk.init).not.toHaveBeenCalled()
        expect(sdk.replayIntegration).not.toHaveBeenCalled()
    })
})
