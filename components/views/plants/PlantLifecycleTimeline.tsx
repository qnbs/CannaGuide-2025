import React, { memo } from 'react';
import { PlantStage } from '@/types';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { STAGES_ORDER } from '@/constants';
import { useTranslations } from '@/hooks/useTranslations';

interface TimelineProps {
    currentStage: PlantStage;
    currentAge: number;
}

const stageColors: Record<PlantStage, string> = {
    [PlantStage.Seed]: 'bg-yellow-400',
    [PlantStage.Germination]: 'bg-yellow-500',
    [PlantStage.Seedling]: 'bg-lime-500',
    [PlantStage.Vegetative]: 'bg-green-500',
    [PlantStage.Flowering]: 'bg-purple-500',
    [PlantStage.Harvest]: 'bg-orange-500',
    [PlantStage.Drying]: 'bg-amber-700',
    [PlantStage.Curing]: 'bg-stone-500',
    [PlantStage.Finished]: 'bg-sky-500',
};


export const PlantLifecycleTimeline: React.FC<TimelineProps> = memo(({ currentStage, currentAge }) => {
    const { t } = useTranslations();
    const relevantStages = STAGES_ORDER.filter(s => PLANT_STAGE_DETAILS[s].duration !== Infinity);
    const totalDuration = relevantStages.reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0);

    const progressPercentage = Math.min(100, (currentAge / totalDuration) * 100);
    
    let cumulativeDuration = 0;

    return (
        <div>
            <h3 className="text-xl font-bold font-display mb-4 text-primary-400">{t('plantsView.detailedView.lifecycle')}</h3>
            <div className="relative mb-2">
                <div className="flex h-4 overflow-hidden rounded-full bg-slate-800/50">
                    {relevantStages.map(stage => {
                        const stageInfo = PLANT_STAGE_DETAILS[stage];
                        const width = (stageInfo.duration / totalDuration) * 100;
                        cumulativeDuration += stageInfo.duration;
                        const isCompleted = currentAge > cumulativeDuration;
                        const isCurrent = currentStage === stage;
                        
                        return (
                            <div
                                key={stage}
                                style={{ width: `${width}%` }}
                                className={`transition-all duration-300 ${stageColors[stage]} ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40'}`}
                                title={`${t(`plantStages.${stage}`)} (~${stageInfo.duration} ${t('common.days')})`}
                            />
                        );
                    })}
                </div>
                <div className="absolute top-0 h-4" style={{ left: `calc(${progressPercentage}% - 2px)` }}>
                    <div className="w-1 h-full bg-white rounded-full" title={`${t('plantsView.plantCard.day')} ${currentAge}`}></div>
                </div>
            </div>
             <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
                {relevantStages.map(stage => (
                    <span key={stage} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${stageColors[stage]}`}></div>
                        {t(`plantStages.${stage}`)}
                    </span>
                ))}
            </div>
        </div>
    );
});
