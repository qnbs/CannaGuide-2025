/**
 * WorkerBus Load Test -- concurrent dispatch, priority ordering, backpressure.
 *
 * Runs with the regular test suite (no separate CI gate needed).
 * Uses mock workers that auto-respond to simulate high concurrency.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal Worker mock
// ---------------------------------------------------------------------------

type MsgHandler = (event: MessageEvent) => void

class MockWorker {
    private messageHandlers: MsgHandler[] = []
    terminated = false
    /** Simulated response delay in ms. */
    private responseDelay: number

    constructor(responseDelay = 0) {
        this.responseDelay = responseDelay
    }

    addEventListener(type: string, handler: MsgHandler): void {
        if (type === 'message') this.messageHandlers.push(handler)
    }

    removeEventListener(type: string, handler: MsgHandler): void {
        if (type === 'message') {
            this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
        }
    }

    postMessage(data: unknown): void {
        const req = data as { messageId: string; type: string }
        const event = {
            data: { messageId: req.messageId, success: true, data: 'ok' },
        } as MessageEvent
        if (this.responseDelay > 0) {
            setTimeout(() => {
                for (const h of this.messageHandlers) h(event)
            }, this.responseDelay)
        } else {
            setTimeout(() => {
                for (const h of this.messageHandlers) h(event)
            }, 0)
        }
    }

    terminate(): void {
        this.terminated = true
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let workerBus: (typeof import('./workerBus'))['workerBus']

beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const mod = await import('./workerBus')
    workerBus = mod.workerBus
    workerBus.reset()
})

afterEach(() => {
    workerBus.dispose()
    vi.useRealTimers()
})

describe('WorkerBus Load Tests', () => {
    it('handles 100 concurrent dispatches to a single worker', async () => {
        const w = new MockWorker()
        workerBus.register('load-test', w as unknown as Worker)
        // Override concurrency so 100 dispatches fit: 50 active + 64 queue = 114.
        workerBus.setConcurrencyLimit('load-test', 50)

        const COUNT = 100
        const promises: Promise<unknown>[] = []
        for (let i = 0; i < COUNT; i++) {
            promises.push(workerBus.dispatch('load-test', 'PING', { i }, { timeoutMs: 30_000 }))
        }

        const results = await Promise.allSettled(promises)
        const fulfilled = results.filter((r) => r.status === 'fulfilled')
        const rejected = results.filter((r) => r.status === 'rejected')

        expect(fulfilled.length).toBe(COUNT)
        expect(rejected.length).toBe(0)
        console.debug(
            `[Load] ${COUNT} dispatches: ${fulfilled.length} fulfilled, ${rejected.length} rejected`,
        )
    })

    it('dispatches across multiple workers concurrently', async () => {
        const workers = ['alpha', 'beta', 'gamma', 'delta']
        for (const name of workers) {
            workerBus.register(name, new MockWorker() as unknown as Worker)
        }

        const DISPATCHES_PER_WORKER = 50
        const promises: Promise<unknown>[] = []

        for (const name of workers) {
            for (let i = 0; i < DISPATCHES_PER_WORKER; i++) {
                promises.push(workerBus.dispatch(name, 'WORK', { i }, { timeoutMs: 30_000 }))
            }
        }

        const results = await Promise.allSettled(promises)
        const fulfilled = results.filter((r) => r.status === 'fulfilled')

        expect(fulfilled.length).toBe(workers.length * DISPATCHES_PER_WORKER)
    })

    it('priority ordering: critical jobs resolve before low-priority under load', async () => {
        // Register worker with concurrency limit of 1 to force queuing
        const w = new MockWorker(1) // 1ms response delay
        workerBus.register('priority-test', w as unknown as Worker)
        workerBus.setConcurrencyLimit('priority-test', 1)

        const resolveOrder: string[] = []

        // Dispatch low-priority jobs first
        const lowJobs = Array.from({ length: 5 }, (_, i) =>
            workerBus
                .dispatch('priority-test', 'LOW', { i }, { priority: 'low', timeoutMs: 30_000 })
                .then(() => resolveOrder.push(`low-${i}`)),
        )

        // Then dispatch a critical job
        const criticalJob = workerBus
            .dispatch('priority-test', 'CRITICAL', {}, { priority: 'critical', timeoutMs: 30_000 })
            .then(() => resolveOrder.push('critical'))

        await Promise.allSettled([...lowJobs, criticalJob])

        // Critical should resolve before all low-priority jobs
        const criticalIdx = resolveOrder.indexOf('critical')
        expect(criticalIdx).toBeLessThan(resolveOrder.length)
        // With concurrency 1, the critical job gets at most position 1
        // (after the first low-priority that was already dispatched)
        expect(criticalIdx).toBeLessThanOrEqual(1)
    })

    it('metrics reflect high load correctly', async () => {
        const w = new MockWorker()
        workerBus.register('metrics-test', w as unknown as Worker)

        const COUNT = 50
        const promises = Array.from({ length: COUNT }, (_, i) =>
            workerBus.dispatch('metrics-test', 'PING', { i }, { timeoutMs: 30_000 }),
        )

        await Promise.allSettled(promises)

        const metrics = workerBus.getMetrics()
        const m = metrics['metrics-test']
        expect(m).toBeDefined()
        expect(m?.totalDispatches).toBe(COUNT)
        expect(m?.totalErrors).toBe(0)
        expect(m?.totalTimeouts).toBe(0)
    })

    it('no pending requests leak after all dispatches settle', async () => {
        const w = new MockWorker()
        workerBus.register('leak-test', w as unknown as Worker)

        const COUNT = 100
        const promises = Array.from({ length: COUNT }, (_, i) =>
            workerBus.dispatch('leak-test', 'PING', { i }, { timeoutMs: 30_000 }),
        )

        await Promise.allSettled(promises)

        const metrics = workerBus.getMetrics()
        expect(metrics['leak-test']?.pendingCount).toBe(0)
        expect(metrics['leak-test']?.queuedCount).toBe(0)
    })

    it('abort cancels queued dispatches under backpressure', async () => {
        const w = new MockWorker(10) // 10ms delay to build up queue
        workerBus.register('abort-test', w as unknown as Worker)
        workerBus.setConcurrencyLimit('abort-test', 1)

        const controller = new AbortController()

        // Fill the queue
        const promises = Array.from({ length: 20 }, (_, i) =>
            workerBus.dispatch(
                'abort-test',
                'WORK',
                { i },
                {
                    signal: controller.signal,
                    timeoutMs: 30_000,
                },
            ),
        )

        // Abort after a tick
        setTimeout(() => controller.abort(), 1)

        const results = await Promise.allSettled(promises)
        const cancelled = results.filter(
            (r) => r.status === 'rejected' && String(r.reason).includes('cancel'),
        )

        // At least some should be cancelled
        expect(cancelled.length).toBeGreaterThan(0)
    })
})
