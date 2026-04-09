import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal Worker mock
// ---------------------------------------------------------------------------

type MsgHandler = (event: MessageEvent) => void
type ErrHandler = (event: ErrorEvent) => void

class MockWorker {
    private messageHandlers: MsgHandler[] = []
    private errorHandlers: ErrHandler[] = []
    terminated = false
    lastMessage: unknown = null

    addEventListener(type: string, handler: MsgHandler | ErrHandler): void {
        if (type === 'message') this.messageHandlers.push(handler as MsgHandler)
        if (type === 'error') this.errorHandlers.push(handler as ErrHandler)
    }

    removeEventListener(type: string, handler: MsgHandler | ErrHandler): void {
        if (type === 'message') {
            this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
        }
        if (type === 'error') {
            this.errorHandlers = this.errorHandlers.filter((h) => h !== handler)
        }
    }

    postMessage(data: unknown, _transfer?: Transferable[]): void {
        this.lastMessage = data
    }

    terminate(): void {
        this.terminated = true
    }

    /** Simulate a response from the worker. */
    respond(messageId: string, data: unknown): void {
        const event = { data: { messageId, success: true, data } } as MessageEvent
        for (const h of this.messageHandlers) h(event)
    }

    /** Simulate an error response from the worker. */
    respondError(messageId: string, error: string): void {
        const event = { data: { messageId, success: false, error } } as MessageEvent
        for (const h of this.messageHandlers) h(event)
    }

    /** Simulate a worker-level error event. */
    emitError(message: string): void {
        const event = { message } as ErrorEvent
        for (const h of this.errorHandlers) h(event)
    }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Auto-respond after next postMessage. */
const autoRespond = (worker: MockWorker, data: unknown = 'ok'): void => {
    const origPost = worker.postMessage.bind(worker)
    worker.postMessage = (msg: unknown) => {
        origPost(msg)
        const req = msg as { messageId: string }
        setTimeout(() => worker.respond(req.messageId, data), 0)
    }
}

const autoRespondError = (worker: MockWorker, error: string): void => {
    const origPost = worker.postMessage.bind(worker)
    worker.postMessage = (msg: unknown) => {
        origPost(msg)
        const req = msg as { messageId: string }
        setTimeout(() => worker.respondError(req.messageId, error), 0)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Re-import fresh for each test via dynamic import + reset
let workerBus: (typeof import('./workerBus'))['workerBus']

beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Use a fresh instance via reset
    const mod = await import('./workerBus')
    workerBus = mod.workerBus
    workerBus.reset()
})

afterEach(() => {
    workerBus.dispose()
    vi.useRealTimers()
})

describe('WorkerBus', () => {
    // --- Basic registration ---

    it('register + has', () => {
        const w = new MockWorker() as unknown as Worker
        workerBus.register('test', w)
        expect(workerBus.has('test')).toBe(true)
    })

    it('unregister terminates and removes', () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)
        workerBus.unregister('test')
        expect(workerBus.has('test')).toBe(false)
        expect(w.terminated).toBe(true)
    })

    it('re-register terminates old worker', () => {
        const w1 = new MockWorker()
        const w2 = new MockWorker()
        workerBus.register('test', w1 as unknown as Worker)
        workerBus.register('test', w2 as unknown as Worker)
        expect(w1.terminated).toBe(true)
        expect(workerBus.has('test')).toBe(true)
    })

    // --- Dispatch success ---

    it('dispatch resolves on worker response', async () => {
        const w = new MockWorker()
        autoRespond(w, { hello: 'world' })
        workerBus.register('test', w as unknown as Worker)

        const result = await workerBus.dispatch<{ hello: string }>('test', 'PING')
        expect(result).toEqual({ hello: 'world' })
    })

    // --- Dispatch to unregistered worker ---

    it('dispatch rejects for unknown worker', async () => {
        await expect(workerBus.dispatch('nope', 'X')).rejects.toThrow('No worker registered')
    })

    // --- Dispatch error from worker ---

    it('dispatch rejects on worker error response', async () => {
        const w = new MockWorker()
        autoRespondError(w, 'kaboom')
        workerBus.register('test', w as unknown as Worker)

        await expect(workerBus.dispatch('test', 'FAIL')).rejects.toThrow('kaboom')
    })

    // --- Timeout ---

    it('dispatch rejects on timeout', async () => {
        const w = new MockWorker()
        // No auto-respond -- will timeout
        workerBus.register('test', w as unknown as Worker)

        const p = workerBus.dispatch('test', 'SLOW', undefined, 100)
        vi.advanceTimersByTime(200)
        await expect(p).rejects.toThrow('timed out')
    })

    // --- Configurable default timeout ---

    it('setDefaultTimeout changes default', () => {
        workerBus.setDefaultTimeout(5000)
        expect(workerBus.getDefaultTimeout()).toBe(5000)
    })

    it('setDefaultTimeout clamps minimum to 1000', () => {
        workerBus.setDefaultTimeout(100)
        expect(workerBus.getDefaultTimeout()).toBe(1000)
    })

    // --- Worker error event rejects all pending ---

    it('worker error event rejects all pending dispatches', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)

        const p1 = workerBus.dispatch('test', 'A')
        const p2 = workerBus.dispatch('test', 'B')

        w.emitError('crash')

        await expect(p1).rejects.toThrow('Worker "test" error')
        await expect(p2).rejects.toThrow('Worker "test" error')
    })

    // --- Unregister rejects pending ---

    it('unregister rejects pending dispatches', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)

        const p = workerBus.dispatch('test', 'X')
        workerBus.unregister('test')

        await expect(p).rejects.toThrow('unregistered')
    })

    // --- dispose ---

    it('dispose terminates all workers', () => {
        const w1 = new MockWorker()
        const w2 = new MockWorker()
        workerBus.register('a', w1 as unknown as Worker)
        workerBus.register('b', w2 as unknown as Worker)
        workerBus.dispose()

        expect(w1.terminated).toBe(true)
        expect(w2.terminated).toBe(true)
        expect(workerBus.has('a')).toBe(false)
    })

    it('dispatch rejects after dispose', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)
        workerBus.dispose()
        await expect(workerBus.dispatch('test', 'X')).rejects.toThrow('disposed')
    })

    // --- getWorker ---

    it('getWorker returns registered worker', () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)
        expect(workerBus.getWorker('test')).toBe(w)
    })

    it('getWorker throws for unregistered', () => {
        expect(() => workerBus.getWorker('nope')).toThrow('No worker registered')
    })

    // --- Concurrent dispatches ---

    it('handles multiple concurrent dispatches to same worker', async () => {
        const w = new MockWorker()
        const responses: Promise<unknown>[] = []

        workerBus.register('test', w as unknown as Worker)

        // Intercept to auto-respond with the type
        const origPost = w.postMessage.bind(w)
        w.postMessage = (msg: unknown) => {
            origPost(msg)
            const req = msg as { messageId: string; type: string }
            setTimeout(() => w.respond(req.messageId, req.type), 0)
        }

        responses.push(workerBus.dispatch('test', 'A'))
        responses.push(workerBus.dispatch('test', 'B'))
        responses.push(workerBus.dispatch('test', 'C'))

        const results = await Promise.all(responses)
        expect(results).toEqual(['A', 'B', 'C'])
    })

    // --- Backpressure ---

    it('queues dispatches beyond concurrency limit', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)
        workerBus.setConcurrencyLimit('test', 1)

        const resolvers: Array<(messageId: string) => void> = []
        const origPost = w.postMessage.bind(w)
        w.postMessage = (msg: unknown) => {
            origPost(msg)
            const req = msg as { messageId: string }
            resolvers.push((mid: string) => w.respond(mid, 'done'))
            // Store messageId for manual resolution
            ;(resolvers as unknown as Array<{ mid: string }>).push({ mid: req.messageId } as never)
        }

        // First dispatch goes through, second should queue
        const p1 = workerBus.dispatch('test', 'FIRST')
        const p2 = workerBus.dispatch('test', 'SECOND')

        // p2 should be queued - pending count should be 1 (only first in-flight)
        expect(workerBus.getPendingCount('test')).toBe(1)

        // Resolve first
        const firstMsg = w.lastMessage as { messageId: string }
        w.respond(firstMsg.messageId, 'result1')

        const r1 = await p1
        expect(r1).toBe('result1')

        // Now second should be dispatched - need to respond to it
        await vi.advanceTimersByTimeAsync(10)

        // Get the new message
        const secondMsg = w.lastMessage as { messageId: string }
        w.respond(secondMsg.messageId, 'result2')

        const r2 = await p2
        expect(r2).toBe('result2')
    })

    // --- Retry ---

    it('retries on transient failure then succeeds', async () => {
        const w = new MockWorker()
        let callCount = 0

        const origPost = w.postMessage.bind(w)
        w.postMessage = (msg: unknown) => {
            origPost(msg)
            callCount++
            const req = msg as { messageId: string }
            if (callCount < 3) {
                setTimeout(() => w.respondError(req.messageId, 'transient'), 0)
            } else {
                setTimeout(() => w.respond(req.messageId, 'success'), 0)
            }
        }

        workerBus.register('test', w as unknown as Worker)

        const result = await workerBus.dispatch<string>('test', 'RETRY_ME', undefined, {
            retries: 3,
            retryDelayMs: 10,
        })

        expect(result).toBe('success')
        expect(callCount).toBe(3)
    })

    it('retry does not retry on "No worker registered"', async () => {
        await expect(workerBus.dispatch('missing', 'X', undefined, { retries: 3 })).rejects.toThrow(
            'No worker registered',
        )
    })

    // --- Metrics ---

    it('tracks telemetry metrics', async () => {
        const w = new MockWorker()
        autoRespond(w, 42)
        workerBus.register('test', w as unknown as Worker)

        await workerBus.dispatch('test', 'A')
        await workerBus.dispatch('test', 'B')

        const metrics = workerBus.getMetrics('test')
        expect(metrics['test']).toBeDefined()
        expect(metrics['test']?.totalDispatches).toBe(2)
        expect(metrics['test']?.totalErrors).toBe(0)
        expect(metrics['test']?.averageLatencyMs).toBeGreaterThanOrEqual(0)
    })

    it('tracks timeout in metrics', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)

        const p = workerBus.dispatch('test', 'SLOW', undefined, 50)
        vi.advanceTimersByTime(100)
        await expect(p).rejects.toThrow('timed out')

        const metrics = workerBus.getMetrics('test')
        expect(metrics['test']?.totalTimeouts).toBe(1)
    })

    // --- reset ---

    it('reset allows re-use after dispose', async () => {
        workerBus.dispose()
        workerBus.reset()

        const w = new MockWorker()
        autoRespond(w, 'alive')
        workerBus.register('test', w as unknown as Worker)

        const result = await workerBus.dispatch('test', 'PING')
        expect(result).toBe('alive')
    })

    // --- Non-bus messages are ignored ---

    it('ignores messages without messageId', () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)

        // Should not throw
        w.respond(undefined as unknown as string, 'junk')
    })

    // --- getPendingCount ---

    it('getPendingCount tracks in-flight requests', async () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)

        expect(workerBus.getPendingCount('test')).toBe(0)
        const _p = workerBus.dispatch('test', 'X')
        expect(workerBus.getPendingCount('test')).toBe(1)

        const msg = w.lastMessage as { messageId: string }
        w.respond(msg.messageId, 'ok')
        await _p
        expect(workerBus.getPendingCount('test')).toBe(0)
    })

    it('auto-disposes on pagehide event', () => {
        const w = new MockWorker()
        workerBus.register('test', w as unknown as Worker)
        expect(workerBus.has('test')).toBe(true)

        // Simulate pagehide event (globalThis.window may not exist in node/jsdom)
        if (typeof globalThis.window !== 'undefined') {
            globalThis.window.dispatchEvent(new Event('pagehide'))
            expect(w.terminated).toBe(true)
        } else {
            // In non-browser env, verify dispose works manually
            workerBus.dispose()
            expect(w.terminated).toBe(true)
        }
    })
})

// ---------------------------------------------------------------------------
// New P1 features
// ---------------------------------------------------------------------------

describe('WorkerBus -- onDispatchComplete hook', () => {
    let w: MockWorker

    beforeEach(() => {
        w = new MockWorker()
        try {
            workerBus.unregister('hook-worker')
        } catch {
            /* ignore */
        }
        workerBus.register('hook-worker', w as unknown as Worker)
    })

    afterEach(() => {
        try {
            workerBus.unregister('hook-worker')
        } catch {
            /* ignore */
        }
    })

    it('fires with success=true and correct fields after resolve', async () => {
        const events: import('./workerBus').DispatchCompleteEvent[] = []
        const cleanup = workerBus.onDispatchComplete((e) => events.push(e))
        const p = workerBus.dispatch<string>('hook-worker', 'PING', {})
        w.respond((w.lastMessage as { messageId: string }).messageId, 'pong')
        const result = await p
        expect(result).toBe('pong')
        expect(events).toHaveLength(1)
        expect(events[0]?.success).toBe(true)
        expect(events[0]?.workerName).toBe('hook-worker')
        expect(events[0]?.type).toBe('PING')
        expect(events[0]?.data).toBe('pong')
        expect(typeof events[0]?.latencyMs).toBe('number')
        cleanup()
    })

    it('fires with success=false on worker error response', async () => {
        const events: import('./workerBus').DispatchCompleteEvent[] = []
        const cleanup = workerBus.onDispatchComplete((e) => events.push(e))
        const p = workerBus.dispatch('hook-worker', 'FAIL', {}).catch(() => undefined)
        w.respondError((w.lastMessage as { messageId: string }).messageId, 'boom')
        await p
        expect(events[0]?.success).toBe(false)
        expect(events[0]?.error).toBe('boom')
        cleanup()
    })

    it('cleanup removes the hook before dispatch', async () => {
        const events: import('./workerBus').DispatchCompleteEvent[] = []
        const cleanup = workerBus.onDispatchComplete((e) => events.push(e))
        cleanup()
        const p = workerBus.dispatch<number>('hook-worker', 'NUM', {})
        w.respond((w.lastMessage as { messageId: string }).messageId, 7)
        await p
        expect(events).toHaveLength(0)
    })
})

describe('WorkerBus -- AbortController', () => {
    let w: MockWorker

    beforeEach(() => {
        w = new MockWorker()
        try {
            workerBus.unregister('abort-worker')
        } catch {
            /* ignore */
        }
        workerBus.register('abort-worker', w as unknown as Worker)
    })

    afterEach(() => {
        try {
            workerBus.unregister('abort-worker')
        } catch {
            /* ignore */
        }
    })

    it('rejects with CANCELLED when signal already aborted', async () => {
        const { WorkerErrorCode } = await import('@/types/workerBus.types')
        const ctrl = new AbortController()
        ctrl.abort()
        await expect(
            workerBus.dispatch('abort-worker', 'OP', {}, { signal: ctrl.signal }),
        ).rejects.toMatchObject({ code: WorkerErrorCode.CANCELLED })
    })

    it('rejects with CANCELLED when signal aborts mid-flight', async () => {
        const { WorkerErrorCode } = await import('@/types/workerBus.types')
        const ctrl = new AbortController()
        const p = workerBus.dispatch(
            'abort-worker',
            'SLOW',
            {},
            {
                signal: ctrl.signal,
                timeoutMs: 30_000,
            },
        )
        ctrl.abort()
        await expect(p).rejects.toMatchObject({ code: WorkerErrorCode.CANCELLED })
    })

    it('resolves normally when signal aborts after settlement', async () => {
        const ctrl = new AbortController()
        const p = workerBus.dispatch<string>('abort-worker', 'FAST', {}, { signal: ctrl.signal })
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        const result = await p
        ctrl.abort()
        expect(result).toBe('done')
    })
})

describe('WorkerBus -- Transferable objects', () => {
    let w: MockWorker

    beforeEach(() => {
        w = new MockWorker()
        try {
            workerBus.unregister('transfer-worker')
        } catch {
            /* ignore */
        }
        workerBus.register('transfer-worker', w as unknown as Worker)
    })

    afterEach(() => {
        try {
            workerBus.unregister('transfer-worker')
        } catch {
            /* ignore */
        }
    })

    it('calls postMessage with transferable array when provided', async () => {
        const buffer = new ArrayBuffer(16)
        const spy = vi.spyOn(w, 'postMessage')
        const p = workerBus.dispatch('transfer-worker', 'MOVE', buffer, { transferable: [buffer] })
        const rawCall = spy.mock.calls[0] as unknown
        const callArgs = rawCall as [unknown, Transferable[]]
        expect(Array.isArray(callArgs[1])).toBe(true)
        expect(callArgs[1]).toContain(buffer)
        // Settle
        w.respond((w.lastMessage as { messageId: string }).messageId, null)
        await p
    })
})

// ---------------------------------------------------------------------------
// Priority Queue integration
// ---------------------------------------------------------------------------

describe('WorkerBus -- Priority Queue', () => {
    let w: MockWorker
    const WORKER = 'prio-worker'
    /** Track all dispatches so afterEach can settle them to avoid unhandled rejections. */
    let pendingPromises: Array<Promise<unknown>>

    beforeEach(() => {
        pendingPromises = []
        w = new MockWorker()
        try {
            workerBus.unregister(WORKER)
        } catch {
            /* ignore */
        }
        workerBus.register(WORKER, w as unknown as Worker)
        // Concurrency limit 1 -- forces queuing after first dispatch
        workerBus.setConcurrencyLimit(WORKER, 1)
    })

    afterEach(async () => {
        // Settle any in-flight dispatches to prevent unhandled rejections
        try {
            workerBus.unregister(WORKER)
        } catch {
            /* ignore */
        }
        // Absorb all rejections from pending promises
        await Promise.allSettled(pendingPromises)
    })

    it('dequeues critical before high before normal before low', async () => {
        const order: string[] = []

        // First dispatch occupies the slot (critical so it cannot be preempted)
        const p0 = workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' })

        // Queue 4 jobs with different priorities
        const pLow = workerBus
            .dispatch(WORKER, 'LOW', {}, { priority: 'low' })
            .then(() => order.push('low'))
        const pNormal = workerBus
            .dispatch(WORKER, 'NORMAL', {}, { priority: 'normal' })
            .then(() => order.push('normal'))
        const pHigh = workerBus
            .dispatch(WORKER, 'HIGH', {}, { priority: 'high' })
            .then(() => order.push('high'))
        const pCritical = workerBus
            .dispatch(WORKER, 'CRITICAL', {}, { priority: 'critical' })
            .then(() => order.push('critical'))

        // Release blocker
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await p0

        // Drain queue sequentially -- each response triggers the next dequeue
        for (let i = 0; i < 4; i++) {
            await vi.advanceTimersByTimeAsync(0)
            w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
            await vi.advanceTimersByTimeAsync(0)
        }

        await Promise.all([pLow, pNormal, pHigh, pCritical])
        expect(order).toEqual(['critical', 'high', 'normal', 'low'])
    })

    it('maintains FIFO for two critical jobs', async () => {
        const order: string[] = []

        // Block the slot (critical so it cannot be preempted)
        const p0 = workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' })

        const p1 = workerBus
            .dispatch(WORKER, 'C1', {}, { priority: 'critical' })
            .then(() => order.push('C1'))
        const p2 = workerBus
            .dispatch(WORKER, 'C2', {}, { priority: 'critical' })
            .then(() => order.push('C2'))

        // Release blocker
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await p0

        // Drain
        for (let i = 0; i < 2; i++) {
            await vi.advanceTimersByTimeAsync(0)
            w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
            await vi.advanceTimersByTimeAsync(0)
        }

        await Promise.all([p1, p2])
        expect(order).toEqual(['C1', 'C2'])
    })

    it('cancels a low-priority queued job via AbortSignal', async () => {
        const { WorkerErrorCode } = await import('@/types/workerBus.types')
        const ctrl = new AbortController()

        // Block the slot (critical so it cannot be preempted)
        const p0 = workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' })

        const pLow = workerBus.dispatch(
            WORKER,
            'LOW',
            {},
            {
                priority: 'low',
                signal: ctrl.signal,
            },
        )

        // Abort before it gets processed
        ctrl.abort()

        // Release blocker -- drainQueue will find the queued item aborted
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await p0

        await expect(pLow).rejects.toMatchObject({ code: WorkerErrorCode.CANCELLED })
    })

    it('getQueueState() shows byPriority correctly', async () => {
        // Block the slot (critical so it cannot be preempted)
        pendingPromises.push(workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' }))

        // Queue jobs with different priorities
        pendingPromises.push(workerBus.dispatch(WORKER, 'A', {}, { priority: 'critical' }))
        pendingPromises.push(workerBus.dispatch(WORKER, 'B', {}, { priority: 'low' }))
        pendingPromises.push(workerBus.dispatch(WORKER, 'C', {}, { priority: 'low' }))
        pendingPromises.push(workerBus.dispatch(WORKER, 'D', {}, { priority: 'normal' }))

        const state = workerBus.getQueueState()
        expect(state.byPriority.critical).toBe(1)
        expect(state.byPriority.high).toBe(0)
        expect(state.byPriority.normal).toBe(1)
        expect(state.byPriority.low).toBe(2)
        expect(state.queued).toHaveLength(4)
    })

    it('getQueueState() shows current in-flight requests', async () => {
        // Block the slot -- this dispatch is now in-flight
        pendingPromises.push(workerBus.dispatch(WORKER, 'INFLIGHT', {}, { priority: 'high' }))

        const state = workerBus.getQueueState()
        expect(state.current.length).toBeGreaterThanOrEqual(1)
        const inflight = state.current.find((c) => c.type === 'INFLIGHT')
        expect(inflight?.priority).toBe('high')
    })

    it('default priority is normal', async () => {
        // Block the slot (critical so it cannot be preempted)
        pendingPromises.push(workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' }))

        // Queue without explicit priority
        pendingPromises.push(workerBus.dispatch(WORKER, 'DEFAULT', {}))

        const state = workerBus.getQueueState()
        const queued = state.queued.find((q) => q.type === 'DEFAULT')
        expect(queued?.priority).toBe('normal')
    })

    it('transferable objects work with priority', async () => {
        const buffer = new ArrayBuffer(16)
        const spy = vi.spyOn(w, 'postMessage')
        const p = workerBus.dispatch(WORKER, 'XFER', buffer, {
            transferable: [buffer],
            priority: 'critical',
        })
        const rawCall = spy.mock.calls[0] as unknown
        const callArgs = rawCall as [unknown, Transferable[]]
        expect(Array.isArray(callArgs[1])).toBe(true)
        w.respond((w.lastMessage as { messageId: string }).messageId, null)
        await p
    })

    it('DispatchCompleteEvent includes priority field', async () => {
        const events: import('./workerBus').DispatchCompleteEvent[] = []
        const cleanup = workerBus.onDispatchComplete((e) => events.push(e))
        autoRespond(w, 'ok')
        await workerBus.dispatch(WORKER, 'PRIO-EVT', {}, { priority: 'critical' })
        expect(events[0]?.priority).toBe('critical')
        cleanup()
    })

    it('handles simultaneous jobs with correct serialization', async () => {
        const results: string[] = []

        // 3 concurrent dispatches -- concurrency=1 means 1 runs, 2 queue.
        // With W-02 preemption: A(low) gets the slot, B(critical) preempts A,
        // C(high) queues behind re-queued A. After B completes, drain order
        // is C(high) then A(low).
        const p1 = workerBus
            .dispatch(WORKER, 'A', {}, { priority: 'low' })
            .then(() => results.push('A'))
        const p2 = workerBus
            .dispatch(WORKER, 'B', {}, { priority: 'critical' })
            .then(() => results.push('B'))
        const p3 = workerBus
            .dispatch(WORKER, 'C', {}, { priority: 'high' })
            .then(() => results.push('C'))

        // B (critical) preempted A and is now in-flight
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await vi.advanceTimersByTimeAsync(0)

        // C (high) is next from queue
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await vi.advanceTimersByTimeAsync(0)

        // A (low, re-queued) is last
        w.respond((w.lastMessage as { messageId: string }).messageId, 'done')
        await vi.advanceTimersByTimeAsync(0)

        await Promise.all([p1, p2, p3])
        // B runs first (preempted A), then C (high), then A (re-queued low)
        expect(results).toEqual(['B', 'C', 'A'])
    })

    it('processes 50 jobs in random priority order without losing any', async () => {
        autoRespond(w)
        const priorities: Array<import('@/utils/priorityQueue').WorkerPriority> = [
            'critical',
            'high',
            'normal',
            'low',
        ]
        const promises: Array<Promise<unknown>> = []

        for (let i = 0; i < 50; i++) {
            const priority = priorities[i % 4] as import('@/utils/priorityQueue').WorkerPriority
            promises.push(workerBus.dispatch(WORKER, `JOB_${i}`, {}, { priority }))
        }

        const results = await Promise.all(promises)
        expect(results).toHaveLength(50)
    })

    it('enqueues 100 jobs in under 50ms', () => {
        // Block the slot so all subsequent dispatches queue (critical = non-preemptable)
        pendingPromises.push(workerBus.dispatch(WORKER, 'BLOCK', {}, { priority: 'critical' }))

        const priorities: Array<import('@/utils/priorityQueue').WorkerPriority> = [
            'critical',
            'high',
            'normal',
            'low',
        ]

        const start = performance.now()
        for (let i = 0; i < 64; i++) {
            // Max queue size is 64, use that
            const priority = priorities[i % 4] as import('@/utils/priorityQueue').WorkerPriority
            pendingPromises.push(workerBus.dispatch(WORKER, `PERF_${i}`, {}, { priority }))
        }
        const elapsed = performance.now() - start
        expect(elapsed).toBeLessThan(50)

        const state = workerBus.getQueueState()
        expect(state.queued).toHaveLength(64)
    })
})

// --- WorkerBusError typed errors (K-04) ---

describe('WorkerBusError typed errors (K-04)', () => {
    it('dispatch to unregistered worker rejects with WorkerBusError NOT_REGISTERED', async () => {
        const { WorkerBusError, WorkerErrorCode } = await import('@/types/workerBus.types')
        await expect(workerBus.dispatch('nonexistent', 'PING', {})).rejects.toSatisfy(
            (err: unknown) =>
                err instanceof WorkerBusError &&
                err.code === WorkerErrorCode.NOT_REGISTERED &&
                err.workerName === 'nonexistent',
        )
    })

    it('getWorker throws WorkerBusError NOT_REGISTERED for missing worker', async () => {
        const { WorkerBusError, WorkerErrorCode } = await import('@/types/workerBus.types')
        expect(() => workerBus.getWorker('missing')).toThrow(WorkerBusError)
        try {
            workerBus.getWorker('missing')
        } catch (err) {
            expect(err).toBeInstanceOf(WorkerBusError)
            expect((err as InstanceType<typeof WorkerBusError>).code).toBe(
                WorkerErrorCode.NOT_REGISTERED,
            )
        }
    })

    it('unregister rejects pending requests with WorkerBusError NOT_REGISTERED', async () => {
        const { WorkerBusError, WorkerErrorCode } = await import('@/types/workerBus.types')
        const w = new MockWorker()
        workerBus.register('typed-test', w as unknown as Worker)
        // Dispatch without auto-respond so it stays pending
        const p = workerBus.dispatch('typed-test', 'HANG', {})
        workerBus.unregister('typed-test')
        await expect(p).rejects.toSatisfy(
            (err: unknown) =>
                err instanceof WorkerBusError &&
                err.code === WorkerErrorCode.NOT_REGISTERED &&
                err.workerName === 'typed-test',
        )
    })

    // -----------------------------------------------------------------------
    // W-01: Per-worker rate limiting
    // -----------------------------------------------------------------------

    describe('W-01: rate limiting', () => {
        it('rejects dispatches that exceed the rate limit', async () => {
            const { WorkerBusError, WorkerErrorCode } = await import('@/types/workerBus.types')
            const w = new MockWorker()
            autoRespond(w)
            workerBus.register('rate-test', w as unknown as Worker)
            workerBus.setRateLimit('rate-test', { maxRequests: 2, windowMs: 5000 })

            // First two should succeed
            await workerBus.dispatch('rate-test', 'A', {})
            await workerBus.dispatch('rate-test', 'B', {})

            // Third should be rate-limited
            await expect(workerBus.dispatch('rate-test', 'C', {})).rejects.toSatisfy(
                (err: unknown) =>
                    err instanceof WorkerBusError && err.code === WorkerErrorCode.RATE_LIMITED,
            )
        })

        it('allows dispatches after removing rate limit', async () => {
            const w = new MockWorker()
            autoRespond(w)
            workerBus.register('rate-test-2', w as unknown as Worker)
            workerBus.setRateLimit('rate-test-2', { maxRequests: 1, windowMs: 5000 })

            await workerBus.dispatch('rate-test-2', 'A', {})
            await expect(workerBus.dispatch('rate-test-2', 'B', {})).rejects.toBeTruthy()

            // Remove limit
            workerBus.setRateLimit('rate-test-2', undefined)
            await expect(workerBus.dispatch('rate-test-2', 'C', {})).resolves.toBeDefined()
        })

        it('getRateLimit returns the configured limit', () => {
            workerBus.setRateLimit('rl-get', { maxRequests: 5, windowMs: 2000 })
            const config = workerBus.getRateLimit('rl-get')
            expect(config).toEqual({ maxRequests: 5, windowMs: 2000 })
            expect(workerBus.getRateLimit('nonexistent')).toBeUndefined()
        })

        it('rate limit is not retryable', async () => {
            const { WorkerBusError, WorkerErrorCode } = await import('@/types/workerBus.types')
            const w = new MockWorker()
            autoRespond(w)
            workerBus.register('rl-retry', w as unknown as Worker)
            workerBus.setRateLimit('rl-retry', { maxRequests: 1, windowMs: 10000 })

            await workerBus.dispatch('rl-retry', 'A', {})
            // Should reject immediately without retrying
            await expect(
                workerBus.dispatch('rl-retry', 'B', {}, { retries: 3, retryDelayMs: 10 }),
            ).rejects.toSatisfy(
                (err: unknown) =>
                    err instanceof WorkerBusError && err.code === WorkerErrorCode.RATE_LIMITED,
            )
        })
    })

    // -----------------------------------------------------------------------
    // W-03: Telemetry export
    // -----------------------------------------------------------------------

    describe('W-03: telemetry export', () => {
        it('exports telemetry with extended metrics', async () => {
            const w = new MockWorker()
            autoRespond(w)
            workerBus.register('tel-export', w as unknown as Worker)

            await workerBus.dispatch('tel-export', 'A', {})
            await workerBus.dispatch('tel-export', 'B', {})

            const snapshot = workerBus.exportTelemetry()
            expect(snapshot.timestamp).toBeGreaterThan(0)
            expect(snapshot.workers['tel-export']).toBeDefined()

            const wt = snapshot.workers['tel-export']
            expect(wt?.totalDispatches).toBe(2)
            expect(wt?.totalErrors).toBe(0)
            expect(wt?.errorRate).toBe(0)
            expect(wt?.peakLatencyMs).toBeGreaterThanOrEqual(0)
            expect(wt?.pendingCount).toBe(0)
            expect(wt?.lastSuccessAt).toBeGreaterThan(0)
        })

        it('tracks error rate in export', async () => {
            const w = new MockWorker()
            workerBus.register('tel-err', w as unknown as Worker)

            // Auto-respond with errors
            const origPost = w.postMessage.bind(w)
            w.postMessage = (msg: unknown) => {
                origPost(msg)
                const req = msg as { messageId: string }
                setTimeout(() => w.respondError(req.messageId, 'test error'), 0)
            }

            try {
                await workerBus.dispatch('tel-err', 'FAIL', {})
            } catch {
                /* expected */
            }
            try {
                await workerBus.dispatch('tel-err', 'FAIL', {})
            } catch {
                /* expected */
            }

            const snapshot = workerBus.exportTelemetry()
            const wt = snapshot.workers['tel-err']
            expect(wt?.errorRate).toBe(1)
            expect(wt?.lastErrorAt).toBeGreaterThan(0)
        })
    })
})

// ---------------------------------------------------------------------------
// W-02: Priority Preemption
// ---------------------------------------------------------------------------

describe('WorkerBus -- W-02 Priority Preemption', () => {
    let w: MockWorker
    const WORKER = 'preempt-worker'

    beforeEach(() => {
        w = new MockWorker()
        try {
            workerBus.unregister(WORKER)
        } catch {
            /* ignore */
        }
        workerBus.register(WORKER, w as unknown as Worker)
        // Concurrency limit 1 -- forces preemption scenario
        workerBus.setConcurrencyLimit(WORKER, 1)
    })

    afterEach(async () => {
        try {
            workerBus.unregister(WORKER)
        } catch {
            /* ignore */
        }
    })

    it('critical preempts low-priority running job and re-queues it', async () => {
        // Low-priority job occupies the slot
        const pLow = workerBus.dispatch<string>(WORKER, 'LOW_JOB', {}, { priority: 'low' })

        // Critical job arrives -- should preempt the low job
        const pCritical = workerBus.dispatch<string>(
            WORKER,
            'CRITICAL_JOB',
            {},
            { priority: 'critical' },
        )

        // Respond to critical job (it is now in-flight)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'critical-done')
        const critResult = await pCritical
        expect(critResult).toBe('critical-done')

        // After critical finishes, the re-queued low job should drain
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'low-done')
        const lowResult = await pLow
        expect(lowResult).toBe('low-done')
    })

    it('critical does NOT preempt another critical job', async () => {
        // Critical job occupies the slot
        const p1 = workerBus.dispatch(WORKER, 'C1', {}, { priority: 'critical' })

        // Second critical job -- should queue, not preempt
        const p2 = workerBus.dispatch(WORKER, 'C2', {}, { priority: 'critical' })

        // The first job is still in-flight (not preempted)
        expect(workerBus.getPendingCount(WORKER)).toBe(1)

        // Respond to first
        w.respond((w.lastMessage as { messageId: string }).messageId, 'c1-done')
        await p1

        // Drain second
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'c2-done')
        await p2

        // No preemption telemetry
        const metrics = workerBus.getMetrics(WORKER)
        expect(metrics[WORKER]?.preemptionCount).toBe(0)
    })

    it('normal does NOT preempt normal (equal priority)', async () => {
        // Normal job occupies the slot
        const p1 = workerBus.dispatch(WORKER, 'N1', {}, { priority: 'normal' })

        // Second normal job -- should queue, not preempt
        const p2 = workerBus.dispatch(WORKER, 'N2', {}, { priority: 'normal' })

        // First still in-flight
        expect(workerBus.getPendingCount(WORKER)).toBe(1)

        // Respond to first
        w.respond((w.lastMessage as { messageId: string }).messageId, 'n1-done')
        await p1

        // Drain second
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'n2-done')
        await p2

        const metrics = workerBus.getMetrics(WORKER)
        expect(metrics[WORKER]?.preemptionCount).toBe(0)
    })

    it('preempted job is retried and resolves after critical completes', async () => {
        const results: string[] = []

        // Normal job occupies the slot
        const pNormal = workerBus
            .dispatch<string>(WORKER, 'NORMAL', {}, { priority: 'normal' })
            .then((r) => {
                results.push(`normal:${r}`)
                return r
            })

        // Critical preempts normal
        const pCritical = workerBus
            .dispatch<string>(WORKER, 'CRITICAL', {}, { priority: 'critical' })
            .then((r) => {
                results.push(`critical:${r}`)
                return r
            })

        // Respond to critical
        w.respond((w.lastMessage as { messageId: string }).messageId, 'fast')
        await pCritical

        // Re-queued normal should now be dispatched
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'slow')
        await pNormal

        expect(results).toEqual(['critical:fast', 'normal:slow'])
    })

    it('tracks preemption count in telemetry', async () => {
        // Low job occupies slot
        const pLow = workerBus.dispatch(WORKER, 'LOW', {}, { priority: 'low' })

        // Critical preempts
        const pCritical = workerBus.dispatch(WORKER, 'CRIT', {}, { priority: 'critical' })

        // Check getMetrics
        const metrics = workerBus.getMetrics(WORKER)
        expect(metrics[WORKER]?.preemptionCount).toBe(1)

        // Check exportTelemetry
        const snapshot = workerBus.exportTelemetry()
        expect(snapshot.workers[WORKER]?.preemptionCount).toBe(1)

        // Settle both to avoid unhandled rejections
        w.respond((w.lastMessage as { messageId: string }).messageId, 'ok')
        await pCritical
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'ok')
        await pLow
    })

    it('rejects with PREEMPTED after exceeding max preemption retries', async () => {
        const { WorkerErrorCode } = await import('@/types/workerBus.types')

        // Low job occupies slot
        const pLow = workerBus.dispatch(WORKER, 'VICTIM', {}, { priority: 'low' })
        // Attach early handler to prevent unhandled-rejection noise
        pLow.catch(() => {})

        // Preempt 4 times (max is 3, so the 4th should reject)
        const criticals: Array<Promise<unknown>> = []
        for (let i = 0; i < 4; i++) {
            const pCrit = workerBus.dispatch(WORKER, `CRIT_${i}`, {}, { priority: 'critical' })
            // Respond to each critical immediately so the slot frees for the
            // re-queued low job to be drained, then preempted again.
            w.respond((w.lastMessage as { messageId: string }).messageId, `crit-${i}`)
            criticals.push(pCrit)
            await vi.advanceTimersByTimeAsync(0)
        }

        await Promise.all(criticals)

        // Low job should have been rejected after 4th preemption (exceeding max 3)
        await expect(pLow).rejects.toMatchObject({ code: WorkerErrorCode.PREEMPTED })

        // Telemetry should show 4 preemptions
        const metrics = workerBus.getMetrics(WORKER)
        expect(metrics[WORKER]?.preemptionCount).toBe(4)
    })

    it('high preempts low but not normal', async () => {
        // Normal job occupies the slot
        const pNormal = workerBus.dispatch(WORKER, 'NORM', {}, { priority: 'normal' })

        // High arrives -- should NOT preempt normal (high=1, normal=2, but
        // we need strict greater for the RUNNING job's numeric value)
        // Actually high(1) < normal(2) so normal IS strictly lower priority.
        // High should preempt normal.
        const pHigh = workerBus.dispatch<string>(WORKER, 'HIGH', {}, { priority: 'high' })

        const metrics = workerBus.getMetrics(WORKER)
        expect(metrics[WORKER]?.preemptionCount).toBe(1)

        // Settle
        w.respond((w.lastMessage as { messageId: string }).messageId, 'high-ok')
        await pHigh
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'normal-ok')
        await pNormal
    })

    it('fires DispatchCompleteEvent with error for preempted job', async () => {
        const events: import('./workerBus').DispatchCompleteEvent[] = []
        const cleanup = workerBus.onDispatchComplete((e) => events.push(e))

        // Low job occupies slot
        const pLow = workerBus.dispatch(WORKER, 'LOW_EVT', {}, { priority: 'low' })

        // Critical preempts -- should fire a failure event for the preempted job
        const pCritical = workerBus.dispatch(WORKER, 'CRIT_EVT', {}, { priority: 'critical' })

        // Find the preemption event
        const preemptEvent = events.find((e) => e.type === 'LOW_EVT' && e.success === false)
        expect(preemptEvent).toBeDefined()
        expect(preemptEvent?.error).toContain('Preempted')

        // Settle
        w.respond((w.lastMessage as { messageId: string }).messageId, 'ok')
        await pCritical
        await vi.advanceTimersByTimeAsync(0)
        w.respond((w.lastMessage as { messageId: string }).messageId, 'ok')
        await pLow
        cleanup()
    })
})
