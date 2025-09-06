import React, { useMemo } from 'react';
// FIX: Import JournalEntry to resolve type errors. This fixes both reported errors in this file.
import { Plant, View, Task, PlantProblem, PlantStage, JournalEntry } from '../../types';
import { PlantCard } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { useNotifications } from '../../context/NotificationContext';
import { useTranslations } from '../../hooks/useTranslations';
import { DashboardSummary } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { Card } from '../common/Card';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Button } from '../common/Button';
import { ModalState } from '../common/ActionModalsContainer';
import { AiDiagnostics } from './plants/AiDiagnostics';
import { CombinedHistoryChart } from './plants/CombinedHistoryChart';


interface PlantsViewProps {
  plants: (Plant | null)[];
  setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
  setActiveView: (view: View) => void;
  selectedPlantId: string | null;
  setSelectedPlantId: (id: string | null) => void;
  setModalState: (state: ModalState | null) => void;
  completeTask: (plantId: string, taskId: string) => void;
  advanceDay: () => void;
  updatePlantState: (plantId: string) => void;
}

const EmptySlotCard: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
    const { t } = useTranslations();
    return (
        <Card 
            className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-600 min-h-[250px] h-full transition-colors hover:border-primary-500 hover:bg-slate-800/50 cursor-pointer"
            onClick={onAdd}
        >
            <PhosphorIcons.PlusCircle className="w-12 h-12 text-slate-500 mb-2" />
            <h3 className="font-semibold text-slate-300">{t('plantsView.summary.addPlant')}</h3>
            <p className="text-xs text-slate-400">{t('plantsView.noPlants.subtitle')}</p>
        </Card>
    );
}


export const PlantsView: React.FC<PlantsViewProps> = ({ 
    plants, 
    setPlants, 
    setActiveView,
    selectedPlantId,
    setSelectedPlantId,
    setModalState,
    completeTask,
    advanceDay,
    updatePlantState,
}) => {
  const { t } = useTranslations();
  const { addNotification } = useNotifications();

  const handleAddPlant = () => {
    setActiveView(View.Strains);
  };
  
  const handleInspectPlant = (plantId: string) => {
    updatePlantState(plantId);
    setSelectedPlantId(plantId);
  };
  
  const allTasks = useMemo(() => plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name })))
    .sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
  [plants]);
  
  const allProblems = useMemo(() => plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.problems.map(problem => ({ ...problem, plantId: p.id, plantName: p.name }))),
  [plants]);

  const selectedPlant = plants.find(p => p?.id === selectedPlantId) ?? null;

  const activePlants = useMemo(() => plants.filter((p): p is Plant => p !== null), [plants]);

  if (selectedPlant) {
      const addJournalEntryForSelectedPlant = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
        // Find the correct plant from the main `plants` array to pass to the handler
        const plantToUpdate = plants.find(p => p?.id === selectedPlant.id);
        if (plantToUpdate) {
            const newJournal = [...plantToUpdate.journal, { ...entry, id: `manual-${Date.now()}`, timestamp: Date.now() }];
            const newPlants = plants.map(p => p?.id === selectedPlant.id ? {...p, journal: newJournal} : p);
             setPlants(newPlants);
        }
      };
      
      return <DetailedPlantView 
                key={selectedPlant.id}
                plant={selectedPlant} 
                onClose={() => setSelectedPlantId(null)} 
                onAddJournalEntry={addJournalEntryForSelectedPlant}
                onCompleteTask={(taskId) => completeTask(selectedPlant.id, taskId)}
             />;
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
            <DashboardSummary 
                plants={activePlants}
                openTasksCount={allTasks.length}
                onWaterAll={() => {
                    const count = activePlants.filter(p => p.vitals.substrateMoisture < 50).length;
                     if (count > 0) {
                        addNotification(t('plantsView.notifications.waterAllSuccess', { count }), 'success');
                    } else {
                        addNotification(t('plantsView.notifications.waterAllNone'), 'info');
                    }
                }}
                onAdvanceDay={advanceDay}
            />

            <Card className="flex-grow">
                <h2 className="text-2xl font-semibold font-display mb-4 text-slate-200">{t('plantsView.yourGrowbox')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plants.map((plant, index) => (
                        plant 
                            ? <PlantCard key={plant.id} plant={plant} onInspect={() => handleInspectPlant(plant.id)} /> 
                            : <EmptySlotCard key={`empty-${index}`} onAdd={handleAddPlant} />
                    ))}
                </div>
            </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            {activePlants.length > 0 && (
                <Card>
                    <h3 className="text-xl font-bold font-display mb-4 text-primary-400">Growth Comparison Chart</h3>
                     <div className="h-64">
                       <CombinedHistoryChart plants={activePlants} />
                    </div>
                </Card>
            )}
            <AiDiagnostics />
            <TasksAndWarnings tasks={allTasks} problems={allProblems} />
        </div>
    </div>
  );
};