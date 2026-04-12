import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useWebLlmLoadProgress } from '@/hooks/useWebLlmLoadProgress'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cancelWebLlmDownload } from '@/services/local-ai'

/**
 * Global toast banner showing WebLLM model download/loading progress.
 * Renders at the bottom of the viewport during auto-preload so users
 * see that something is happening in the background.
 *
 * Dismissible -- closing hides the banner but does not cancel the preload.
 * Cancel button stops the download entirely.
 */
export const WebLlmPreloadBanner = memo(function WebLlmPreloadBanner() {
    const { t } = useTranslation()
    const loadState = useWebLlmLoadProgress()
    const [dismissed, setDismissed] = useState(false)

    const handleDismiss = useCallback(() => {
        setDismissed(true)
    }, [])

    const handleCancel = useCallback(() => {
        cancelWebLlmDownload()
        setDismissed(true)
    }, [])

    if (dismissed || loadState.status !== 'loading') {
        return null
    }

    const percent = Math.round(loadState.report.progress * 100)

    return (
        <div
            className="fixed bottom-20 left-1/2 z-[200] w-full max-w-sm -translate-x-1/2 animate-slide-in-up sm:bottom-4"
            role="status"
            aria-live="polite"
        >
            <div className="glass-pane mx-4 flex items-center gap-3 rounded-lg p-3">
                <PhosphorIcons.Brain weight="fill" className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">
                        {t('settingsView.offlineAi.downloadStageDownloading')}
                    </p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                            style={{ width: `${percent}%` }}
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t('common.webLlmLoading.ariaLabel')}
                        />
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {loadState.report.text} ({percent}%)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-red-400"
                    aria-label={t('settingsView.offlineAi.downloadCancelButton')}
                    title={t('settingsView.offlineAi.downloadCancelButton')}
                >
                    <PhosphorIcons.Stop weight="fill" className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-200"
                    aria-label={t('common.dismiss')}
                >
                    <PhosphorIcons.X weight="regular" className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
})
