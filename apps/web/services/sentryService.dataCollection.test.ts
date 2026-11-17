import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const initOptions = (): Record<string, unknown> => {
    expect(sdk.init).toHaveBeenCalledOnce()
    return sdk.init.mock.calls[0]?.[0] as Record<string, unknown>
}

describe('Sentry data collection (SDK v11, #834)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1')
        vi.stubEnv('PROD', true)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('turns off every v11 data collection category instead of leaving the collect-all default', async () => {
        const service = await loadService()

        service.initSentry()
        await service.Sentry.ready

        expect(initOptions().dataCollection).toEqual({
            userInfo: false,
            cookies: false,
            httpHeaders: false,
            httpBodies: [],
            urlQueryParams: false,
            graphQL: { document: false, variables: false },
            genAI: { inputs: false, outputs: false },
            mcp: { inputs: false, outputs: false },
            databaseQueryData: false,
            queues: false,
            stackFrameVariables: false,
        })
    })

    it('never opts into PII through the removed v10 switch', async () => {
        const service = await loadService()

        service.initSentry()
        await service.Sentry.ready

        expect(initOptions()).not.toHaveProperty('sendDefaultPii')
    })
})

describe('Sentry package versions', () => {
    it('keeps @sentry/browser and @sentry/react on the same major', () => {
        // Two majors mean two SDK copies with separate global carriers: calls through
        // the copy that was never initialised are dropped without an error (#834).
        const manifest = JSON.parse(
            readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
        ) as { dependencies: Record<string, string> }
        const major = (name: string): string | undefined =>
            manifest.dependencies[name]?.match(/\d+/)?.[0]

        expect(major('@sentry/browser')).toBeDefined()
        expect(major('@sentry/browser')).toBe(major('@sentry/react'))
    })
})
