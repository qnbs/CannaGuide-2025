import { readRunningBuildVersion } from '@/services/deployIdentity'

type SentryModule = typeof import('@sentry/react')

let _sentry: SentryModule | null = null
let _initPromise: Promise<void> | null = null
let _sentryDisabledByLocalOnly = false

/**
 * Until the saved Local-Only setting is known (after hydration), nothing may leave the
 * device: the SDK is not started, and errors are only remembered here, in memory. Once
 * the setting is known they are sent (Local-Only off) or dropped (Local-Only on), see
 * resolveSentryAfterHydration (GH #586).
 */
const EARLY_ERROR_LIMIT = 20
let _localOnlyKnown = false
let _earlyErrors: unknown[] = []
let _stopEarlyCapture: (() => void) | null = null

const rememberEarlyError = (error: unknown): void => {
    if (_earlyErrors.length < EARLY_ERROR_LIMIT) _earlyErrors.push(error)
}

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

/**
 * Bootstrap step, before anything else runs: remember uncaught errors and rejections
 * in memory, but start no SDK, because the saved Local-Only setting is not known yet.
 */
export const captureEarlyErrors = (): void => {
    if (_localOnlyKnown || _stopEarlyCapture || typeof window === 'undefined') return
    const onError = (event: ErrorEvent): void => rememberEarlyError(event.error ?? event.message)
    const onRejection = (event: PromiseRejectionEvent): void => rememberEarlyError(event.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    _stopEarlyCapture = () => {
        window.removeEventListener('error', onError)
        window.removeEventListener('unhandledrejection', onRejection)
        _stopEarlyCapture = null
    }
}

/**
 * The saved Local-Only setting is known. With Local-Only on, error reporting stays off
 * and what was remembered is dropped; with it off, Sentry starts and the remembered
 * errors are sent once the SDK is ready. A page whose hydration never completes never
 * starts Sentry: without the saved setting, nothing is sent.
 */
export const resolveSentryAfterHydration = (localOnly: boolean): void => {
    _localOnlyKnown = true
    _stopEarlyCapture?.()
    const early = _earlyErrors
    _earlyErrors = []
    if (localOnly) {
        disableSentry()
        return
    }
    _sentryDisabledByLocalOnly = false
    initSentry()
    void _initPromise?.then(() => {
        for (const error of early) Sentry.captureException(error)
    })
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

    const version = readRunningBuildVersion()
    _initPromise = import('@sentry/react').then((mod) => {
        // Local-only mode may have switched Sentry off while the SDK was loading.
        // Forget the pending init too, or enableSentry() could never start it again.
        if (_sentryDisabledByLocalOnly) {
            _initPromise = null
            return
        }
        _sentry = mod
        mod.init({
            dsn,
            environment: 'production',
            release: `cannaguide@${version}`,
            // SDK v11 dropped `sendDefaultPii` and collects everything while
            // `dataCollection` is unset: user/IP, cookies, request and response
            // bodies, headers, query strings, local variables. Error reports here
            // need none of it, so every category is off (#834). Session Replay is
            // separate and stays masked below (GH #586).
            dataCollection: {
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
            },
            // Keep v10's transaction model; v11 defaults to span streaming.
            traceLifecycle: 'static',
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.01,
            replaysOnErrorSampleRate: 1.0,
            integrations: [
                mod.browserTracingIntegration(),
                // Replays must never carry what the user wrote or photographed:
                // journal entries, notes, strain names, settings values, plant
                // photos (GH #586). Text and inputs are masked, media blocked.
                mod.replayIntegration({
                    maskAllText: true,
                    maskAllInputs: true,
                    blockAllMedia: true,
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
        if (!_localOnlyKnown) {
            rememberEarlyError(error)
            return
        }
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
