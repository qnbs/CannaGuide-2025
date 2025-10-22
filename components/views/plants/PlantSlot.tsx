import React, { memo } from 'react';
import { Plant, PlantStage } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { PlantVisualizer } from './PlantVisualizer';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { VitalBar } from './VitalBar';

interface PlantSlotProps {
    plant: Plant;
    onInspect: () => void;
}

export const PlantSlot: React.FC<PlantSlotProps> = memo(({ plant, onInspect }) => {
    const { t } = useTranslation();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    return (
        <Card onClick={onInspect} className="flex flex-col h-full cursor-pointer card-interactive p-3">
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

            <div className="grid grid-cols-3 gap-1 text-slate-300 border-t border-slate-700/50 pt-3 mt-auto">
                <VitalBar value={plant.health} min={80} max={100} label={t('plantsView.summary.gardenHealth')} unit="%" icon={<PhosphorIcons.Heart />} />
                <VitalBar value={plant.medium.ph} min={stageDetails.idealVitals.ph.min} max={stageDetails.idealVitals.ph.max} label={t('plantsView.vitals.ph')} icon={<span className="font-bold text-xs leading-none">pH</span>} />
                <VitalBar value={plant.medium.moisture} min={20} max={80} label={t('plantsView.vitals.moisture')} unit="%" icon={<PhosphorIcons.Drop />} />
            </div>
        </Card>
    );
});