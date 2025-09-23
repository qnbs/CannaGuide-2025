import React from 'react';
import { Plant } from '@/types';
import { Card } from '@/components/common/Card';
import { PlantLifecycleTimeline } from '@/components/views/plants/PlantLifecycleTimeline';
import { HistoryChart } from '@/components/views/plants/HistoryChart';
import { VitalBar } from '@/components/views/plants/VitalBar';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { useTranslations } from '@/hooks/useTranslations';

interface OverviewTabProps {
    plant: Plant;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
                <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.detailedView.vitals')}</h3>
                <div className="space-y-4">
                    <VitalBar
                        label={t('plantsView.vitals.ph')}
                        value={plant.vitals.ph}
                        min={5} max={8} unit=""
                        idealMin={stageDetails.idealVitals.ph.min}
                        idealMax={stageDetails.idealVitals.ph.max}
                        colorClass="bg-yellow-500"
                    />
                    <VitalBar
                        label={t('plantsView.vitals.ec')}
                        value={plant.vitals.ec}
                        min={0} max={3} unit=""
                        idealMin={stageDetails.idealVitals.ec.min}
                        idealMax={stageDetails.idealVitals.ec.max}
                        colorClass="bg-orange-500"
                    />
                    <VitalBar
                        label={t('plantsView.vitals.moisture')}
                        value={plant.vitals.substrateMoisture}
                        min={0} max={100} unit="%"
                        idealMin={40}
                        idealMax={80}
                        colorClass="bg-blue-500"
                    />
                </div>
            </Card>

            <Card>
                 <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.detailedView.history')}</h3>
                <HistoryChart history={plant.history} />
            </Card>
        </div>
    );
};
