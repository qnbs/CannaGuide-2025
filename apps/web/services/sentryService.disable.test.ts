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

describe('Sentry disabled while the SDK is still loading', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1')
        vi.stubEnv('PROD', true)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('initialises when nothing disables it', async () => {
        const service = await loadService()

        service.initSentry()
        await service.Sentry.ready

        expect(sdk.init).toHaveBeenCalledOnce()
    })

    it('does not initialise when local-only mode disables it before the import finishes', async () => {
        const service = await loadService()

        service.initSentry()
        const loading = service.Sentry.ready
        service.disableSentry()
        await loading

        expect(sdk.init).not.toHaveBeenCalled()
    })

    it('can be enabled again after it was skipped while loading', async () => {
        const service = await loadService()
        service.initSentry()
        const loading = service.Sentry.ready
        service.disableSentry()
        await loading

        service.enableSentry()
        await service.Sentry.ready

        expect(sdk.init).toHaveBeenCalledOnce()
    })
})
