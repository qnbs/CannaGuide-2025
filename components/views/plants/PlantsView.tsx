import React, { useState, useMemo } from 'react';
import { Plant, Strain, GrowSetup } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { PlantCard } from '@/components/views/plants/PlantSlot';
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
import { selectActivePlants, selectOpenTasksSummary, selectActiveProblemsSummary, selectSelectedPlantId, selectPlantSlots } from '@/stores/selectors';

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
    // FIX: Get advanceDay from the store to pass to GardenVitals.
    const { waterAllPlants, startNewPlant, addNotification, advanceDay } = useAppStore(state => ({
        waterAllPlants: state.waterAllPlants,
        startNewPlant: state.startNewPlant,
        addNotification: state.addNotification,
        advanceDay: state.advanceDay,
    }));
    const plantSlots = useAppStore(selectPlantSlots);
    const plantsRecord = useAppStore(state => state.plants);

    const { t } = useTranslations();
    const selectedPlantId = useAppStore(selectSelectedPlantId);
    const setSelectedPlantId = useAppStore(state => state.setSelectedPlantId);
    
    const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null);
    const [strainForSetup, setStrainForSetup] = useState<Strain | null>(null);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

    const activePlants = useAppStore(selectActivePlants);
    const allTasks = useAppStore(selectOpenTasksSummary);
    const allProblems = useAppStore(selectActiveProblemsSummary);
    
    const selectedPlant = useMemo(() => {
        if (!selectedPlantId) return null;
        // Find from the most up-to-date record
        return plantsRecord[selectedPlantId] || null;
    }, [selectedPlantId, plantsRecord]);
    
    const plants = useMemo(() => plantSlots.map(id => id ? plantsRecord[id] : null), [plantSlots, plantsRecord]);

    const handleStartGrow = (setup: GrowSetup) => {
        if (!strainForSetup || selectingSlotIndex === null) return;
        
        const success = startNewPlant(strainForSetup, setup, selectingSlotIndex);
        if (success) {
            addNotification(t('plantsView.notifications.startSuccess', { name: strainForSetup.name }), 'success');
            setIsSetupModalOpen(false);
            setStrainForSetup(null);
            setSelectingSlotIndex(null);
        }
    };
    
    if (selectedPlant) {
        return <DetailedPlantView plant={selectedPlant} onClose={() => setSelectedPlantId(null)} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {isSetupModalOpen && strainForSetup && (
                <GrowSetupModal
                    strain={strainForSetup}
                    onClose={() => {
                        setIsSetupModalOpen(false);
                        setStrainForSetup(null);
                    }}
                    onConfirm={handleStartGrow}
                />
            )}

            <div className="lg:col-span-2 space-y-6">
                <TipOfTheDay />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plants.map((plant, index) => {
                        if (selectingSlotIndex === index) {
                            return (
                                <InlineStrainSelector 
                                    key={`selector-${index}`}
                                    onClose={() => setSelectingSlotIndex(null)}
                                    onSelectStrain={(strain) => {
                                        setStrainForSetup(strain);
                                        setIsSetupModalOpen(true);
                                    }}
                                />
                            );
                        }
                        return plant ? (
                            <PlantCard key={plant.id} plant={plant} onInspect={() => setSelectedPlantId(plant.id)} />
                        ) : (
                            <EmptyPlantSlot key={`empty-${index}`} onStart={() => setSelectingSlotIndex(index)} />
                        );
                    })}
                </div>
                 <GlobalAdvisorArchiveView />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <GardenVitals 
                    plants={activePlants} 
                    openTasksCount={allTasks.length}
                    onWaterAll={waterAllPlants}
                    // FIX: Pass the onAdvanceDay prop to GardenVitals.
                    onAdvanceDay={advanceDay}
                />
                <TasksAndWarnings tasks={allTasks} problems={allProblems} />
            </div>
        </div>
    );
};