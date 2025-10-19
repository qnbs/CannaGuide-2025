import React, { memo } from 'react';
import { Plant, PlantStage } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { PlantVisualizer } from './PlantVisualizer';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface PlantSlotProps {
    plant: Plant;
    onInspect: () => void;
}

const VitalBar: React.FC<{ value: number; idealMin: number; idealMax: number; icon: React.ReactNode; label: string }> = ({ value, idealMin, idealMax, icon, label }) => {
    const isIdeal = value >= idealMin && value <= idealMax;
    return (
        <div className="flex items-center gap-2 text-xs" title={`${label}: ${value.toFixed(1)}`}>
            <div className={`w-4 h-4 flex-shrink-0 ${isIdeal ? 'text-primary-400' : 'text-amber-400'}`}>{icon}</div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${isIdeal ? 'bg-primary-500' : 'bg-amber-500'}`} 
                    style={{ width: `${Math.min(100, (value / (idealMax * 1.2)) * 100)}%` }}
                ></div>
            </div>
        </div>
    );
};


export const PlantSlot: React.FC<PlantSlotProps> = memo(({ plant, onInspect }) => {
    const { t } = useTranslation();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    return (
        <Card onClick={onInspect} className="flex flex-col h-full cursor-pointer card-interactive p-3 border border-white/40">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-100 truncate">{plant.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{plant.strain.name}</p>
                </div>
                <div className="text-right flex-shrink-0 bg-slate-800/80 px-2 py-0.5 rounded-full text-xs">
                    <p className="font-semibold text-slate-200">{t(`plantStages.${plant.stage}`)}</p>
                    {!isPostHarvest && <p className="text-slate-300">{t('plantsView.plantCard.day')} {plant.age}</p>}
                </div>
            </div>
            
            <div className="flex-grow flex items-center justify-center my-2 min-h-[96px]">
                 <PlantVisualizer plant={plant} className="w-32 h-32" />
            </div>

            <div className="flex flex-col gap-2 text-slate-300 border-t border-slate-700/50 pt-3 mt-auto">
                <VitalBar value={plant.health} idealMin={80} idealMax={100} icon={<PhosphorIcons.Heart />} label={t('plantsView.summary.gardenHealth')} />
                <VitalBar value={plant.medium.ph} idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} icon={<span className="font-bold text-xs leading-none">pH</span>} label={t('plantsView.vitals.ph')} />
                <VitalBar value={plant.medium.moisture} idealMin={20} idealMax={80} icon={<PhosphorIcons.Drop />} label={t('plantsView.vitals.moisture')} />
            </div>
        </Card>
    );
});