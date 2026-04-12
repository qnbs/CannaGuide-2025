/**
 * localRoutingService.ts
 * ---------------------
 * Routing infrastructure for the AI service layer.
 *
 * Decides whether an AI request should be handled by the cloud provider,
 * the on-device local-AI stack, or the heuristic fallback layer.
 *
 * Extracted from aiService.ts (Phase 2 -- Core Decoupling).
 */
import {
    localAiPreloadService,
    setEcoModeExplicit,
    registerModeAccessors,
    isEcoMode,
    isCriticalBattery,
} from '@/services/local-ai'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { captureLocalAiError } from '@/services/sentryService'
import type { AiMode } from '@/types'

const DYNAMIC_IMPORT_TIMEOUT_MS = 15_000

// ── Lazy service loaders ──────────────────────────────────

export const getGeminiService = async (): Promise<
    (typeof import('@/services/geminiService'))['geminiService']
> => {
    const { geminiService } = await import('@/services/geminiService')
    return geminiService
}

export const getLocalAiService = async (): Promise<
    (typeof import('@/services/local-ai'))['localAiService']
> => {
    const importPromise = import('@/services/local-ai').then((m) => m.localAiService)
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
            () => reject(new Error('Local AI dynamic import timeout')),
            DYNAMIC_IMPORT_TIMEOUT_MS,
        ),
    )
    return Promise.race([importPromise, timeoutPromise])
}

// ── AI mode state ─────────────────────────────────────────

/** True when the device is offline or has no usable network. */
const isOffline = (): boolean => typeof navigator !== 'undefined' && navigator.onLine === false

let _aiMode: AiMode = 'hybrid'

// Register accessors so the eco module can read/write mode without circular deps
registerModeAccessors(
    () => _aiMode,
    (mode: string) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        _aiMode = mode as AiMode
    },
)

/** Called from the listener middleware whenever the setting changes. */
export const setAiMode = (mode: AiMode): void => {
    _aiMode = mode
    setEcoModeExplicit(mode === 'eco')
}

/** Returns the current AI execution mode. */
export const getAiMode = (): AiMode => _aiMode

/** Re-export for convenience. */
export { isEcoMode }

// ── Routing decisions ─────────────────────────────────────

/**
 * Determines whether to use the local AI stack instead of the cloud API.
 *
 * - **localOnlyMode**: always route locally (privacy mode -- no outbound traffic)
 * - **local**:  always route locally (device-only)
 * - **eco**:    always route locally, but only 0.5B model + rule-based heuristics
 * - **cloud**:  only route locally when the device is offline
 * - **hybrid**: route locally when offline OR when local models are pre-loaded
 */
export const shouldRouteLocally = (): boolean => {
    // Critical battery: force cloud/heuristic, never run local ML inference
    if (isCriticalBattery() && !isOffline()) return false
    if (isLocalOnlyMode()) return true
    if (_aiMode === 'local' || _aiMode === 'eco') return true
    if (_aiMode === 'cloud') return isOffline()
    // hybrid: original smart-routing logic
    return isOffline() || localAiPreloadService.isReady()
}

/**
 * Wraps a cloud AI call with an automatic fallback to the local AI stack.
 * If the cloud call throws (network error, quota, invalid key, ...)
 * the `localFallback` callback is invoked instead so the user always
 * gets a response.
 *
 * In **local** or **localOnlyMode** the cloud call is never attempted.
 */
export async function withLocalFallback<T>(
    cloudFn: () => Promise<T>,
    localFallback: () => T | Promise<T>,
): Promise<T> {
    if (_aiMode === 'local' || _aiMode === 'eco' || isLocalOnlyMode()) return localFallback()
    try {
        return await cloudFn()
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (msg.startsWith('ai.error.rateLimited')) {
            const seconds = msg.split(':')[1] ?? '60'
            const { useUIStore } = await import('@/stores/useUIStore')
            const { getT } = await import('@/i18n')
            useUIStore.getState().addNotification({
                message: getT()('common.ai.rateLimited', { seconds }),
                type: 'error',
            })
        }
        console.debug('[AI] Cloud call failed, falling back to local AI:', msg)
        return localFallback()
    }
}

/**
 * Routes an AI call through local-first, cloud, or heuristic fallback
 * based on the current AI mode and device connectivity.
 */
export const runRouted = async <T>(
    localCall: () => Promise<T>,
    cloudCall: () => Promise<T>,
    fallbackCall: () => Promise<T> | T,
): Promise<T> => {
    if (shouldRouteLocally()) {
        return localCall()
    }
    return withLocalFallback(cloudCall, fallbackCall)
}

/**
 * Convenience wrapper that lazily imports the local AI service and
 * passes it to the supplied callback.
 */
export const withLocalService = async <T>(
    fn: (local: Awaited<ReturnType<typeof getLocalAiService>>) => Promise<T>,
): Promise<T> => {
    const local = await getLocalAiService()
    return fn(local)
}

/** Sentry error capture re-export for collocated usage. */
export { captureLocalAiError }
