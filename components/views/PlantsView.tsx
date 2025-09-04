import React, { useMemo, useState } from 'react';
import { Plant, View, Task, PlantProblem, JournalEntry, JournalEntryType, TaskPriority, PlantStage } from '../../types';
import { PlantCard } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { usePlantManager } from '../../hooks/usePlantManager';
import { useNotifications } from '../../context/NotificationContext';
import { STAGES_ORDER } from '../../constants';
import { useTranslations } from '../../hooks/useTranslations';
import { DashboardSummary } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { Card } from '../common/Card';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Button } from '../common/Button';
import { ModalState, ModalType } from '../common/ActionModalsContainer';


interface PlantsViewProps {
  plants: (Plant | null)[];
  setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
  setActiveView: (view: View) => void;
  selectedPlantId: string | null;
  setSelectedPlantId: (id: string | null) => void;
  setModalState: (state: ModalState | null) => void;
  completeTask: (plantId: string, taskId: string) => void;
}

type SortKey = 'age' | 'stage' | 'name';

export const PlantsView: React.FC<PlantsViewProps> = ({ 
    plants: initialPlants, 
    setPlants: setGlobalPlants, 
    setActiveView,
    selectedPlantId,
    setSelectedPlantId,
    setModalState,
    completeTask,
}) => {
  const { t } = useTranslations();
  const { addNotification } = useNotifications();
  const [sortKey, setSortKey] = useState<SortKey>('age');

  const {
      plants,
      updatePlantState,
      addJournalEntry,
      waterAllPlants,
  } = usePlantManager(initialPlants, setGlobalPlants);

  const handleAddPlant = () => {
    setActiveView(View.Strains);
  };
  
  const handleWaterAll = () => {
    const count = waterAllPlants();
    if (count > 0) {
        addNotification(t('plantsView.notifications.waterAllSuccess', { count }), 'success');
    } else {
        addNotification(t('plantsView.notifications.waterAllNone'), 'info');
    }
  };
  
  const handleInspectPlant = (plantId: string) => {
    updatePlantState(plantId);
    setSelectedPlantId(plantId);
  };
  
  const handlePhotoClick = () => {
    addNotification(t('plantsView.notifications.photoGallerySoon'), 'info');
  };
  
  const priorityOrder: Record<TaskPriority, number> = { high: 1, medium: 2, low: 3 };

  const allTasks = useMemo(() => plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name })))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
  [plants]);
  
  const allProblems = useMemo(() => plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.problems.map(problem => ({ ...problem, plantId: p.id, plantName: p.name }))),
  [plants]);

  const selectedPlant = plants.find(p => p?.id === selectedPlantId) ?? null;

  const sortedPlants = useMemo(() => {
    const active = plants.filter((p): p is Plant => p !== null);
    return active.sort((a, b) => {
        if (sortKey === 'name') {
            return a.name.localeCompare(b.name);
        }
        if (sortKey === 'age') {
            return b.age - a.age; // Newest first
        }
        if (sortKey === 'stage') {
            return STAGES_ORDER.indexOf(b.stage) - STAGES_ORDER.indexOf(a.stage);
        }
        return 0;
    });
  }, [plants, sortKey]);

  if (selectedPlant) {
      return <DetailedPlantView 
                key={selectedPlant.id}
                plant={selectedPlant} 
                onClose={() => setSelectedPlantId(null)} 
                onAddJournalEntry={(entry) => addJournalEntry(selectedPlant.id, entry)}
                onCompleteTask={(taskId) => completeTask(selectedPlant.id, taskId)}
             />;
  }
  
  return (
    <>
      <div className="space-y-6">
        <DashboardSummary 
            activePlantsCount={sortedPlants.length}
            openTasksCount={allTasks.length}
            onStartGrow={handleAddPlant}
            onWaterAll={handleWaterAll}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {sortedPlants.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-400 dark:border-slate-600 min-h-[300px]">
                        <PhosphorIcons.Plant className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">{t('plantsView.noPlants.title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">{t('plantsView.noPlants.subtitle')}</p>
                        <Button onClick={handleAddPlant}>{t('plantsView.noPlants.button')}</Button>
                    </Card>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">{t('plantsView.yourGrowbox')}</h2>
                            <div className="flex items-center gap-2">
                               <label htmlFor="plant-sort-select" className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('plantsView.sortBy')}:</label>
                                <select id="plant-sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option value="age">{t('plantsView.sortOptions.age')}</option>
                                    <option value="stage">{t('plantsView.sortOptions.stage')}</option>
                                    <option value="name">{t('plantsView.sortOptions.name')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {sortedPlants.map((plant) => (
                                <PlantCard
                                    key={plant.id}
                                    plant={plant}
                                    onInspect={() => handleInspectPlant(plant.id)}
                                    onWater={() => setModalState({plantId: plant.id, type: 'watering'})}
                                    onFeed={() => setModalState({plantId: plant.id, type: 'feeding'})}
                                    onLog={() => setModalState({plantId: plant.id, type: 'observation'})}
                                    onPhoto={handlePhotoClick}
                                /> 
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-1">
                 <TasksAndWarnings tasks={allTasks} problems={allProblems} />
            </div>
        </div>
      </div>
    </>
  );
};