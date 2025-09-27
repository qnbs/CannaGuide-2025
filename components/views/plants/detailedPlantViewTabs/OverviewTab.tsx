import React, { useState } from 'react';
import { Plant, PlantStage, Scenario } from '../../../../types';
import { useTranslations } from '../../../../hooks/useTranslations';
import { Card } from '../../../common/Card';
import { PlantVisualizer } from '../PlantVisualizer';
import { VitalBar } from '../VitalBar';
import { PLANT_STAGE_DETAILS } from '../../../../services/plantSimulationService';
import { HistoryChart } from '../HistoryChart';
import { PlantLifecycleTimeline } from '../PlantLifecycleTimeline';
import { RealtimeStatus } from '../RealtimeStatus';
import { EquipmentControls } from '../EquipmentControls';
import { LogActionModal, ModalType } from '../LogActionModal';
import { ActionToolbar } from '../ActionToolbar';
import { DeepDiveModal } from '../deepDive/DeepDiveModal';
import { ComparisonView } from '../ComparisonView';
import { useAppStore } from '../../../../stores/useAppStore';
import { Button } from '../../../common/Button';
import { PhosphorIcons } from '../../../icons/PhosphorIcons';

interface OverviewTabProps {
    plant: Plant;
}

const StatCard: React.FC<{
    label: string;
    value: string;
    unit?: string;
}> = ({ label, value, unit }) => (
    <div className="glass-pane p-3 rounded-lg text-center">
        <p className="text-2xl font-bold font-mono text-primary-300">
            {value} <span className="text-lg">{unit}</span>
        </p>
        <p className="text-xs text-slate-400">{label}</p>
    </div>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [modalType, setModalType] = useState<ModalType>('watering');
    const [deepDiveTopic, setDeepDiveTopic] = useState<string | null>(null);
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
    const harvestPlant = useAppStore(state => state.harvestPlant);

    const handleLogAction = (type: ModalType) => {
        setModalType(type);
        setIsActionModalOpen(true);
    };

    const floweringStartTime = PLANT_STAGE_DETAILS[PlantStage.Seedling].duration + PLANT_STAGE_DETAILS[PlantStage.Vegetative].duration;
    const isHarvestReady = plant.stage === PlantStage.Flowering && plant.age >= (floweringStartTime + plant.strain.floweringTime * 7);

    return (
        <>
            {isActionModalOpen && <LogActionModal plant={plant}
                type={modalType}
                onClose={() => setIsActionModalOpen(false)}
                onLearnMore={setDeepDiveTopic}
            />}
            {deepDiveTopic && <DeepDiveModal plant={plant}
                topic={deepDiveTopic}
                onClose={() => setDeepDiveTopic(null)}
                onRunScenario={(scenario) => setActiveScenario(scenario)}
            />}
            {activeScenario && <ComparisonView plant={plant}
                scenario={activeScenario}
                onClose={() => setActiveScenario(null)}
            />}
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 flex items-center justify-center">
                        <PlantVisualizer plant={plant} className="w-64 h-64" />
                    </Card>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <RealtimeStatus createdAt={plant.createdAt} isSimulationActive={useAppStore.getState().settings.simulationSettings.autoAdvance} />
                        <EquipmentControls plant={plant} />
                    </div>
                </div>

                <Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label={t('common.stage')} value={t(`plantStages.${plant.stage}`)} />
                        <StatCard label={t('common.health')} value={plant.health.toFixed(0)} unit="%" />
                        <StatCard label={t('common.height')} value={plant.height.toFixed(1)} unit="cm" />
                        <StatCard label={t('common.biomass')} value={plant.biomass.toFixed(1)} unit="g" />
                    </div>
                </Card>

                <Card>
                    <ActionToolbar onLogAction={handleLogAction} />
                    {isHarvestReady && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <Button onClick={() => harvestPlant(plant.id)} className="w-full">
                                <PhosphorIcons.Scissors className="w-5 h-5 mr-2" />
                                {t('plantsView.harvestPlant')}
                            </Button>
                        </div>
                    )}
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400">
                            {t('plantsView.detailedView.history')}
                        </h3>
                        <HistoryChart history={plant.history} journal={plant.journal} plantCreatedAt={plant.createdAt} />
                    </Card>
                    <Card>
                        <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                            {t('plantsView.detailedView.environment')}
                        </h3>
                        <div className="space-y-3">
                            <VitalBar label={t('common.temperature')} value={plant.environment.internalTemperature} min={15} max={35} idealMin={22} idealMax={28} unit="°C" colorClass="bg-red-500" />
                            <VitalBar label={t('common.humidity')} value={plant.environment.internalHumidity} min={30} max={90} idealMin={50} idealMax={70} unit="%" colorClass="bg-blue-500" />
                            <VitalBar label={t('common.vpd')} value={plant.environment.vpd} min={0} max={2.0} idealMin={stageDetails.idealVpd.min} idealMax={stageDetails.idealVpd.max} unit="kPa" colorClass="bg-purple-500" />
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-bold font-display text-primary-400 mb-3">
                            {t('plantsView.detailedView.substrateAndRoots')}
                        </h3>
                        <div className="space-y-3">
                            <VitalBar label={t('common.ph')} value={plant.substrate.ph} min={5} max={8} idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} unit="" colorClass="bg-yellow-500" />
                            <VitalBar label={t('common.ec')} value={plant.substrate.ec} min={0} max={3} idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} unit="mS" colorClass="bg-orange-500" />
                            <VitalBar label={t('common.moisture')} value={plant.substrate.moisture} min={0} max={100} idealMin={30} idealMax={80} unit="%" colorClass="bg-sky-500" />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};
