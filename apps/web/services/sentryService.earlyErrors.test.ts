import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// GH #586: error reporting must not start before the saved Local-Only setting is known.
// Until hydration the SDK is not loaded; uncaught errors are only remembered in memory,
// then sent (Local-Only off) or dropped (Local-Only on).

const sdk = vi.hoisted(() => ({
    init: vi.fn(),
    close: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    browserTracingIntegration: vi.fn(),
    replayIntegration: vi.fn(),
}))

vi.mock('@sentry/react', () => sdk)

const loadService = () => {
    vi.resetModules()
    return import('./sentryService')
}

const uncaught = (error: Error): void => {
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }))
}

describe('error reporting before the saved Local-Only setting is known', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1')
        vi.stubEnv('PROD', true)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('the bootstrap step itself starts no SDK (before GH #586 it called initSentry)', async () => {
        vi.resetModules()
        const { initBootstrapSentry } = await import('../bootstrap/sentry')
        const service = await import('./sentryService')

        initBootstrapSentry()
        await service.Sentry.ready

        expect(sdk.init).not.toHaveBeenCalled()
    })

    it('starts no SDK at bootstrap, even when errors happen', async () => {
        const service = await loadService()

        service.captureEarlyErrors()
        uncaught(new Error('during startup'))
        service.Sentry.captureException(new Error('reported during startup'))
        await service.Sentry.ready

        expect(sdk.init).not.toHaveBeenCalled()
        expect(sdk.captureException).not.toHaveBeenCalled()
    })

    it('with Local-Only saved, never starts and drops what it remembered', async () => {
        const service = await loadService()

        service.captureEarlyErrors()
        uncaught(new Error('during startup'))
        service.resolveSentryAfterHydration(true)
        uncaught(new Error('after hydration'))
        service.Sentry.captureException(new Error('after hydration, explicit'))
        await service.Sentry.ready

        expect(sdk.init).not.toHaveBeenCalled()
        expect(sdk.captureException).not.toHaveBeenCalled()
    })

    it('with Local-Only off, starts after hydration and sends the startup errors', async () => {
        const service = await loadService()
        const early = new Error('during startup')
        const explicit = new Error('reported during startup')

        service.captureEarlyErrors()
        uncaught(early)
        service.Sentry.captureException(explicit)
        service.resolveSentryAfterHydration(false)
        await service.Sentry.ready
        await Promise.resolve()

        expect(sdk.init).toHaveBeenCalledOnce()
        expect(sdk.captureException).toHaveBeenCalledWith(early, undefined)
        expect(sdk.captureException).toHaveBeenCalledWith(explicit, undefined)
    })

    it('stops listening once settled, and remembers at most 20 startup errors', async () => {
        const service = await loadService()

        service.captureEarlyErrors()
        for (let i = 0; i < 25; i += 1) uncaught(new Error(`startup ${i}`))
        service.resolveSentryAfterHydration(false)
        await service.Sentry.ready
        await Promise.resolve()
        uncaught(new Error('after settling: left to the SDK, not to the early capture'))

        expect(sdk.captureException).toHaveBeenCalledTimes(20)
    })

    it('a later switch off and on again still works after a Local-Only start', async () => {
        const service = await loadService()

        service.captureEarlyErrors()
        service.resolveSentryAfterHydration(true)
        service.enableSentry()
        await service.Sentry.ready

        expect(sdk.init).toHaveBeenCalledOnce()
    })
})
