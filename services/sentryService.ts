import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const IS_PRODUCTION = import.meta.env.PROD

/**
 * Initializes Sentry error tracking for the application.
 * Only activates in production when a DSN is configured.
 */
export const initSentry = (): void => {
  if (!SENTRY_DSN || !IS_PRODUCTION) {
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? 'production' : 'development',
    release: `cannaguide@${__APP_VERSION__}`,

    // Performance monitoring — sample 10% of transactions
    tracesSampleRate: 0.1,

    // Session replay — 1% of sessions, 100% on error
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out noise
    beforeSend(event) {
      // Don't send events from extensions or third-party scripts
      if (event.exception?.values?.some(v =>
        v.stacktrace?.frames?.some(f =>
          f.filename?.includes('extensions/') ||
          f.filename?.includes('chrome-extension')
        )
      )) {
        return null
      }
      return event
    },

    // Ignore common non-actionable errors
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
}

export { Sentry }

/**
 * Captures a local AI error with structured tags for dashboard filtering.
 * Safe to call in production — no-ops when Sentry is not initialized.
 */
export const captureLocalAiError = (
  error: unknown,
  context: {
    model?: string
    stage: 'preload' | 'inference' | 'vision' | 'webllm' | 'fallback'
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
