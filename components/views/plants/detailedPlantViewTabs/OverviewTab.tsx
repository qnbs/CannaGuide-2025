import React from 'react';
import { Plant, PlantStage } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { PlantLifecycleTimeline } from '../PlantLifecycleTimeline';
import { VitalBar } from '../VitalBar';
import { HistoryChart } from '../HistoryChart';
import { PlantVisualizer } from '../PlantVisualizer';
import { ActionToolbar } from '../ActionToolbar';
import { ModalType } from '../LogActionModal';
import { VPDGauge } from '../VPDGauge';

interface OverviewTabProps {
    plant: Plant;
    onLogAction: (type: NonNullable<ModalType>) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant, onLogAction }) => {
    const { t } = useTranslations();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    return (
        <div className="space-y-6">
            <Card>
                <ActionToolbar onAction={onLogAction} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {!isPostHarvest && <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />}
                    <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400">{t('plantsView.detailedView.history')}</h3>
                        <HistoryChart history={plant.history} idealHistory={[]} idealVitalRanges={[]}/>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400">{t('plantsView.detailedView.vitals')}</h3>
                        <div className="space-y-3">
                            <VitalBar label={t('plantsView.vitals.ph')} value={plant.substrate.ph} min={5} max={8} unit="" idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} colorClass="bg-yellow-500" />
                            <VitalBar label={t('plantsView.vitals.ec')} value={plant.substrate.ec} min={0} max={3} unit="" idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} colorClass="bg-orange-500" />
                            <VitalBar label={t('plantsView.vitals.moisture')} value={plant.substrate.moisture} min={0} max={100} unit="%" idealMin={40} idealMax={80} colorClass="bg-blue-500" />
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400">{t('plantsView.detailedView.environment')}</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <VPDGauge temperature={plant.environment.internalTemperature} humidity={plant.environment.internalHumidity} />
                             <div>
                                <p className="text-3xl font-bold">{plant.environment.internalTemperature.toFixed(1)}°C</p>
                                <p className="text-sm text-slate-400">{t('plantsView.setupModal.temp')}</p>
                                <p className="text-3xl font-bold mt-4">{plant.environment.internalHumidity.toFixed(1)}%</p>
                                <p className="text-sm text-slate-400">{t('plantsView.setupModal.humidity')}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
             <Card>
                <h3 className="text-xl font-bold font-display mb-4 text-primary-400">Plant Visualizer</h3>
                <div className="flex justify-center items-center h-64">
                    <PlantVisualizer plant={plant} />
                </div>
            </Card>
        </div>
    );
};
