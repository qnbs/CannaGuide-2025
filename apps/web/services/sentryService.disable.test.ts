import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({
    init: vi.fn(),
    close: vi.fn(),
    browserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}))

vi.mock('@sentry/react', () => sdk)

const loadService = async () => {
    vi.resetModules()
    return import('./sentryService')
}

const afterSdkImport = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

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
        await afterSdkImport()

        expect(sdk.init).toHaveBeenCalledOnce()
    })

    it('does not initialise when local-only mode disables it before the import finishes', async () => {
        const service = await loadService()

        service.initSentry()
        service.disableSentry()
        await afterSdkImport()

        expect(sdk.init).not.toHaveBeenCalled()
    })
})
