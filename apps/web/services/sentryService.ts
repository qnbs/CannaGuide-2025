type SentryModule = typeof import('@sentry/react')

let _sentry: SentryModule | null = null
let _initPromise: Promise<void> | null = null
let _sentryDisabledByLocalOnly = false

type SentryFrameLike = { filename?: string }
type SentryExceptionValueLike = { stacktrace?: { frames?: SentryFrameLike[] } }
type SentryEventLike = { exception?: { values?: SentryExceptionValueLike[] } }

const isExtensionFrame = (filename?: string): boolean =>
    Boolean(filename?.includes('extensions/') || filename?.includes('chrome-extension'))

const shouldDropSentryEvent = (event: SentryEventLike): boolean => {
    const values = event.exception?.values
    if (!values) {
        return false
    }

    return values.some((value) =>
        value.stacktrace?.frames?.some((frame) => isExtensionFrame(frame.filename)),
    )
}

/**
 * Disables Sentry at runtime (used by Local-Only Mode).
 * After calling this, all Sentry proxy methods become no-ops.
 */
export const disableSentry = (): void => {
    _sentryDisabledByLocalOnly = true
    if (_sentry) {
        _sentry.close()
        _sentry = null
    }
}

/** Re-enables Sentry. Takes effect only if DSN is configured and in production. */
export const enableSentry = (): void => {
    _sentryDisabledByLocalOnly = false
    // Re-init on next call (lazy)
    if (!_sentry && !_initPromise) {
        initSentry()
    }
}

/**
 * Initializes Sentry error tracking for the application.
 * Dynamically imports @sentry/react to keep it off the critical rendering path.
 * Only activates in production when a DSN is configured.
 */
export const initSentry = (): void => {
    const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
    const isProd = import.meta.env.PROD

    if (!dsn || !isProd || _sentryDisabledByLocalOnly) {
        return
    }

    _initPromise = import('@sentry/react').then((mod) => {
        _sentry = mod
        mod.init({
            dsn,
            environment: 'production',
            release: `cannaguide@${__APP_VERSION__}`,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.01,
            replaysOnErrorSampleRate: 1.0,
            integrations: [
                mod.browserTracingIntegration(),
                mod.replayIntegration({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],
            beforeSend(event) {
                if (shouldDropSentryEvent(event)) {
                    return null
                }
                return event
            },
            ignoreErrors: [
                'ResizeObserver loop',
                'Non-Error promise rejection',
                'AbortError',
                'NetworkError',
                'Load failed',
                'Failed to fetch',
                'ChunkLoadError',
            ],
        })
    })
}

/** Lazy Sentry proxy — no-ops safely when SDK is not loaded or Local-Only Mode is active. */
export const Sentry = {
    captureException(error: unknown, hint?: Parameters<SentryModule['captureException']>[1]): void {
        if (_sentryDisabledByLocalOnly) return
        _sentry?.captureException(error, hint)
    },
    captureMessage(message: string, level?: Parameters<SentryModule['captureMessage']>[1]): void {
        if (_sentryDisabledByLocalOnly) return
        _sentry?.captureMessage(message, level)
    },
    get ready(): Promise<void> {
        return _initPromise ?? Promise.resolve()
    },
}

/**
 * Captures a local AI error with structured tags for dashboard filtering.
 * Safe to call in production — no-ops when Sentry is not loaded.
 */
export const captureLocalAiError = (
    error: unknown,
    context: {
        model?: string
        stage:
            | 'preload'
            | 'inference'
            | 'vision'
            | 'webllm'
            | 'fallback'
            | 'embedding'
            | 'sentiment'
            | 'summarization'
            | 'classification'
            | 'cache'
            | 'cache-read'
            | 'cache-write'
            | 'cache-clear'
            | 'cache-persist'
            | 'batch'
            | 'similarity-candidate'
            | 'growth-extraction'
            | 'image-generation'
            | 'image-generation-local'
            | 'image-cache-read'
            | 'image-cache-write'
            | 'image-cache-clear'
            | 'gpu-mutex-eviction'
            | 'gpu-mutex-rehydrate'
            | 'gpu-mutex-auto-release'
            | 'webllm-eviction'
            | 'webllm-diagnostics'
            | 'webllm-streaming'
            | 'webgpu-probe'
            | 'webgpu-device-create'
            | 'webgpu-device-destroy-pagehide'
            | 'webgpu-device-destroy-hidden'
            | 'webgpu-device-destroy-explicit'
            | 'hydro-forecast'
            | 'storage-estimate'
            | 'worker-inference-fallthrough'
            | 'preload-embedding'
            | 'preload-nlp'
            | 'preload-storage-check'
            | 'webllm-storage-check'
            | 'response-validation'
        backend?: 'webgpu' | 'wasm'
        retryAttempt?: number
        batchItem?: number
        candidateIndex?: number
        consumer?: string
    },
): void => {
    Sentry.captureException(error, {
        tags: {
            feature: 'local-ai',
            'ai.stage': context.stage,
            ...(context.model && { 'ai.model': context.model }),
            ...(context.backend && { 'ai.backend': context.backend }),
        },
        extra: {
            retryAttempt: context.retryAttempt ?? 0,
            ...(context.batchItem !== undefined && { batchItem: context.batchItem }),
            ...(context.candidateIndex !== undefined && { candidateIndex: context.candidateIndex }),
        },
    })
}
