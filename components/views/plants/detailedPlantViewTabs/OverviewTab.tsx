import React from 'react';
import { Plant } from '@/types';
import { Card } from '@/components/common/Card';
import { PlantVisual } from '@/components/views/plants/PlantVisual';
import { PLANT_STAGE_DETAILS } from '@/constants';
import { HistoryChart } from '@/components/views/plants/HistoryChart';
import { PlantLifecycleTimeline } from '@/components/views/plants/PlantLifecycleTimeline';
import { useTranslations } from '@/hooks/useTranslations';
import { VitalBar } from '@/components/views/plants/VitalBar';

interface OverviewTabProps {
    plant: Plant;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;
    const idealEnv = PLANT_STAGE_DETAILS[plant.stage].idealEnv;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                     <div className="h-64 flex items-center justify-center">
                        <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture} problems={plant.problems}/>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.vitals')}</h3>
                    <div className="space-y-4">
                       <VitalBar label={t('plantsView.vitals.ph')} value={plant.vitals.ph} min={4} max={8} idealMin={idealVitals.ph.min} idealMax={idealVitals.ph.max} unit="" colorClass="bg-green-500" />
                       <VitalBar label={t('plantsView.vitals.ec')} value={plant.vitals.ec} min={0} max={3} idealMin={idealVitals.ec.min} idealMax={idealVitals.ec.max} unit={` ${t('common.units.ms_cm')}`} colorClass="bg-amber-500" />
                       <VitalBar label={t('plantsView.vitals.moisture')} value={plant.vitals.substrateMoisture} min={0} max={100} idealMin={30} idealMax={80} unit={t('common.units.percent')} colorClass="bg-blue-500" />
                       <VitalBar label={t('plantsView.detailedView.stress')} value={plant.stressLevel} min={0} max={100} idealMin={0} idealMax={20} unit={t('common.units.percent')} colorClass="bg-red-500" />
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
                </Card>
                <Card>
                    <h3 className="text-lg font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.history')}</h3>
                    <div className="h-64">
                        <HistoryChart history={plant.history} />
                    </div>
                </Card>
            </div>
        </div>
    );
};