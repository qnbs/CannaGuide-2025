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

const VitalSign: React.FC<{ value: string; color: string; label: string, icon: React.ReactNode }> = ({ value, color, label, icon }) => {
    return (
        <div className="flex flex-col items-center gap-1 text-center" title={label}>
            <div className={`w-6 h-6 ${color}`}>{icon}</div>
            <span className="text-xs font-mono text-slate-200">{value}</span>
        </div>
    );
};

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
                <VitalSign 
                    label="pH" 
                    value={plant.medium.ph.toFixed(1)} 
                    color={isPhIdeal ? 'text-green-400' : 'text-amber-400'} 
                    icon={<PhosphorIcons.Drop />} 
                />
                <VitalSign 
                    label="EC" 
                    value={plant.medium.ec.toFixed(1)} 
                    color={isEcIdeal ? 'text-green-400' : 'text-amber-400'} 
                    icon={<PhosphorIcons.Lightning />} 
                />
                <VitalSign 
                    label={t('plantsView.vitals.moisture')} 
                    value={`${plant.medium.moisture.toFixed(0)}%`}
                    color={isMoistureIdeal ? 'text-blue-400' : 'text-red-400'} 
                    icon={<PhosphorIcons.Thermometer />} 
                />
            </div>
        </Card>
    );
});