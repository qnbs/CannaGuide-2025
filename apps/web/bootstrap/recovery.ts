import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import { Sentry } from '@/services/sentryService'

export const SAFE_RECOVERY_ATTEMPT_KEY = 'cannaguide.safeRecoveryAttempted'

export const triggerSafeRecovery = async (
    reason: string,
    error?: unknown,
): Promise<boolean> => {
    try {
        const alreadyAttempted = sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY) === '1'
        if (alreadyAttempted) {
            return false
        }

        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')
        console.debug(`[SafeRecovery] Triggered by: ${reason}`, error)
        if (error instanceof Error) {
            Sentry.captureException(error, { tags: { recovery: reason } })
        }
        await indexedDBStorage.removeItem(REDUX_STATE_KEY)
        window.location.reload()
        return true
    } catch (recoveryError) {
        console.error('[SafeRecovery] Failed to reset persisted state.', recoveryError)
        return false
    }
}

export const registerRecoveryListeners = (): void => {
    window.addEventListener(
        'cannaguide-runtime-error',
        () => {
            void triggerSafeRecovery('runtime-error-event')
        },
        { once: true },
    )
    window.addEventListener(
        'cannaguide-safe-recovery-request',
        () => {
            void triggerSafeRecovery('manual-safe-recovery')
        },
        { once: true },
    )
}
