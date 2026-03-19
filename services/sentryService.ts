type SentryModule = typeof import('@sentry/react')

let _sentry: SentryModule | null = null
let _initPromise: Promise<void> | null = null

/**
 * Initializes Sentry error tracking for the application.
 * Dynamically imports @sentry/react to keep it off the critical rendering path.
 * Only activates in production when a DSN is configured.
 */
export const initSentry = (): void => {
    const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
    const isProd = import.meta.env.PROD

    if (!dsn || !isProd) {
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
                if (
                    event.exception?.values?.some((v) =>
                        v.stacktrace?.frames?.some(
                            (f) =>
                                f.filename?.includes('extensions/') ||
                                f.filename?.includes('chrome-extension'),
                        ),
                    )
                ) {
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

/** Lazy Sentry proxy — no-ops safely when SDK is not loaded. */
export const Sentry = {
    captureException(error: unknown, hint?: Parameters<SentryModule['captureException']>[1]): void {
        _sentry?.captureException(error, hint)
    },
    captureMessage(message: string, level?: Parameters<SentryModule['captureMessage']>[1]): void {
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
        backend?: 'webgpu' | 'wasm'
        retryAttempt?: number
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
        },
    })
}
