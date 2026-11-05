import { ModelDownloadBlockedError } from '@cannaguide/ai-core/ml'

let told = false

/**
 * Tells the user once per session that Local-Only Mode kept an AI model from
 * downloading (GH #700), so a simpler answer from the fallback does not look
 * like a broken model. Any other error is ignored here; callers rethrow it.
 */
export const reportModelDownloadBlocked = (error: unknown): void => {
    if (told || !(error instanceof ModelDownloadBlockedError)) return
    told = true
    void Promise.all([import('@/i18n'), import('@/stores/useUIStore')]).then(
        ([{ getT }, { useUIStore }]) => {
            useUIStore.getState().addNotification({
                message: getT()('common.egress.modelDownloadBlocked'),
                type: 'info',
            })
        },
    )
}

/** Test-only: forget that the notice was shown. */
export const resetModelDownloadBlockedNoticeForTests = (): void => {
    told = false
}
