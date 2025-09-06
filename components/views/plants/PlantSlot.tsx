import React, { useMemo } from 'react';
import { Plant, PlantStage } from '../../../types';
import { Card } from '../../common/Card';
import { PlantVisual } from './PlantVisual';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface PlantCardProps {
  plant: Plant;
  onInspect: () => void;
}

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-1 text-xs text-slate-300" title={label}>
        <div className="w-4 h-4 text-primary-400">{icon}</div>
        <span>{value}</span>
    </div>
);


export const PlantCard: React.FC<PlantCardProps> = ({ plant, onInspect }) => {
    const { t } = useTranslations();
    
    const { healthStatus, healthTitle } = useMemo(() => {
        const hasProblems = plant.problems.length > 0;
        const hasHighPriorityTask = plant.tasks.some(t => !t.isCompleted && t.priority === 'high');

        if (hasProblems || hasHighPriorityTask) {
            const problemMessages = plant.problems.map(p => p.message).join(', ');
            return {
                healthStatus: 'danger',
                healthTitle: problemMessages || t('plantsView.tasks.priorities.high')
            }
        }
        return { healthStatus: 'good', healthTitle: 'Healthy' };

    }, [plant.problems, plant.tasks, t]);

    const healthClasses = {
        good: 'text-green-400',
        danger: 'text-red-400 animate-pulse',
    };
    
    return (
        <Card 
            className="flex flex-col h-full border-2 border-transparent transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-primary-500/50"
            onClick={onInspect}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="min-w-0">
                    <h3 className="text-xl font-bold font-display text-primary-400 truncate">{plant.name}</h3>
                    <p className="text-slate-400 text-xs truncate">{plant.strain.name}</p>
                </div>
                 <div className={`w-6 h-6 flex-shrink-0 ${healthClasses[healthStatus as keyof typeof healthClasses]}`} title={healthTitle}>
                    {healthStatus === 'danger' ? <PhosphorIcons.WarningCircle /> : <PhosphorIcons.CheckCircle />}
                 </div>
            </div>

            <div className="flex-grow flex items-center justify-center my-2 min-h-[150px]">
               <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture}/>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                 {/* FIX: Replaced non-existent Calendar icon with Sun icon to represent days. */}
                 <Stat icon={<PhosphorIcons.Sun />} label={t('common.days')} value={`${t('plantsView.plantCard.day')} ${plant.age}`} />
                 <Stat icon={<PhosphorIcons.Ruler />} label={t('plantsView.detailedView.height')} value={`${plant.height.toFixed(1)} cm`} />
                 <Stat icon={<PhosphorIcons.Plant />} label={t('plantsView.plantCard.stage')} value={t(`plantStages.${plant.stage}`)} />
                 <Stat icon={<PhosphorIcons.Heart weight="fill"/>} label={t('plantsView.detailedView.stress')} value={`${plant.stressLevel.toFixed(0)}%`} />
            </div>
        </Card>
    );
};