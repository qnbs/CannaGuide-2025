import React, { useState, useEffect, useMemo } from 'react';
import { Plant, View } from '@/types';
import { usePlants } from '@/hooks/usePlants';
import { PlantCard } from '@/components/views/plants/PlantSlot';
import { DetailedPlantView } from '@/components/views/plants/DetailedPlantView';
import { TipOfTheDay } from '@/components/views/plants/TipOfTheDay';
import { GardenVitals } from '@/components/views/plants/DashboardSummary';
import { TasksAndWarnings } from '@/components/views/plants/TasksAndWarnings';
import { useSettings } from '@/hooks/useSettings';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { GlobalAdvisorArchiveView } from '@/components/views/plants/GlobalAdvisorArchiveView';

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
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (settings.simulationSettings.autoAdvance) {
            updatePlantState(); // Initial update
            const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed];
            intervalId = setInterval(() => {
                updatePlantState();
            }, speedInMinutes * 60 * 1000); 
        }
        return () => clearInterval(intervalId);
    }, [settings.simulationSettings.autoAdvance, settings.simulationSettings.speed, updatePlantState]);

    const activePlants = useMemo(() => plants.filter((p): p is Plant => p !== null), [plants]);

    const allTasks = useMemo(() => activePlants.flatMap(p => 
        p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name }))
    ), [activePlants]);
    
    const allProblems = useMemo(() => activePlants.flatMap(p => 
        p.problems.map(problem => ({...problem, plantId: p.id, plantName: p.name}))
    ), [activePlants]);
    
    const selectedPlant = useMemo(() => {
        if (!selectedPlantId) return null;
        return activePlants.find(p => p.id === selectedPlantId) || null;
    }, [selectedPlantId, activePlants]);

    if (selectedPlant) {
        return <DetailedPlantView plant={selectedPlant} onClose={() => setSelectedPlantId(null)} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <TipOfTheDay />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plants.map((plant, index) =>
                        plant ? (
                            <PlantCard key={plant.id} plant={plant} onInspect={() => setSelectedPlantId(plant.id)} />
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