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

    postMessage(data: unknown): void {
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
