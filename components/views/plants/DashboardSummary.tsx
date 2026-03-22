import React, { memo, useState, useEffect } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectGardenHealthMetrics,
    selectActivePlants,
    selectLanguage,
    selectSettings,
} from '@/stores/selectors'
import { waterAllPlants, setGlobalEnvironment } from '@/stores/slices/simulationSlice'
import { RangeSlider } from '@/components/common/RangeSlider'
import { VPDGauge } from './VPDGauge'
import { useGetGardenStatusSummaryMutation } from '@/stores/api'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { SafeHtml } from '@/components/common/SafeHtml'
import { Speakable } from '@/components/common/Speakable'

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
    icon,
    value,
    label,
}) => (
    <div className="stat-tile min-w-0 p-3 text-center sm:p-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {icon}
        </div>
        <p className="mt-3 text-xl font-bold font-display text-slate-50 sm:text-2xl">{value}</p>
        <p className="mt-1 break-words text-[10px] text-slate-400 sm:text-xs">{label}</p>
    </div>
)

const resolveApiErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message?: unknown }).message ?? fallback)
    }
    return fallback
}

const DashboardSummaryComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const { gardenHealth, activePlantsCount, avgTemp, avgHumidity } =
        useAppSelector(selectGardenHealthMetrics)
    const activePlants = useAppSelector(selectActivePlants)
    const lang = useAppSelector(selectLanguage)
    const settings = useAppSelector(selectSettings)
    const leafTempOffset = settings.simulation.leafTemperatureOffset
    const altitudeM = settings.simulation.altitudeM ?? 0
    const hasActiveGrows = activePlantsCount > 0

    const [
        getGardenStatus,
        { data: aiStatus, isLoading: isAiLoading, error: aiError, reset: resetAiStatus },
    ] = useGetGardenStatusSummaryMutation()

    const [wateringState, setWateringState] = useState<'idle' | 'pending' | 'success'>('idle')

    useEffect(() => {
        let timer: number
        if (wateringState === 'success') {
            timer = window.setTimeout(() => setWateringState('idle'), 2000)
        }
        return () => clearTimeout(timer)
    }, [wateringState])

    const handleWaterAll = () => {
        setWateringState('pending')
        dispatch(waterAllPlants())
        setTimeout(() => setWateringState('success'), 500) // UI feedback delay
    }

    const handleGetAiStatus = () => {
        if (hasActiveGrows) {
            getGardenStatus({ plants: activePlants, lang })
        }
    }

    const renderWaterButtonContent = () => {
        switch (wateringState) {
            case 'pending':
                return (
                    <>
                        <PhosphorIcons.Drop className="w-5 h-5 mr-1 animate-pulse" />{' '}
                        {t('plantsView.summary.wateringAll')}
                    </>
                )
            case 'success':
                return (
                    <>
                        <PhosphorIcons.CheckCircle className="w-5 h-5 mr-1" />{' '}
                        {t('plantsView.summary.wateredAll')}
                    </>
                )
            default:
                return (
                    <>
                        <PhosphorIcons.Drop className="w-5 h-5 mr-1" />{' '}
                        {t('plantsView.summary.waterAll')}
                    </>
                )
        }
    }

    const aiErrorMessage = resolveApiErrorMessage(aiError, t('ai.error.unknown'))

    const renderAiStatusSection = () => {
        if (isAiLoading) {
            return <AiLoadingIndicator loadingMessage={t('ai.generating')} />
        }

        if (aiError) {
            return <div className="text-center text-sm text-red-400">{aiErrorMessage}</div>
        }

        if (aiStatus) {
            return (
                <Speakable elementId="garden-status-ai" className="animate-fade-in">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-primary-300 flex items-center gap-2">
                            <PhosphorIcons.Sparkle /> {aiStatus.title}
                        </h4>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="!p-1"
                            onClick={() => resetAiStatus()}
                        >
                            <PhosphorIcons.X />
                        </Button>
                    </div>
                    <SafeHtml
                        className="prose prose-sm dark:prose-invert max-w-none"
                        html={aiStatus.content}
                    />
                </Speakable>
            )
        }

        return (
            <Button
                onClick={handleGetAiStatus}
                variant="secondary"
                size="sm"
                disabled={!hasActiveGrows}
                className="w-full"
            >
                <PhosphorIcons.Sparkle className="w-4 h-4 mr-2" />{' '}
                {t('plantsView.gardenVitals.getAiStatus')}
            </Button>
        )
    }

    return (
        <Card className="overflow-hidden">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="surface-badge mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary-200">
                        <PhosphorIcons.Heart className="h-3.5 w-3.5" />
                        {t('plantsView.gardenVitals.liveEnvironment')}
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-50">
                        {t('plantsView.gardenVitals.title')}
                    </h3>
                </div>
                <div className="stat-tile flex items-center gap-3 self-start px-4 py-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary-300">
                        <PhosphorIcons.ChartLineUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                            {t('plantsView.gardenVitals.vpdSummary')}
                        </p>
                        <p className="text-lg font-bold font-display text-slate-50">
                            {avgTemp.toFixed(1)}° / {avgHumidity.toFixed(0)}%
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <Stat
                    icon={<PhosphorIcons.Heart weight="fill" className="text-rose-400" />}
                    value={`${Math.round(gardenHealth)}%`}
                    label={t('plantsView.summary.gardenHealth')}
                />
                <Stat
                    icon={<PhosphorIcons.Plant className="text-green-400" />}
                    value={activePlantsCount.toString()}
                    label={t('plantsView.summary.activeGrows')}
                />
                <Stat
                    icon={<PhosphorIcons.Thermometer className="text-orange-400" />}
                    value={`${avgTemp.toFixed(1)}°`}
                    label={t('plantsView.gardenVitals.avgTemp')}
                />
                <Stat
                    icon={<PhosphorIcons.Drop className="text-blue-400" />}
                    value={`${avgHumidity.toFixed(1)}%`}
                    label={t('plantsView.gardenVitals.avgHumidity')}
                />
            </div>
            <div className="stat-tile mb-4 flex min-w-0 flex-col items-center justify-center p-3 text-center">
                <VPDGauge
                    temperature={avgTemp}
                    humidity={avgHumidity}
                    leafTempOffset={leafTempOffset}
                    altitudeM={altitudeM}
                />
            </div>

            <div className="mb-4">
                <Button
                    onClick={handleWaterAll}
                    variant="secondary"
                    disabled={!hasActiveGrows || wateringState === 'pending'}
                    className="w-full"
                >
                    {renderWaterButtonContent()}
                </Button>
            </div>

            {/* AI Status Section */}
            <div className="stat-tile space-y-3 p-3">{renderAiStatusSection()}</div>

            <div className="mt-4 border-t border-white/8 pt-4">
                <details className="group mt-4">
                    <summary className="list-none text-sm font-semibold text-slate-300 cursor-pointer flex items-center justify-between">
                        <span>{t('plantsView.gardenVitals.advancedControls')}</span>
                        <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-4">
                        {hasActiveGrows ? (
                            <>
                                <RangeSlider
                                    label={t('plantsView.gardenVitals.avgTemp')}
                                    min={15}
                                    max={35}
                                    step={0.5}
                                    singleValue={true}
                                    value={avgTemp}
                                    onChange={(val) =>
                                        dispatch(
                                            setGlobalEnvironment({
                                                temperature: val,
                                                simulationSettings: settings.simulation,
                                            }),
                                        )
                                    }
                                    unit="°C"
                                    color="green"
                                />
                                <RangeSlider
                                    label={t('plantsView.gardenVitals.avgHumidity')}
                                    min={20}
                                    max={90}
                                    step={1}
                                    singleValue={true}
                                    value={avgHumidity}
                                    onChange={(val) =>
                                        dispatch(
                                            setGlobalEnvironment({
                                                humidity: val,
                                                simulationSettings: settings.simulation,
                                            }),
                                        )
                                    }
                                    unit="%"
                                    color="blue"
                                />
                            </>
                        ) : (
                            <p className="text-xs text-slate-500 text-center">
                                {t('plantsView.summary.advancedControlsHint')}
                            </p>
                        )}
                    </div>
                </details>
            </div>
        </Card>
    )
}

export const DashboardSummary: React.FC = memo(DashboardSummaryComponent)
DashboardSummary.displayName = 'DashboardSummary'
