import React, { memo, useMemo } from 'react'
import { PlantStage } from '@/types'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'
import { STAGES_ORDER } from '@/constants'
import { useTranslation } from 'react-i18next'

interface TimelineProps {
    currentStage: PlantStage
    currentAge: number
}

const stageColors: Record<PlantStage, string> = {
    [PlantStage.Seed]: 'bg-amber-400',
    [PlantStage.Germination]: 'bg-amber-500',
    [PlantStage.Seedling]: 'bg-secondary-500',
    [PlantStage.Vegetative]: 'bg-secondary-400',
    [PlantStage.Flowering]: 'bg-accent-500',
    [PlantStage.Harvest]: 'bg-orange-500',
    [PlantStage.Drying]: 'bg-amber-700',
    [PlantStage.Curing]: 'bg-slate-500',
    [PlantStage.Finished]: 'bg-primary-500',
}

export const PlantLifecycleTimeline: React.FC<TimelineProps> = memo(
    ({ currentStage, currentAge }) => {
        const { t } = useTranslation()
        const relevantStages = useMemo(
            () => STAGES_ORDER.filter((s) => PLANT_STAGE_DETAILS[s].duration !== Infinity),
            [],
        )
        const totalDuration = useMemo(
            () =>
                relevantStages.reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0),
            [relevantStages],
        )

        const progressPercentage = Math.min(100, (currentAge / totalDuration) * 100)
        const daysRemaining = Math.max(0, totalDuration - currentAge)

        let cumulativeDuration = 0

        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold font-display text-primary-300">
                        {t('plantsView.detailedView.lifecycle')}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                        {t('plantsView.plantCard.day')} {currentAge} / {totalDuration} · ~
                        {daysRemaining}d{' '}
                        {t('plantsView.lifecycle.remaining', { defaultValue: 'remaining' })}
                    </span>
                </div>
                <div className="relative mb-2">
                    <div className="flex h-4 overflow-hidden rounded-full bg-slate-800/50">
                        {relevantStages.map((stage) => {
                            const stageInfo = PLANT_STAGE_DETAILS[stage]
                            const width = (stageInfo.duration / totalDuration) * 100
                            cumulativeDuration += stageInfo.duration
                            const isCompleted = currentAge > cumulativeDuration
                            const isCurrent = currentStage === stage

                            return (
                                <div
                                    key={stage}
                                    style={{ width: `${width}%` }}
                                    className={`relative transition-all duration-300 ${stageColors[stage]} ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-30'} ${isCurrent ? 'ring-1 ring-white/40' : ''}`}
                                    title={`${t(`plantStages.${stage}`)} (~${stageInfo.duration} ${t('common.units.days')})`}
                                >
                                    {/* Show duration label on wider segments */}
                                    {width > 12 && (
                                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80 drop-shadow">
                                            {stageInfo.duration}d
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div
                        className="absolute top-0 h-4"
                        style={{ left: `calc(${progressPercentage}% - 2px)` }}
                    >
                        <div
                            className="w-1 h-full bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                            title={`${t('plantsView.plantCard.day')} ${currentAge}`}
                        ></div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
                    {relevantStages.map((stage) => {
                        const isCurrent = currentStage === stage
                        return (
                            <span
                                key={stage}
                                className={`flex items-center gap-1.5 ${isCurrent ? 'text-white font-semibold' : ''}`}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full ${stageColors[stage]} ${isCurrent ? 'ring-1 ring-white/50' : ''}`}
                                ></div>
                                {t(`plantStages.${stage}`)}
                            </span>
                        )
                    })}
                </div>
            </div>
        )
    },
)

PlantLifecycleTimeline.displayName = 'PlantLifecycleTimeline'
