import React, { memo, useMemo } from 'react'
import { Plant, PlantStage } from '@/types'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'
import { PlantVisualizer } from './PlantVisualizer'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { VitalBar } from './VitalBar'

interface PlantSlotProps {
    plant: Plant
    onInspect: () => void
}

const getHealthIndicator = (health: number): { color: string; pulse: boolean } => {
    if (health < 40) return { color: 'bg-red-500', pulse: true }
    if (health < 70) return { color: 'bg-amber-500', pulse: false }
    return { color: 'bg-emerald-500', pulse: false }
}

export const PlantSlot: React.FC<PlantSlotProps> = memo(({ plant, onInspect }) => {
    const { t } = useTranslation()
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage]
    const safeStrainName =
        typeof plant.strain?.name === 'string' && plant.strain.name.trim() !== ''
            ? plant.strain.name
            : t('plantsView.unknownStrain', { defaultValue: 'Unknown Strain' })

    const isPostHarvest = [
        PlantStage.Harvest,
        PlantStage.Drying,
        PlantStage.Curing,
        PlantStage.Finished,
    ].includes(plant.stage)
    const activeProblems = useMemo(
        () => plant.problems.filter((p) => p.status === 'active'),
        [plant.problems],
    )
    const openTasks = useMemo(() => plant.tasks.filter((t) => !t.isCompleted), [plant.tasks])
    const healthIndicator = getHealthIndicator(plant.health)
    const stageLabel = t(`plantStages.${plant.stage}`)
    const plantAriaLabel = `${plant.name} - ${stageLabel}`
    const healthPulseClass = healthIndicator.pulse ? 'animate-pulse' : ''
    const healthDotClassName = `w-2.5 h-2.5 rounded-full ${healthIndicator.color} ${healthPulseClass}`

    if (!stageDetails) return null

    return (
        <Card
            onClick={onInspect}
            aria-label={plantAriaLabel}
            className="flex flex-col h-full cursor-pointer card-interactive p-3 group"
        >
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-100 truncate">{plant.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{safeStrainName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Health dot indicator */}
                    <div
                        className={healthDotClassName}
                        title={`${t('plantsView.summary.gardenHealth')}: ${Math.round(plant.health)}%`}
                    />
                    <div className="text-right bg-slate-800/80 px-2 py-0.5 rounded-full text-xs">
                        <p className="font-semibold text-slate-200">{stageLabel}</p>
                        {!isPostHarvest && (
                            <p className="text-slate-300">
                                {t('plantsView.plantCard.day')} {plant.age}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Problem/task badges */}
            {(activeProblems.length > 0 || openTasks.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeProblems.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300 ring-1 ring-inset ring-red-400/30">
                            <PhosphorIcons.WarningCircle className="w-3 h-3" />
                            {activeProblems.length}
                        </span>
                    )}
                    {openTasks.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-bold text-primary-300 ring-1 ring-inset ring-primary-400/30">
                            <PhosphorIcons.ListChecks className="w-3 h-3" />
                            {openTasks.length}
                        </span>
                    )}
                </div>
            )}

            <div className="flex-grow flex items-center justify-center my-2 min-h-[96px]">
                <PlantVisualizer
                    plant={plant}
                    className="w-32 h-32 group-hover:scale-105 transition-transform duration-200"
                />
            </div>

            <div className="grid grid-cols-3 gap-1 text-slate-300 border-t border-slate-700/50 pt-3 mt-auto">
                <VitalBar
                    value={plant.health}
                    min={80}
                    max={100}
                    label={t('plantsView.summary.gardenHealth')}
                    unit="%"
                    icon={<PhosphorIcons.Heart />}
                />
                <VitalBar
                    value={plant.medium.ph}
                    min={stageDetails.idealVitals.ph.min}
                    max={stageDetails.idealVitals.ph.max}
                    label={t('plantsView.vitals.ph')}
                    icon={<span className="font-bold text-xs leading-none">pH</span>}
                />
                <VitalBar
                    value={plant.medium.moisture}
                    min={20}
                    max={80}
                    label={t('plantsView.vitals.moisture')}
                    unit="%"
                    icon={<PhosphorIcons.Drop />}
                />
            </div>
        </Card>
    )
})

PlantSlot.displayName = 'PlantSlot'
