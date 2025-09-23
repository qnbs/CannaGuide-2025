import React, { useState, useEffect, useMemo } from 'react';
import { Plant, View, Strain, GrowSetup } from '@/types';
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
import { selectActivePlants, selectPlantById, selectPlantSlots, selectPlantsRecord, selectSelectedPlantId, selectSettings } from '@/stores/selectors';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { t } = useTranslations();
    return (
        <Card
            onClick={onStart}
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 cursor-pointer transition-all"
        >
            <PhosphorIcons.PlusCircle className="w-12 h-12 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-300">{t('plantsView.emptySlot.title')}</h3>
            <p className="text-sm text-slate-500">{t('plantsView.emptySlot.subtitle')} <span className="hidden md:inline">{t('plantsView.emptySlot.subtitleInline')}</span></p>
        </Card>
    );
};

export const PlantsView: React.FC = () => {
    const { waterAllPlants, advanceDay, updatePlantState, startNewPlant } = useAppStore(state => ({
        waterAllPlants: state.waterAllPlants,
        advanceDay: state.advanceDay,
        updatePlantState: state.updatePlantState,
        startNewPlant: state.startNewPlant,
    }));
    const settings = useAppStore(selectSettings);
    const plantSlots = useAppStore(selectPlantSlots);
    const plantsRecord = useAppStore(selectPlantsRecord);
    const activePlants = useAppStore(selectActivePlants);
    
    const { t } = useTranslations();
    const selectedPlantId = useAppStore(selectSelectedPlantId);
    const setSelectedPlantId = useAppStore(state => state.setSelectedPlantId);

    const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null);
    const [strainForSetup, setStrainForSetup] = useState<Strain | null>(null);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

    useEffect(() => {
        if (settings.simulationSettings.autoAdvance) {
            updatePlantState();
            const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed];
            const intervalId = setInterval(updatePlantState, speedInMinutes * 60 * 1000); 
            return () => clearInterval(intervalId);
        }
    }, [settings.simulationSettings.autoAdvance, settings.simulationSettings.speed, updatePlantState]);

    const allTasks = useMemo(() => activePlants.flatMap(p => 
        p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name }))
    ), [activePlants]);
    
    const allProblems = useMemo(() => activePlants.flatMap(p => 
        p.problems.map(problem => ({...problem, plantId: p.id, plantName: p.name}))
    ), [activePlants]);
    
    const selectedPlant = useAppStore(selectPlantById(selectedPlantId));

    const handleStartGrow = (setup: GrowSetup) => {
        if (!strainForSetup || selectingSlotIndex === null) return;
        
        const success = startNewPlant(strainForSetup, setup, selectingSlotIndex);
        if (success) {
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
                    {plantSlots.map((plantId, index) => {
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
                        const plant = plantId ? plantsRecord[plantId] : null;
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
                    onAdvanceDay={advanceDay}
                />
                <TasksAndWarnings tasks={allTasks} problems={allProblems} />
            </div>
        </div>
    );
};
