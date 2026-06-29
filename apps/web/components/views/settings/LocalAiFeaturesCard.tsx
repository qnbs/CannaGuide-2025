import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/common/Card'
import { SettingsRow } from './SettingsShared'

export const LocalAiFeaturesCard: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const localAi = settings.localAi ?? {}
    const [telemetry, setTelemetry] = useState<{
        totalInferences: number
        avgLatency: number
        avgSpeed: number
        cacheHitRate: number
        successRate: number
        peakSpeed: number
    } | null>(null)
    const [cacheCount, setCacheCount] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        const loadTelemetry = async () => {
            try {
                const { getSnapshot } = await import('@/services/local-ai')
                if (cancelled) return
                const snap = getSnapshot()
                setTelemetry({
                    totalInferences: snap.totalInferences,
                    avgLatency: snap.averageLatencyMs,
                    avgSpeed: snap.averageTokensPerSecond,
                    cacheHitRate: snap.cacheHitRate * 100,
                    successRate: snap.successRate * 100,
                    peakSpeed: snap.peakTokensPerSecond,
                })
            } catch {
                // Non-critical
            }
        }
        const loadCacheCount = async () => {
            try {
                const { getCacheSize } = await import('@/services/local-ai')
                if (cancelled) return
                setCacheCount(await getCacheSize())
            } catch {
                // Non-critical
            }
        }
        void loadTelemetry()
        void loadCacheCount()
        return () => {
            cancelled = true
        }
    }, [])

    const handleToggle = (path: string, value: boolean) => {
        dispatch(setSetting({ path: `localAi.${path}`, value }))
    }

    const handleClearCache = async () => {
        try {
            const { clearPersistentCache } = await import('@/services/local-ai')
            await clearPersistentCache()
            setCacheCount(0)
        } catch {
            // Non-critical
        }
    }

    return (
        <>
            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.modelStatusTitle')}
                    icon={<PhosphorIcons.Lightning />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSemanticRag')}
                            description={t('settingsView.offlineAi.enableSemanticRagHint')}
                        >
                            <Switch
                                checked={localAi.enableSemanticRag ?? true}
                                onChange={(val) => handleToggle('enableSemanticRag', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSentiment')}
                            description={t('settingsView.offlineAi.enableSentimentHint')}
                        >
                            <Switch
                                checked={localAi.enableSentimentAnalysis ?? true}
                                onChange={(val) => handleToggle('enableSentimentAnalysis', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableSummarization')}
                            description={t('settingsView.offlineAi.enableSummarizationHint')}
                        >
                            <Switch
                                checked={localAi.enableSummarization ?? true}
                                onChange={(val) => handleToggle('enableSummarization', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableQueryClassification')}
                            description={t('settingsView.offlineAi.enableQueryClassificationHint')}
                        >
                            <Switch
                                checked={localAi.enableQueryClassification ?? true}
                                onChange={(val) => handleToggle('enableQueryClassification', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.ecoMode')}
                            description={t('settingsView.offlineAi.ecoModeHint')}
                        >
                            <Switch
                                checked={localAi.ecoMode ?? false}
                                onChange={(val) => handleToggle('ecoMode', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.ecoModeForced')}
                            description={t('settingsView.offlineAi.ecoModeForcedHint')}
                        >
                            <Switch
                                checked={localAi.ecoModeForced ?? false}
                                onChange={(val) => handleToggle('ecoModeForced', val)}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.enablePersistentCache')}
                    icon={<PhosphorIcons.Database />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enablePersistentCache')}
                            description={t('settingsView.offlineAi.enablePersistentCacheHint')}
                        >
                            <Switch
                                checked={localAi.enablePersistentCache ?? true}
                                onChange={(val) => handleToggle('enablePersistentCache', val)}
                            />
                        </SettingsRow>
                        {cacheCount != null && (
                            <div className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-3">
                                <span className="text-slate-300">
                                    {t('settingsView.offlineAi.persistentCacheSize', {
                                        value: cacheCount,
                                    })}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleClearCache}
                                    disabled={cacheCount === 0}
                                >
                                    {t('settingsView.offlineAi.clearPersistentCache')}
                                </Button>
                            </div>
                        )}
                        <SettingsRow
                            label={t('settingsView.offlineAi.maxCacheSize')}
                            description={t('settingsView.offlineAi.maxCacheSizeHint')}
                        >
                            <RangeSlider
                                singleValue
                                value={localAi.maxInferenceCacheSize ?? 256}
                                onChange={(v) =>
                                    dispatch(
                                        setSetting({
                                            path: 'localAi.maxInferenceCacheSize',
                                            value: v,
                                        }),
                                    )
                                }
                                min={64}
                                max={1024}
                                step={64}
                                label=""
                                unit=""
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.offlineAi.inferenceTimeout')}
                            description={t('settingsView.offlineAi.inferenceTimeoutHint')}
                        >
                            <RangeSlider
                                singleValue
                                value={(localAi.inferenceTimeoutMs ?? 60000) / 1000}
                                onChange={(v) =>
                                    dispatch(
                                        setSetting({
                                            path: 'localAi.inferenceTimeoutMs',
                                            value: v * 1000,
                                        }),
                                    )
                                }
                                min={10}
                                max={180}
                                step={5}
                                label=""
                                unit="s"
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.offlineAi.enableTelemetry')}
                    icon={<PhosphorIcons.ChartLineUp />}
                >
                    <div className="sm:col-span-2 space-y-4">
                        <SettingsRow
                            label={t('settingsView.offlineAi.enableTelemetry')}
                            description={t('settingsView.offlineAi.enableTelemetryHint')}
                        >
                            <Switch
                                checked={localAi.enableTelemetry ?? true}
                                onChange={(val) => handleToggle('enableTelemetry', val)}
                            />
                        </SettingsRow>
                        {telemetry && localAi.enableTelemetry !== false && (
                            <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-3 text-sm text-slate-300 space-y-1">
                                <p>
                                    {t('settingsView.offlineAi.telemetryInferences', {
                                        value: telemetry.totalInferences,
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryAvgLatency', {
                                        value: telemetry.avgLatency.toFixed(0),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryAvgSpeed', {
                                        value: telemetry.avgSpeed.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryPeakSpeed', {
                                        value: telemetry.peakSpeed.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetryCacheHitRate', {
                                        value: telemetry.cacheHitRate.toFixed(1),
                                    })}
                                </p>
                                <p>
                                    {t('settingsView.offlineAi.telemetrySuccessRate', {
                                        value: telemetry.successRate.toFixed(1),
                                    })}
                                </p>
                            </div>
                        )}
                    </div>
                </FormSection>
            </Card>
        </>
    )
}
LocalAiFeaturesCard.displayName = 'LocalAiFeaturesCard'
