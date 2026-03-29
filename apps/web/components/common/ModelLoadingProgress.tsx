import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useWebLlmLoadProgress } from '@/hooks/useWebLlmLoadProgress'

/** Format seconds into mm:ss or just "Xs" for short durations. */
const formatTime = (seconds: number): string => {
    const s = Math.round(seconds)
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, '0')}`
}

/** Estimate remaining time from progress fraction and elapsed time. */
const estimateEta = (progress: number, elapsed: number): string | null => {
    if (progress <= 0.01 || elapsed <= 0) return null
    const totalEstimate = elapsed / progress
    const remaining = totalEstimate - elapsed
    if (remaining < 1) return null
    return formatTime(remaining)
}

/**
 * Displays WebLLM model-loading progress inline.
 * Only renders when a model is actively loading.
 * Uses the webLlmProgressEmitter pub/sub (no Redux).
 */
export const ModelLoadingProgress: React.FC = memo(() => {
    const loadState = useWebLlmLoadProgress()
    const { t } = useTranslation()

    const eta = useMemo(() => {
        if (loadState.status !== 'loading') return null
        return estimateEta(loadState.report.progress, loadState.report.timeElapsed)
    }, [loadState])

    if (loadState.status !== 'loading') return null

    const { progress, text } = loadState.report
    const pct = Math.round(progress * 100)

    // Derive a user-friendly status line from the raw WebLLM text
    const statusText = text || t('ai.webLlmLoading.loadingModel')

    return (
        <div
            className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-4 space-y-2"
            role="status"
            aria-live="polite"
            aria-label={t('ai.webLlmLoading.ariaLabel')}
        >
            <div className="flex items-center gap-2 text-sm text-slate-300">
                <PhosphorIcons.Brain className="w-5 h-5 text-primary-400 animate-pulse flex-shrink-0" />
                <span className="truncate">{statusText}</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Percentage + ETA */}
            <div className="flex justify-between text-xs text-slate-500 tabular-nums">
                <span>{pct}%</span>
                {eta && <span>{t('ai.webLlmLoading.eta', { time: eta })}</span>}
            </div>
        </div>
    )
})

ModelLoadingProgress.displayName = 'ModelLoadingProgress'
