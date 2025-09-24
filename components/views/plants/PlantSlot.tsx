import React from 'react';
import { Plant } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { PlantVisual } from '@/components/views/plants/PlantVisual';
import { VitalBar } from './VitalBar';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';

interface PlantCardProps {
    plant: Plant;
    onInspect: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onInspect }) => {
    const { t } = useTranslations();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
    const activeProblemsCount = plant.problems.filter(p => p.status === 'active').length;

    return (
        <Card className="flex flex-col h-full relative">
            {activeProblemsCount > 0 && (
                <div
                    className="absolute top-2 right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white font-bold text-xs border-2 border-slate-900"
                    title={`${activeProblemsCount} ${t('plantsView.warnings.title')}`}
                >
                    {activeProblemsCount}
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-primary-400 truncate">{plant.name}</h3>
                    <p className="text-xs text-slate-400">{plant.strain.name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-slate-100">{t('plantsView.plantCard.day')} {plant.age}</p>
                    <p className="text-xs text-slate-400">{t(`plantStages.${plant.stage}`)}</p>
                </div>
            </div>

            <div className="my-4 flex-grow flex items-center justify-center min-h-[120px]">
                <PlantVisual stage={plant.stage} height={plant.height} stressLevel={plant.stressLevel} className="w-24 h-24" />
            </div>

            <div className="space-y-2">
                <VitalBar label={t('plantsView.vitals.ph')} value={plant.vitals.ph} min={5} max={8} unit="" idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} colorClass="bg-yellow-500" />
                <VitalBar label={t('plantsView.vitals.ec')} value={plant.vitals.ec} min={0} max={3} unit="" idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} colorClass="bg-orange-500" />
                <VitalBar label={t('plantsView.vitals.moisture')} value={plant.vitals.substrateMoisture} min={0} max={100} unit="%" idealMin={40} idealMax={80} colorClass="bg-blue-500" />
            </div>
            
            <Button onClick={onInspect} className="w-full mt-4">
                {t('common.inspect')}
            </Button>
        </Card>
    );
};