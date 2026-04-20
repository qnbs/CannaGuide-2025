import { describe, expect, it, vi, beforeEach } from 'vitest'
import { initWorkerTelemetry, resetWorkerTelemetry } from './workerTelemetryService'

// Mock workerBus
vi.mock('./workerBus', () => {
    let listeners: Array<(event: unknown) => void> = []
    return {
        workerBus: {
            onDispatchComplete: vi.fn((cb: (event: unknown) => void) => {
                listeners.push(cb)
            }),
            getMetrics: vi.fn(() => ({})),
            getPoolMetrics: vi.fn(() => ({})),
            exportTelemetry: vi.fn(() => ({})),
            _getListeners: () => listeners,
            _clearListeners: () => { listeners = [] },
        },
    }
})

// Mock Sentry
vi.mock('@sentry/browser', () => ({
    captureMessage: vi.fn(),
    setContext: vi.fn(),
}))

// Mock the store slice action
vi.mock('../stores/slices/workerMetricsSlice', () => ({
    updateWorkerMetrics: vi.fn((payload: unknown) => ({ type: 'workerMetrics/update', payload })),
}))

describe('workerTelemetryService', () => {
    const mockDispatch = vi.fn()

    beforeEach(async () => {
        vi.clearAllMocks()
        resetWorkerTelemetry()
        const { workerBus: bus } = await import('./workerBus')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = bus as any
        b._clearListeners?.()
    })

    it('registers dispatch-complete listener', async () => {
        const { workerBus: bus } = await import('./workerBus')
        initWorkerTelemetry(mockDispatch)
        expect(bus.onDispatchComplete).toHaveBeenCalledOnce()
    })

    it('is idempotent (calling twice does not double-subscribe)', async () => {
        const { workerBus: bus } = await import('./workerBus')
        initWorkerTelemetry(mockDispatch)
        initWorkerTelemetry(mockDispatch)
        expect(bus.onDispatchComplete).toHaveBeenCalledOnce()
    })

    it('dispatches metrics immediately on error events', async () => {
        const { workerBus: bus } = await import('./workerBus')
        initWorkerTelemetry(mockDispatch)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listeners = (bus as any)._getListeners() as Array<(event: unknown) => void>
        expect(listeners.length).toBeGreaterThan(0)

        listeners[0]?.({ success: false, workerName: 'testWorker' })
        expect(mockDispatch).toHaveBeenCalled()
    })

    it('resets properly', () => {
        initWorkerTelemetry(mockDispatch)
        expect(() => resetWorkerTelemetry()).not.toThrow()
    })
})
