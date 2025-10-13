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

export const PlantSlot: React.FC<PlantSlotProps> = memo(({ plant, onInspect }) => {
    const { t } = useTranslation();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);
    
    const isPhIdeal = plant.medium.ph >= stageDetails.idealVitals.ph.min && plant.medium.ph <= stageDetails.idealVitals.ph.max;
    const isEcIdeal = plant.medium.ec >= stageDetails.idealVitals.ec.min && plant.medium.ec <= stageDetails.idealVitals.ec.max;
    const isMoistureIdeal = plant.medium.moisture >= 20 && plant.medium.moisture <= 80;

    return (
        <Card onClick={onInspect} className="flex flex-col h-full cursor-pointer card-interactive p-3">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-100 truncate">{plant.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{plant.strain.name}</p>
                </div>
                <div className="text-right flex-shrink-0 bg-slate-700/80 px-2 py-0.5 rounded-full text-xs">
                    <p className="font-semibold text-slate-200">{t(`plantStages.${plant.stage}`)}</p>
                    {!isPostHarvest && <p className="text-slate-300">{t('plantsView.plantCard.day')} {plant.age}</p>}
                </div>
            </div>
            
            <div className="flex-grow flex items-center justify-center my-2 min-h-[96px]">
                 <PlantVisualizer plant={plant} className="w-32 h-32" />
            </div>

            <div className="flex justify-around items-center text-slate-300 border-t border-slate-700/50 pt-3 mt-auto">
                <div className="flex items-center gap-1.5 text-sm font-mono" title="pH">
                    <div className={`w-2 h-2 rounded-full ${isPhIdeal ? 'bg-success' : 'bg-warning'}`}></div>
                    <span>{plant.medium.ph.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-mono" title="EC">
                    <div className={`w-2 h-2 rounded-full ${isEcIdeal ? 'bg-success' : 'bg-warning'}`}></div>
                    <span>{plant.medium.ec.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-mono" title={t('plantsView.vitals.moisture')}>
                    <div className={`w-2 h-2 rounded-full ${isMoistureIdeal ? 'bg-info' : 'bg-danger'}`}></div>
                    <span>{plant.medium.moisture.toFixed(0)}%</span>
                </div>
            </div>
        </Card>
    );
});