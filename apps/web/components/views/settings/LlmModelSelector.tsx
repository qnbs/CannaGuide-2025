import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getAllModels, autoSelectModel, type WebLlmModel } from '@/services/webLlmModelCatalog'
import type { GpuTier } from '@/services/localAiWebGpuService'
import { useWebLlmLoadProgress } from '@/hooks/useWebLlmLoadProgress'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatMb = (bytes: number): number => Math.round(bytes / 1_000_000)

// ─── Model Card ──────────────────────────────────────────────────────────────

interface ModelCardProps {
    model: WebLlmModel
    isSelected: boolean
    onSelect: (id: string) => void
}

const ModelCard = memo(function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
    const { t } = useTranslation()
    const handleClick = useCallback(() => onSelect(model.id), [onSelect, model.id])

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={isSelected}
            className={cn(
                'w-full min-w-0 text-left rounded-lg border p-3 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500',
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-slate-100 truncate min-w-0">
                    {model.label}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <span className="text-xs rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">
                        {model.sizeTier}
                    </span>
                    {model.recommended && (
                        <span className="text-xs rounded bg-emerald-700/60 px-1.5 py-0.5 text-emerald-300">
                            {t('settingsView.offlineAi.modelSelector.recommended')}
                        </span>
                    )}
                    {model.requiresWebGPU && (
                        <span className="text-xs rounded bg-purple-800/50 px-1.5 py-0.5 text-purple-300">
                            {t('settingsView.offlineAi.modelSelector.webGpu')}
                        </span>
                    )}
                </div>
            </div>
            <p className="text-xs text-slate-400 mb-1.5">
                {t(
                    `settingsView.offlineAi.modelSelector.model_${model.sizeTier.replace('.', '')}_desc`,
                )}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                    {t('settingsView.offlineAi.modelSelector.downloadSize', {
                        size: formatMb(model.sizeBytes),
                    })}
                </span>
                {model.sizeBytes > 1_000_000_000 && (
                    <span className="text-amber-400">
                        {t('settingsView.offlineAi.modelSelector.largeDownload')}
                    </span>
                )}
            </div>
        </button>
    )
})

// ─── Auto Card ───────────────────────────────────────────────────────────────

interface AutoCardProps {
    isSelected: boolean
    autoModel: WebLlmModel
    onSelect: () => void
}

const AutoCard = memo(function AutoCard({ isSelected, autoModel, onSelect }: AutoCardProps) {
    const { t } = useTranslation()
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isSelected}
            className={cn(
                'w-full min-w-0 text-left rounded-lg border p-3 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800/60 hover:border-slate-500',
            )}
        >
            <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-slate-100 truncate min-w-0">
                    {t('settingsView.offlineAi.modelSelector.autoLabel')}
                </span>
                <span className="text-xs rounded bg-blue-800/50 px-1.5 py-0.5 text-blue-300 flex-shrink-0">
                    {t('settingsView.offlineAi.modelSelector.recommended')}
                </span>
            </div>
            <p className="text-xs text-slate-400 mb-1.5">
                {t('settingsView.offlineAi.modelSelector.autoDesc')}
            </p>
            <p className="text-xs text-slate-500">
                {t('settingsView.offlineAi.modelSelector.currentAuto', { model: autoModel.label })}
            </p>
        </button>
    )
})

// ─── Progress Bar ────────────────────────────────────────────────────────────

const LoadingProgress = memo(function LoadingProgress() {
    const { t } = useTranslation()
    const loadState = useWebLlmLoadProgress()
    if (loadState.status !== 'loading') return null

    const percent = Math.round(loadState.report.progress * 100)
    return (
        <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-400">{loadState.report.text}</p>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-emerald-500 rounded-full transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('settingsView.offlineAi.modelSelector.loading')}
                />
            </div>
        </div>
    )
})

// ─── Main Component ──────────────────────────────────────────────────────────

export interface LlmModelSelectorProps {
    selectedModelId: string
    onSelect: (id: string) => void
    gpuTier: GpuTier
}

export const LlmModelSelector = memo(function LlmModelSelector({
    selectedModelId,
    onSelect,
    gpuTier,
}: LlmModelSelectorProps) {
    const { t } = useTranslation()
    const models = useMemo(() => getAllModels(), [])
    const autoModel = useMemo(() => autoSelectModel(gpuTier), [gpuTier])
    const isAuto = selectedModelId === 'auto'

    const handleAutoSelect = useCallback(() => onSelect('auto'), [onSelect])

    return (
        <div className="space-y-3 overflow-hidden">
            <div>
                <h4 className="text-sm font-medium text-slate-200 mb-1">
                    {t('settingsView.offlineAi.modelSelector.title')}
                </h4>
                <p className="text-xs text-slate-500">
                    {t('settingsView.offlineAi.modelSelector.subtitle')}
                </p>
            </div>

            <div className="grid gap-2">
                <AutoCard isSelected={isAuto} autoModel={autoModel} onSelect={handleAutoSelect} />
                {models.map((model) => (
                    <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={!isAuto && selectedModelId === model.id}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            <LoadingProgress />
        </div>
    )
})
