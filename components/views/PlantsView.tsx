import React, { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { PlantSlot } from '@/components/views/plants/PlantSlot';
import { DetailedPlantView } from '@/components/views/plants/DetailedPlantView';
import { TipOfTheDay } from '@/components/views/plants/TipOfTheDay';
import { GardenVitals } from '@/components/views/plants/DashboardSummary';
import { TasksAndWarnings } from '@/components/views/plants/TasksAndWarnings';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { GlobalAdvisorArchiveView } from '@/components/views/plants/GlobalAdvisorArchiveView';
import { InlineStrainSelector } from '@/components/views/plants/InlineStrainSelector';
import { GrowSetupModal } from '@/components/views/plants/GrowSetupModal';
import { GrowConfirmationModal } from '@/components/views/plants/GrowConfirmationModal';
import { selectActivePlants, selectOpenTasksSummary, selectActiveProblemsSummary, selectSelectedPlantId, selectPlantSlots } from '@/stores/selectors';
import { AiDiagnostics } from '@/components/views/plants/AiDiagnostics';
import { Button } from '@/components/common/Button';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { t } = useTranslations();
    return (
        <Card
            onClick={onStart}
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 cursor-pointer transition-all card-interactive-glow"
        >
            <PhosphorIcons.PlusCircle className="w-12 h-12 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-300">{t('plantsView.emptySlot.title')}</h3>
            <p className="text-sm text-slate-500">{t('plantsView.emptySlot.subtitle')} <span className="hidden md:inline">{t('plantsView.emptySlot.subtitleInline')}</span></p>
        </Card>
    );
};

export const PlantsView: React.FC = () => {
    const { t } = useTranslations();
    
    // Optimized State Selection
    const { waterAllPlants, setSelectedPlantId, startGrowInSlot, selectStrainForGrow, confirmSetupAndShowConfirmation, cancelNewGrow } = useAppStore.getState();
    
    const initiatingGrowForSlot = useAppStore(state => state.initiatingGrowForSlot);
    const strainForNewGrow = useAppStore(state => state.strainForNewGrow);
    const isGrowSetupModalOpen = useAppStore(state => state.isGrowSetupModalOpen);
    const isConfirmationModalOpen = useAppStore(state => state.isConfirmationModalOpen);
    const plantSlots = useAppStore(selectPlantSlots);
    const plantsRecord = useAppStore(state => state.plants);
    const selectedPlantId = useAppStore(selectSelectedPlantId);
    
    const activePlants = useAppStore(selectActivePlants);
    const allTasks = useAppStore(selectOpenTasksSummary);
    const allProblems = useAppStore(selectActiveProblemsSummary);
    
    const selectedPlant = useMemo(() => {
        if (!selectedPlantId) return null;
        const plant = plantsRecord[selectedPlantId];
        return plant ? plant : null;
    }, [selectedPlantId, plantsRecord]);
    
    if (selectedPlant) {
        return <DetailedPlantView plant={selectedPlant} onClose={() => setSelectedPlantId(null)} />;
    }

    const showGrowFromStrainBanner = strainForNewGrow && initiatingGrowForSlot === null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {isGrowSetupModalOpen && strainForNewGrow && (
                <GrowSetupModal
                    strain={strainForNewGrow}
                    onClose={cancelNewGrow}
                    onConfirm={confirmSetupAndShowConfirmation}
                />
            )}
            {isConfirmationModalOpen && (
                <GrowConfirmationModal />
            )}

            <div className="lg:col-span-2 space-y-6">
                <TipOfTheDay />
                {showGrowFromStrainBanner && (
                    <Card className="bg-primary-900/40 border-primary-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-primary-300">{t('plantsView.inlineSelector.title')}</h3>
                            <p className="text-sm text-slate-300">{t('plantsView.inlineSelector.subtitle')} {strainForNewGrow.name}.</p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={cancelNewGrow}>
                            {t('common.cancel')}
                        </Button>
                    </Card>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plantSlots.map((plantId, index) => {
                        if (initiatingGrowForSlot === index) {
                            return (
                                <InlineStrainSelector 
                                    key={`selector-${index}`}
                                    onClose={cancelNewGrow}
                                    onSelectStrain={selectStrainForGrow}
                                />
                            );
                        }
                        const plant = plantId ? plantsRecord[plantId] : null;
                        return plant ? (
                            <PlantSlot key={plant.id} plant={plant} onInspect={() => setSelectedPlantId(plant.id)} />
                        ) : (
                            <EmptyPlantSlot key={`empty-${index}`} onStart={() => startGrowInSlot(index)} />
                        );
                    })}
                </div>
                 <AiDiagnostics />
                 <GlobalAdvisorArchiveView />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <GardenVitals 
                    openTasksCount={allTasks.length}
                    onWaterAll={waterAllPlants}
                />
                <TasksAndWarnings tasks={allTasks} problems={allProblems} />
            </div>
        </div>
    );
};