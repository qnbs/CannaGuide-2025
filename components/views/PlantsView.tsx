// This file was missing and has been recreated based on its usage across the application.
import React, { useState, useEffect, useMemo } from 'react';
import { Plant, View } from '../../types';
import { usePlants } from '../../hooks/usePlants';
import { PlantCard } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { TipOfTheDay } from './plants/TipOfTheDay';
import { GardenVitals } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { usePlantManager } from '../../hooks/usePlantManager';
import { useSettings } from '../../hooks/useSettings';
import { useTranslations } from '../../hooks/useTranslations';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Card } from '../common/Card';
// FIX: Correctly import GlobalAdvisorArchiveView.
import { GlobalAdvisorArchiveView } from './plants/GlobalAdvisorArchiveView';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { t } = useTranslations();
    return (
        <Card
            onClick={onStart}
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 cursor-pointer transition-all"
        >
            <PhosphorIcons.PlusCircle className="w-12 h-12 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-300">{t('plantsView.emptySlot.title')}</h3>
            <p className="text-sm text-slate-500">{t('plantsView.emptySlot.subtitle')}</p>
        </Card>
    );
};

interface PlantsViewProps {
    setActiveView: (view: View) => void;
}

export const PlantsView: React.FC<PlantsViewProps> = ({ setActiveView }) => {
    const { plants, waterAllPlants, advanceDay, updatePlantState } = usePlants();
    const { settings } = useSettings();
    const { t } = useTranslations();
    const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (settings.simulationSettings.autoAdvance) {
            updatePlantState(); // Initial update
            intervalId = setInterval(() => {
                updatePlantState();
            }, 5 * 60 * 1000); // every 5 minutes
        }
        return () => clearInterval(intervalId);
    }, [settings.simulationSettings.autoAdvance, updatePlantState]);

    const activePlants = useMemo(() => plants.filter((p): p is Plant => p !== null), [plants]);

    const allTasks = useMemo(() => activePlants.flatMap(p => 
        p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name }))
    ), [activePlants]);
    
    const allProblems = useMemo(() => activePlants.flatMap(p => 
        p.problems.map(problem => ({...problem, plantId: p.id, plantName: p.name}))
    ), [activePlants]);
    
    if (selectedPlant) {
        return <DetailedPlantView plant={selectedPlant} onClose={() => setSelectedPlant(null)} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <TipOfTheDay />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plants.map((plant, index) =>
                        plant ? (
                            <PlantCard key={plant.id} plant={plant} onInspect={() => setSelectedPlant(plant)} />
                        ) : (
                            <EmptyPlantSlot key={`empty-${index}`} onStart={() => setActiveView(View.Strains)} />
                        )
                    )}
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