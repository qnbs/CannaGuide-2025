/**
 * useStreamingResponse.test.ts
 *
 * Unit tests for the shared streaming response hook.
 * Tests: initial state, isStreaming lifecycle, token accumulation via RAF,
 * result passthrough, error fallback, reset, and concurrent call isolation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStreamingResponse, type StreamFn } from '@/hooks/useStreamingResponse'

// ---------------------------------------------------------------------------
// RAF stub: capture and flush callbacks on demand
// ---------------------------------------------------------------------------

type RafCallback = (time: number) => void
let rafQueue: RafCallback[] = []

const flushRaf = () => {
    const queue = rafQueue.slice()
    rafQueue = []
    queue.forEach((cb) => cb(performance.now()))
}

beforeEach(() => {
    rafQueue = []
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb: RafCallback) => {
        rafQueue.push(cb)
        return rafQueue.length
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stream function that fires onToken once and resolves with a value. */
const makeSimpleStream =
    <T>(tokens: string[], result: T): StreamFn<T> =>
    (onToken) =>
        new Promise<T>((resolve) => {
            let accumulated = ''
            for (const token of tokens) {
                accumulated += token
                onToken(token, accumulated)
            }
            resolve(result)
        })

/** Stream function that always rejects. */
const makeFailingStream =
    <T>(): StreamFn<T> =>
    () =>
        Promise.reject(new Error('stream error'))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useStreamingResponse', () => {
    it('has correct initial state', () => {
        const { result } = renderHook(() => useStreamingResponse<string>())
        expect(result.current.streamedText).toBe('')
        expect(result.current.isStreaming).toBe(false)
    })

    it('sets isStreaming to true while stream is in progress', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        let resolveStream!: (v: string) => void
        const pendingStream: StreamFn<string> = () =>
            new Promise<string>((resolve) => {
                resolveStream = resolve
            })

        act(() => {
            void result.current.start(pendingStream)
        })

        expect(result.current.isStreaming).toBe(true)

        await act(async () => {
            resolveStream('done')
            await Promise.resolve()
        })

        expect(result.current.isStreaming).toBe(false)
    })

    it('accumulates streamed text via RAF debounce', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        await act(async () => {
            void result.current.start(makeSimpleStream(['Hello', ' world'], 'ok'))
            await Promise.resolve()
            flushRaf()
        })

        expect(result.current.streamedText).toBe('Hello world')
    })

    it('returns the resolved result from the stream function', async () => {
        const { result } = renderHook(() => useStreamingResponse<{ title: string }>())

        let returnedValue: { title: string } | undefined

        await act(async () => {
            returnedValue = await result.current.start(
                makeSimpleStream(['chunk'], { title: 'AI Response' }),
            )
            flushRaf()
        })

        expect(returnedValue).toEqual({ title: 'AI Response' })
    })

    it('calls fallback and returns undefined when stream throws', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())
        const fallback = vi.fn()

        let returnedValue: string | undefined = 'initial'

        await act(async () => {
            returnedValue = await result.current.start(makeFailingStream<string>(), fallback)
        })

        expect(fallback).toHaveBeenCalledOnce()
        expect(returnedValue).toBeUndefined()
    })

    it('sets isStreaming to false after an error', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        await act(async () => {
            await result.current.start(makeFailingStream<string>())
        })

        expect(result.current.isStreaming).toBe(false)
    })

    it('does not call fallback when none is provided and stream throws', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        // Should not throw
        await act(async () => {
            await result.current.start(makeFailingStream<string>())
        })

        expect(result.current.isStreaming).toBe(false)
    })

    it('reset() clears streamedText without affecting isStreaming', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        // Accumulate some text first
        await act(async () => {
            void result.current.start(makeSimpleStream(['first'], 'ok'))
            await Promise.resolve()
            flushRaf()
        })

        expect(result.current.streamedText).toBe('first')

        act(() => {
            result.current.reset()
        })

        expect(result.current.streamedText).toBe('')
        expect(result.current.isStreaming).toBe(false)
    })

    it('clears streamedText at the start of a new stream', async () => {
        const { result } = renderHook(() => useStreamingResponse<string>())

        // First stream
        await act(async () => {
            void result.current.start(makeSimpleStream(['first'], 'ok'))
            await Promise.resolve()
            flushRaf()
        })

        expect(result.current.streamedText).toBe('first')

        // Second stream — text should be cleared at start
        await act(async () => {
            void result.current.start(makeSimpleStream([], 'ok2'))
            await Promise.resolve()
        })

        // streamedText is reset immediately when start() is called
        // (before any token arrives) — either blank or partial 'second chunk'
        // It must NOT still be 'first' after the second stream completes.
        await act(async () => {
            flushRaf()
        })

        // After second stream with no tokens, text should be empty
        expect(result.current.streamedText).toBe('')
    })

    it('two independent hook instances do not share state', async () => {
        const { result: hookA } = renderHook(() => useStreamingResponse<string>())
        const { result: hookB } = renderHook(() => useStreamingResponse<string>())

        await act(async () => {
            void hookA.current.start(makeSimpleStream(['A'], 'resultA'))
            void hookB.current.start(makeSimpleStream(['B', 'B'], 'resultB'))
            await Promise.resolve()
            flushRaf()
        })

        expect(hookA.current.streamedText).toBe('A')
        expect(hookB.current.streamedText).toBe('BB')
    })
})
