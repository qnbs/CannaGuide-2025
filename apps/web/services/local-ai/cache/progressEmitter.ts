/**
 * Lightweight pub/sub for WebLLM model-loading progress.
 * Decouples the localAI service from Redux -- UI subscribes via
 * the useWebLlmLoadProgress() hook (useSyncExternalStore).
 */

export interface WebLlmLoadProgress {
    /** 0-1 fractional progress (from WebLLM InitProgressReport). */
    progress: number
    /** Human-readable status text from WebLLM (e.g. "Loading model from cache[1/3]"). */
    text: string
    /** Seconds elapsed since loading started. */
    timeElapsed: number
}

export type WebLlmLoadingState =
    | { status: 'idle' }
    | { status: 'loading'; report: WebLlmLoadProgress }
    | { status: 'ready' }
    | { status: 'error'; message: string }

type Listener = () => void

let state: WebLlmLoadingState = { status: 'idle' }
const listeners = new Set<Listener>()

const emit = (): void => {
    listeners.forEach((fn) => fn())
}

export const getWebLlmLoadingSnapshot = (): WebLlmLoadingState => state

export const subscribeWebLlmLoading = (listener: Listener): (() => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

/** Called from loadWebLlmEngine's initProgressCallback. */
export const reportWebLlmProgress = (report: WebLlmLoadProgress): void => {
    state = { status: 'loading', report }
    emit()
}

export const reportWebLlmReady = (): void => {
    state = { status: 'ready' }
    emit()
}

export const reportWebLlmError = (message: string): void => {
    state = { status: 'error', message }
    emit()
}

export const resetWebLlmLoadingState = (): void => {
    state = { status: 'idle' }
    emit()
}
