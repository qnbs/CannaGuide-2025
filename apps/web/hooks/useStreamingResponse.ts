import { useState, useRef, useCallback } from 'react'

/**
 * Callback fired for each token chunk during streaming.
 * @param token   - The latest token chunk (may be empty for some providers).
 * @param accumulated - The full text accumulated so far.
 */
export type OnToken = (token: string, accumulated: string) => void

/**
 * A function that drives the streaming: receives an `onToken` callback and
 * returns a Promise that resolves to the final result when streaming ends.
 */
export type StreamFn<T> = (onToken: OnToken) => Promise<T>

export interface UseStreamingResponseReturn<T> {
    /** Streaming text as it accumulates (RAF-debounced for performance). */
    streamedText: string
    /** True while the stream is in progress. */
    isStreaming: boolean
    /**
     * Kick off a streaming request.
     *
     * @param streamFn   - Receives the RAF-debounced `onToken` callback and
     *                     resolves to the final typed result.
     * @param fallbackFn - Called (without arguments) when `streamFn` throws.
     *                     Typically triggers an RTK batch mutation.
     * @returns The resolved result of `streamFn`, or `undefined` on error.
     */
    start: (streamFn: StreamFn<T>, fallbackFn?: () => unknown) => Promise<T | undefined>
    /** Resets `streamedText` to empty without changing `isStreaming`. */
    reset: () => void
}

/**
 * Shared hook for RAF-debounced streaming text responses.
 *
 * Extracts the duplicated token-accumulation pattern from `MentorChatView`
 * and `AiTab` into a single reusable hook. State updates are coalesced via
 * `requestAnimationFrame` so rapid token callbacks do not flood React renders.
 */
export function useStreamingResponse<T>(): UseStreamingResponseReturn<T> {
    const [streamedText, setStreamedText] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)

    // Ref holds the latest accumulated text so the RAF closure always reads
    // the most recent value without becoming stale.
    const textRef = useRef('')

    const reset = useCallback(() => {
        setStreamedText('')
        textRef.current = ''
    }, [])

    const start = useCallback(
        async (streamFn: StreamFn<T>, fallbackFn?: () => unknown): Promise<T | undefined> => {
            setStreamedText('')
            textRef.current = ''
            setIsStreaming(true)

            let rafPending = false
            const onToken = (_token: string, accumulated: string) => {
                textRef.current = accumulated
                if (!rafPending) {
                    rafPending = true
                    requestAnimationFrame(() => {
                        rafPending = false
                        setStreamedText(textRef.current)
                    })
                }
            }

            try {
                return await streamFn(onToken)
            } catch {
                if (fallbackFn !== undefined) {
                    fallbackFn()
                }
                return undefined
            } finally {
                setIsStreaming(false)
            }
        },
        [],
    )

    return { streamedText, isStreaming, start, reset }
}
