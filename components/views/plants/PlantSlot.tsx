
import React, { memo } from 'react';
import { Plant, PlantStage } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { PlantVisualizer } from './PlantVisualizer';

interface PlantSlotProps {
    plant: Plant;
    onInspect: () => void;
}

const VitalSign: React.FC<{ value: number; idealMin: number; idealMax: number; label: string }> = ({ value, idealMin, idealMax, label }) => {
    const isIdeal = value >= idealMin && value <= idealMax;
    return (
        <div className="flex items-center gap-1" title={label}>
            <div className={`w-2 h-2 rounded-full ${isIdeal ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <span className="text-xs font-mono">{value.toFixed(1)}</span>
        </div>
    );
};

export const PlantSlot: React.FC<PlantSlotProps> = memo(({ plant, onInspect }) => {
    const { t } = useTranslation();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);
    
    return (
        <Card onClick={onInspect} className="flex flex-col h-full cursor-pointer card-interactive-glow">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="font-bold text-primary-300 truncate">{plant.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{plant.strain.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold bg-slate-700/80 px-2 py-0.5 rounded-full">{t(`plantStages.${plant.stage}`)}</p>
                    {!isPostHarvest && <p className="text-xs text-slate-400 mt-1">{t('plantsView.plantCard.day')} {plant.age}</p>}
                </div>
            </div>
            
            <div className="flex-grow flex items-center justify-center my-4 min-h-[96px]">
                 <PlantVisualizer plant={plant} className="w-24 h-24" />
            </div>

            <div className="flex justify-around items-center text-slate-300 border-t border-slate-700/50 pt-3 mt-auto">
                <VitalSign value={plant.medium.ph} idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} label="pH" />
                <VitalSign value={plant.medium.ec} idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} label="EC" />
                <div className="flex items-center gap-1" title={t('plantsView.vitals.moisture')}>
                    <div className={`w-2 h-2 rounded-full ${plant.medium.moisture > 30 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-mono">{plant.medium.moisture.toFixed(0)}%</span>
                </div>
            </div>
        </Card>
    );
});
