import React, { memo, useMemo } from 'react'
import { Card } from '@/components/common/Card'
import { Plant } from '@/types'
import { useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { plantSimulationService } from '@/services/plantSimulationService'
import { useTranslation } from 'react-i18next'

interface SimulationDebugTabProps {
    plant: Plant
}

const MetricCard: React.FC<{ label: string; value: string; hint: string }> = ({
    label,
    value,
    hint,
}) => (
    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
        <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
)

const toneClassName: Record<'good' | 'warn' | 'critical', string> = {
    good: 'text-emerald-300',
    warn: 'text-amber-300',
    critical: 'text-red-300',
}

const getEnvironmentalInstabilityAssessment = (
    value: number,
    t: (key: string) => string,
): string => {
    if (value < 0.1) {
        return t('plantsView.simulationDebug.assessments.environmentalInstability.stable')
    }
    if (value < 0.25) {
        return t('plantsView.simulationDebug.assessments.environmentalInstability.moderate')
    }
    return t('plantsView.simulationDebug.assessments.environmentalInstability.volatile')
}

const getNutrientAvailabilityAssessment = (value: number, t: (key: string) => string): string => {
    if (value < 5) {
        return t('plantsView.simulationDebug.assessments.nutrientAvailability.constrained')
    }
    if (value < 12) {
        return t('plantsView.simulationDebug.assessments.nutrientAvailability.adequate')
    }
    return t('plantsView.simulationDebug.assessments.nutrientAvailability.abundant')
}

const getNutrientConversionAssessment = (value: number, t: (key: string) => string): string => {
    if (value < 0.35) {
        return t('plantsView.simulationDebug.assessments.nutrientConversion.lossy')
    }
    if (value < 0.6) {
        return t('plantsView.simulationDebug.assessments.nutrientConversion.balanced')
    }
    return t('plantsView.simulationDebug.assessments.nutrientConversion.efficient')
}

const getPestPressureAssessment = (value: number, t: (key: string) => string): string => {
    if (value <= 1) {
        return t('plantsView.simulationDebug.assessments.pestPressure.low')
    }
    if (value <= 1.8) {
        return t('plantsView.simulationDebug.assessments.pestPressure.elevated')
    }
    return t('plantsView.simulationDebug.assessments.pestPressure.high')
}

export const SimulationDebugTab: React.FC<SimulationDebugTabProps> = memo(({ plant }) => {
    const { t } = useTranslation()
    const simulationSettings = useAppSelector(selectSettings).simulation
    const diagnostics = useMemo(
        () => plantSimulationService.getSimulationDiagnostics(plant, simulationSettings),
        [plant, simulationSettings],
    )

    const dominantFactors = useMemo(
        () =>
            diagnostics.dominantFactors.map((factor) => {
                switch (factor.id) {
                    case 'vpd':
                        return {
                            ...factor,
                            label: t('plantsView.simulationDebug.dominantFactorLabels.vpd'),
                            reason: t(
                                'plantsView.simulationDebug.dominantFactorReasons.vpd',
                                factor.context,
                            ),
                        }
                    case 'lightCapture':
                        return {
                            ...factor,
                            label: t(
                                'plantsView.simulationDebug.dominantFactorLabels.lightCapture',
                            ),
                            reason: t(
                                'plantsView.simulationDebug.dominantFactorReasons.lightCapture',
                                factor.context,
                            ),
                        }
                    case 'nutrientThroughput':
                        return {
                            ...factor,
                            label: t(
                                'plantsView.simulationDebug.dominantFactorLabels.nutrientThroughput',
                            ),
                            reason: t(
                                'plantsView.simulationDebug.dominantFactorReasons.nutrientThroughput',
                                factor.context,
                            ),
                        }
                    case 'pestPressure':
                        return {
                            ...factor,
                            label: t(
                                'plantsView.simulationDebug.dominantFactorLabels.pestPressure',
                            ),
                            reason: t(
                                'plantsView.simulationDebug.dominantFactorReasons.pestPressure',
                                factor.context,
                            ),
                        }
                    default:
                        return {
                            ...factor,
                            label: factor.id,
                            reason: '',
                        }
                }
            }),
        [diagnostics.dominantFactors, t],
    )

    const environmentalInstabilityAssessment = getEnvironmentalInstabilityAssessment(
        diagnostics.stress.environmentalInstability,
        t,
    )
    const nutrientAvailabilityAssessment = getNutrientAvailabilityAssessment(
        diagnostics.growth.nutrientAvailability,
        t,
    )
    const nutrientConversionAssessment = getNutrientConversionAssessment(
        diagnostics.growth.nutrientConversionEfficiency,
        t,
    )
    const pestPressureAssessment = getPestPressureAssessment(
        diagnostics.stress.pestPressureCurve,
        t,
    )

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.simulationDebug.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <MetricCard
                        label={t('plantsView.simulationDebug.profile')}
                        value={t(
                            `settingsView.plants.simulationProfiles.${diagnostics.profile.name}`,
                        )}
                        hint={t('plantsView.simulationDebug.profileHint', {
                            environment: diagnostics.profile.environmentStress.toFixed(2),
                            nutrient: diagnostics.profile.nutrientStress.toFixed(2),
                            pest: diagnostics.profile.pestPressure.toFixed(2),
                            postHarvest: diagnostics.profile.postHarvestPrecision.toFixed(2),
                        })}
                    />
                    <MetricCard
                        label={t('plantsView.simulationDebug.vpd')}
                        value={`${diagnostics.environment.vpd.toFixed(2)} kPa`}
                        hint={t('plantsView.simulationDebug.vpdHint', {
                            min: diagnostics.environment.targetMin.toFixed(1),
                            max: diagnostics.environment.targetMax.toFixed(1),
                        })}
                    />
                    <MetricCard
                        label={t('plantsView.simulationDebug.lightCapture')}
                        value={`${(diagnostics.growth.lightAbsorption * 100).toFixed(0)}%`}
                        hint={t('plantsView.simulationDebug.lightCaptureHint', {
                            k: diagnostics.growth.lightExtinctionCoefficient.toFixed(2),
                        })}
                    />
                    <MetricCard
                        label={t('plantsView.simulationDebug.subdayClock')}
                        value={`${diagnostics.stress.accumulatedSubdayHours.toFixed(1)} h`}
                        hint={t('plantsView.simulationDebug.subdayClockHint')}
                    />
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.simulationDebug.environmentModel')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-2">
                        <p>
                            {t('plantsView.simulationDebug.correctedRh')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.environment.correctedRh.toFixed(1)}%
                            </span>
                        </p>
                        <p>
                            {t('plantsView.simulationDebug.leafOffset')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.environment.leafOffset.toFixed(1)}°C
                            </span>
                        </p>
                        <p>
                            {t('plantsView.simulationDebug.altitude')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.environment.altitudeM.toFixed(0)} m
                            </span>
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10 space-y-2">
                        <p>
                            {t('plantsView.simulationDebug.environmentalInstability')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.stress.environmentalInstability.toFixed(2)}
                            </span>
                        </p>
                        <p className="text-xs text-slate-400">
                            {environmentalInstabilityAssessment}
                        </p>
                        <p>
                            {t('plantsView.simulationDebug.stomataSensitivity')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.growth.stomataSensitivity.toFixed(2)}x
                            </span>
                        </p>
                        <p>
                            {t('plantsView.simulationDebug.co2Factor')}:{' '}
                            <span className="font-semibold text-slate-100">
                                {diagnostics.growth.co2Factor.toFixed(2)}x
                            </span>
                        </p>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.simulationDebug.growthModel')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-slate-400">
                            {t('plantsView.simulationDebug.nutrientAvailability')}
                        </p>
                        <p className="text-2xl font-bold text-slate-100 mt-2">
                            {diagnostics.growth.nutrientAvailability.toFixed(2)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            {nutrientAvailabilityAssessment}
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-slate-400">
                            {t('plantsView.simulationDebug.nutrientConversion')}
                        </p>
                        <p className="text-2xl font-bold text-slate-100 mt-2">
                            {diagnostics.growth.nutrientConversionEfficiency.toFixed(2)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            {nutrientConversionAssessment}
                        </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <p className="text-slate-400">
                            {t('plantsView.simulationDebug.pestPressureCurve')}
                        </p>
                        <p className="text-2xl font-bold text-slate-100 mt-2">
                            {diagnostics.stress.pestPressureCurve.toFixed(2)}x
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{pestPressureAssessment}</p>
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                    {t('plantsView.simulationDebug.dominantFactors')}
                </h3>
                <div className="space-y-3">
                    {dominantFactors.map((factor) => (
                        <div
                            key={factor.id}
                            className="rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10"
                        >
                            <div className="flex items-center justify-between gap-4">
                                <p className="font-semibold text-slate-100">{factor.label}</p>
                                <span
                                    className={`text-xs font-bold uppercase tracking-[0.2em] ${toneClassName[factor.tone]}`}
                                >
                                    {factor.value}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">{factor.reason}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {diagnostics.postHarvest && (
                <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-4">
                        {t('plantsView.simulationDebug.postHarvest')}
                    </h3>
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-slate-800/60 p-4 ring-1 ring-white/10">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {t('plantsView.simulationDebug.postHarvestStage')}
                        </span>
                        <span className="rounded-full bg-slate-700 px-3 py-1 text-sm font-semibold text-slate-100">
                            {t(`plantStages.${diagnostics.postHarvest.stage}`)}
                        </span>
                        <span className="text-sm text-slate-400">
                            {t('plantsView.simulationDebug.postHarvestStageHint')}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <MetricCard
                            label={t('plantsView.postHarvest.jarHumidity')}
                            value={`${diagnostics.postHarvest.jarHumidity.toFixed(1)}%`}
                            hint={t('plantsView.simulationDebug.postHarvestJarHint')}
                        />
                        <MetricCard
                            label={t('plantsView.postHarvest.chlorophyll')}
                            value={`${diagnostics.postHarvest.chlorophyllPercent.toFixed(1)}%`}
                            hint={t('plantsView.simulationDebug.postHarvestChlHint')}
                        />
                        <MetricCard
                            label={t('plantsView.postHarvest.terpeneRetention')}
                            value={`${diagnostics.postHarvest.terpeneRetentionPercent.toFixed(1)}%`}
                            hint={t('plantsView.simulationDebug.postHarvestTerpeneHint')}
                        />
                        <MetricCard
                            label={t('plantsView.postHarvest.moldRisk')}
                            value={`${diagnostics.postHarvest.moldRiskPercent.toFixed(1)}%`}
                            hint={t('plantsView.simulationDebug.postHarvestMoldHint')}
                        />
                        <MetricCard
                            label={t('plantsView.postHarvest.finalQuality')}
                            value={`${diagnostics.postHarvest.finalQuality.toFixed(1)}/100`}
                            hint={t('plantsView.simulationDebug.postHarvestBurpHint', {
                                days: diagnostics.postHarvest.burpDebtDays,
                            })}
                        />
                    </div>
                </Card>
            )}
        </div>
    )
})

SimulationDebugTab.displayName = 'SimulationDebugTab'
