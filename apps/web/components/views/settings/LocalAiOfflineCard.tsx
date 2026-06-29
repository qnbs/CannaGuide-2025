import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting, setLlmModel } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/common/Card'
import { localAiPreloadService } from '@/services/local-ai'
import { detectOnnxBackend, setForceWasm, getGpuTier } from '@/services/local-ai'
import { LlmModelSelector } from './LlmModelSelector'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { BatteryEcoStatusBadge } from './BatteryEcoStatusBadge'

export const LocalAiOfflineCard: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const isOffline = useOnlineStatus()
    const [isBusy, setIsBusy] = useState(false)
    const [status, setStatus] = useState(() => {
        try {
            return localAiPreloadService.getStatus()
        } catch {
            return {
                state: 'idle' as const,
                textModelReady: false,
                visionModelReady: false,
                embeddingModelReady: false,
                sentimentModelReady: false,
                summarizationModelReady: false,
                zeroShotTextModelReady: false,
                languageDetectionReady: false,
                imageSimilarityReady: false,
                webLlmReady: false,
                persistentStorageGranted: null,
                readyAt: null,
                details: null,
            }
        }
    })
    const [progress, setProgress] = useState<{
        loaded: number
        total: number
        label: string
    } | null>(null)
    const [preloadDurationMs, setPreloadDurationMs] = useState<number | null>(null)
    const [healthStatus, setHealthStatus] = useState<string | null>(null)
    const [deviceClass, setDeviceClass] = useState<string | null>(null)
    const supportsWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator
    let onnxBackend: string = 'wasm'
    try {
        onnxBackend = detectOnnxBackend()
    } catch {
        // Graceful degradation
    }

    useEffect(() => {
        let cancelled = false
        const loadHealth = async () => {
            try {
                const { quickHealthCheck, classifyDevice } = await import('@/services/local-ai')
                if (cancelled) return
                const check = quickHealthCheck()
                setHealthStatus(check.status)
                setDeviceClass(classifyDevice())
            } catch (error) {
                console.debug('[Settings] Health check failed', error)
                setHealthStatus('unknown')
            }
        }
        void loadHealth()
        return () => {
            cancelled = true
        }
    }, [status])

    const safeGpuTier = (() => {
        try {
            return getGpuTier()
        } catch {
            return 'none' as const
        }
    })()

    const localAiSettings = settings.localAi ?? {
        forceWasm: false,
        preferredTextModel: 'auto' as const,
    }

    const handlePreload = async () => {
        setIsBusy(true)
        setProgress(null)
        const startTime = performance.now()
        try {
            const nextStatus = await localAiPreloadService.preloadOfflineModels(
                (loaded, total, label) => setProgress({ loaded, total, label }),
            )
            setPreloadDurationMs(performance.now() - startTime)
            setStatus(nextStatus)
        } finally {
            setIsBusy(false)
            setProgress(null)
        }
    }

    const handleForceWasmToggle = () => {
        const next = !localAiSettings.forceWasm
        setForceWasm(next)
        dispatch(setSetting({ path: 'localAi.forceWasm', value: next }))
    }

    const handleModelChange = (modelId: string) => {
        dispatch(setLlmModel(modelId))
        import('@/services/local-ai').then(({ setPreferredModelOverride }) => {
            setPreferredModelOverride(modelId === 'auto' ? null : modelId)
        })
    }

    const statusLabel = (() => {
        switch (status.state) {
            case 'ready':
                return t('settingsView.offlineAi.ready')
            case 'partial':
                return t('settingsView.offlineAi.partial')
            case 'preloading':
                return t('settingsView.offlineAi.preloading')
            case 'error':
                return t('settingsView.offlineAi.error')
            default:
                return t('settingsView.offlineAi.idle')
        }
    })()

    return (
        <Card data-testid="local-ai-offline-cache-section">
            <FormSection
                title={t('settingsView.offlineAi.title')}
                icon={<PhosphorIcons.DownloadSimple />}
                defaultOpen
            >
                <div className="sm:col-span-2 space-y-4">
                    <p className="text-sm text-slate-400">
                        {t('settingsView.offlineAi.description')}
                    </p>
                    <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 text-sm text-slate-300 space-y-1">
                        <p>{statusLabel}</p>
                        {healthStatus && (
                            <p>
                                {t('settingsView.offlineAi.healthStatus', { value: healthStatus })}
                            </p>
                        )}
                        {deviceClass && (
                            <p>{t('settingsView.offlineAi.deviceClass', { value: deviceClass })}</p>
                        )}
                        <p>
                            {t('settingsView.offlineAi.cacheState', {
                                value: status.details ?? 'n/a',
                            })}
                        </p>
                        <p>
                            {t('settingsView.offlineAi.persistentStorage', {
                                value:
                                    status.persistentStorageGranted === null
                                        ? t('settingsView.offlineAi.unknown')
                                        : status.persistentStorageGranted
                                          ? t('settingsView.offlineAi.yes')
                                          : t('settingsView.offlineAi.no'),
                            })}
                        </p>
                        <p>
                            {supportsWebGpu
                                ? t('settingsView.offlineAi.webGpuSupported')
                                : t('settingsView.offlineAi.webGpuUnavailable')}
                        </p>
                        <p>{t('settingsView.offlineAi.onnxBackend', { value: onnxBackend })}</p>
                        <p>
                            {status.webLlmReady
                                ? t('settingsView.offlineAi.webLlmReady')
                                : t('settingsView.offlineAi.webLlmFallback')}
                        </p>
                        {status.languageDetectionReady && (
                            <p>{t('settingsView.offlineAi.langDetectionReady')}</p>
                        )}
                        {status.imageSimilarityReady && (
                            <p>{t('settingsView.offlineAi.imgSimilarityReady')}</p>
                        )}
                        {status.readyAt && (
                            <p>
                                {t('settingsView.offlineAi.readyAt', {
                                    value: new Date(status.readyAt).toLocaleString(),
                                })}
                            </p>
                        )}
                        <p className="text-xs text-slate-500 pt-1">
                            {t('settingsView.offlineAi.modelsLoaded', {
                                loaded: [
                                    status.textModelReady,
                                    status.visionModelReady,
                                    status.embeddingModelReady,
                                    status.sentimentModelReady,
                                    status.summarizationModelReady,
                                    status.zeroShotTextModelReady,
                                    status.languageDetectionReady,
                                    status.imageSimilarityReady,
                                ].filter(Boolean).length,
                                total: 8,
                            })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={handlePreload} disabled={isBusy || isOffline}>
                            {isBusy
                                ? t('settingsView.offlineAi.preloading')
                                : t('settingsView.offlineAi.preload')}
                        </Button>
                    </div>
                    {isBusy && progress && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{progress.label}</span>
                                <span>
                                    {progress.loaded}/{progress.total}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-700">
                                <div
                                    className="h-2 rounded-full bg-primary-500 transition-all duration-300"
                                    style={{
                                        width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {isOffline && (
                        <p className="text-xs text-amber-300">
                            {t('settingsView.offlineAi.offlineHint')}
                        </p>
                    )}
                    <div className="space-y-3 border-t border-slate-700/60 pt-3">
                        <BatteryEcoStatusBadge />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-200">
                                    {t('settingsView.offlineAi.forceWasm')}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {t('settingsView.offlineAi.forceWasmHint')}
                                </p>
                            </div>
                            <Switch
                                checked={localAiSettings.forceWasm}
                                onChange={handleForceWasmToggle}
                            />
                        </div>
                        <div>
                            <LlmModelSelector
                                selectedModelId={localAiSettings.selectedLlmModelId ?? 'auto'}
                                onSelect={handleModelChange}
                                gpuTier={safeGpuTier}
                            />
                        </div>
                        <div className="text-xs text-slate-400">
                            {preloadDurationMs != null ? (
                                <p>
                                    {t('settingsView.offlineAi.benchPreloadTime', {
                                        value: (preloadDurationMs / 1000).toFixed(1),
                                    })}
                                </p>
                            ) : (
                                <p>{t('settingsView.offlineAi.benchNotAvailable')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </FormSection>
        </Card>
    )
}
