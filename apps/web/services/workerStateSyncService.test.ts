/**
 * WorkerStateSyncService tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    registerWorkerResultHandler,
    initWorkerStateSync,
    resetWorkerStateSync,
} from './workerStateSyncService'
import { workerBus } from './workerBus'
import type { DispatchCompleteEvent } from './workerBus'

// ---------------------------------------------------------------------------
// Capture the hook that workerStateSyncService registers with workerBus
// ---------------------------------------------------------------------------

let capturedHook: ((event: DispatchCompleteEvent) => void) | undefined

vi.spyOn(workerBus, 'onDispatchComplete').mockImplementation(
    (handler: (event: DispatchCompleteEvent) => void): (() => void) => {
        capturedHook = handler
        return () => {
            capturedHook = undefined
        }
    },
)

const fireEvent = (event: Partial<DispatchCompleteEvent>) =>
    capturedHook?.({
        workerName: 'w',
        type: 'T',
        latencyMs: 10,
        success: true,
        data: undefined,
        ...event,
    } as DispatchCompleteEvent)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('workerStateSyncService -- registerWorkerResultHandler', () => {
    beforeEach(() => {
        resetWorkerStateSync()
        capturedHook = undefined
        initWorkerStateSync()
    })

    it('calls handler on matching success event', () => {
        const handler = vi.fn()
        const cleanup = registerWorkerResultHandler('vpd-sim', 'SIMULATE', handler)
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true, data: { vpd: 1.2 } })
        expect(handler).toHaveBeenCalledOnce()
        expect(handler).toHaveBeenCalledWith(
            { vpd: 1.2 },
            { workerName: 'vpd-sim', type: 'SIMULATE', latencyMs: 10 },
        )
        cleanup()
    })

    it('does not call handler on error events', () => {
        const handler = vi.fn()
        const cleanup = registerWorkerResultHandler('vpd-sim', 'SIMULATE', handler)
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: false })
        expect(handler).not.toHaveBeenCalled()
        cleanup()
    })

    it('does not call handler for different worker or type', () => {
        const handler = vi.fn()
        const cleanup = registerWorkerResultHandler('vpd-sim', 'SIMULATE', handler)
        fireEvent({ workerName: 'inference', type: 'SIMULATE', success: true })
        fireEvent({ workerName: 'vpd-sim', type: 'OTHER', success: true })
        expect(handler).not.toHaveBeenCalled()
        cleanup()
    })

    it('cleanup removes the handler', () => {
        const handler = vi.fn()
        const cleanup = registerWorkerResultHandler('vpd-sim', 'SIMULATE', handler)
        cleanup()
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true })
        expect(handler).not.toHaveBeenCalled()
    })

    it('supports multiple handlers for the same key', () => {
        const h1 = vi.fn()
        const h2 = vi.fn()
        const c1 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', h1)
        const c2 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', h2)
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true, data: 42 })
        expect(h1).toHaveBeenCalledOnce()
        expect(h2).toHaveBeenCalledOnce()
        c1()
        c2()
    })

    it('only calls matching handler after partial cleanup', () => {
        const h1 = vi.fn()
        const h2 = vi.fn()
        const c1 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', h1)
        const c2 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', h2)
        c1()
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true, data: 99 })
        expect(h1).not.toHaveBeenCalled()
        expect(h2).toHaveBeenCalledOnce()
        c2()
    })

    it('initWorkerStateSync is idempotent', () => {
        const callsBefore = (workerBus.onDispatchComplete as ReturnType<typeof vi.fn>).mock.calls.length
        initWorkerStateSync()
        initWorkerStateSync()
        // No extra subscriptions should occur after the first init
        const callsAfter = (workerBus.onDispatchComplete as ReturnType<typeof vi.fn>).mock.calls.length
        expect(callsAfter).toBe(callsBefore)
    })

    it('resetWorkerStateSync removes all handlers and unsubscribes', () => {
        const handler = vi.fn()
        registerWorkerResultHandler('vpd-sim', 'SIMULATE', handler)
        resetWorkerStateSync()
        // Re-init to get a fresh hook reference
        initWorkerStateSync()
        fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true, data: 1 })
        expect(handler).not.toHaveBeenCalled()
    })

    it('does not throw when a handler throws -- continues calling other handlers', () => {
        const bad = vi.fn(() => {
            throw new Error('handler error')
        })
        const good = vi.fn()
        const c1 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', bad)
        const c2 = registerWorkerResultHandler('vpd-sim', 'SIMULATE', good)
        expect(() =>
            fireEvent({ workerName: 'vpd-sim', type: 'SIMULATE', success: true }),
        ).not.toThrow()
        expect(good).toHaveBeenCalledOnce()
        c1()
        c2()
    })
})
