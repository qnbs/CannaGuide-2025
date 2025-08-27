import React, { useState, useMemo } from 'react';
import { Plant, View, Task, PlantProblem, JournalEntry, JournalEntryType, TaskPriority } from '../../types';
import { PlantCard } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { usePlantManager } from '../../hooks/usePlantManager';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { TipCard } from './plants/TipCard';
import { WateringModal, FeedingModal, ObservationModal } from './plants/ActionModals';
import { useNotifications } from '../../context/NotificationContext';
import { STAGES_ORDER } from '../../../constants';

interface PlantsViewProps {
  plants: (Plant | null)[];
  setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
  setActiveView: (view: View) => void;
}

type SortKey = 'age' | 'stage' | 'name';
type ModalType = 'watering' | 'feeding' | 'observation' | null;

interface ModalState {
    plantId: string;
    type: ModalType;
}

const DashboardSummary: React.FC<{ 
    activePlantsCount: number, 
    openTasksCount: number, 
    onStartGrow: () => void,
    onWaterAll: () => void
}> = ({ activePlantsCount, openTasksCount, onStartGrow, onWaterAll }) => {

    return (
        <Card className="bg-gradient-to-br from-primary-50 to-blue-100 dark:from-slate-800 dark:to-blue-900/50">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">Grow Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-4">Willkommen zurück! Hier ist ein Überblick über deine aktuellen Grows.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{activePlantsCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aktive Grows</p>
                </div>
                <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{openTasksCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Offene Aufgaben</p>
                </div>
                 <div className="p-3 flex items-center justify-center">
                    <Button onClick={onWaterAll} variant="secondary" disabled={activePlantsCount === 0} className="w-full">
                        <PhosphorIcons.Drop className="inline w-5 h-5 mr-1.5"/>
                        Alle gießen
                    </Button>
                </div>
                 <div className="p-3 flex items-center justify-center">
                    <Button onClick={onStartGrow} disabled={activePlantsCount >= 3} className="w-full">
                        <PhosphorIcons.PlusCircle className="inline w-5 h-5 mr-1.5"/>
                        Pflanze hinzufügen
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export const PlantsView: React.FC<PlantsViewProps> = ({ plants: initialPlants, setPlants: setGlobalPlants, setActiveView }) => {
  const { addNotification } = useNotifications();
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('age');
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const {
      plants,
      updatePlantState,
      addJournalEntry,
      completeTask,
      waterAllPlants,
  } = usePlantManager(initialPlants, setGlobalPlants);

  const handleAddPlant = () => {
    setActiveView(View.Strains);
  };
  
  const handleWaterAll = () => {
    const count = waterAllPlants();
    if (count > 0) {
        addNotification(`${count} Pflanzen gegossen.`, 'success');
    } else {
        addNotification('Keine Pflanzen müssen gegossen werden.', 'info');
    }
  };
  
  const handleInspectPlant = (plantId: string) => {
    updatePlantState(plantId);
    setSelectedPlantId(plantId);
  };

  const handleOpenModal = (plantId: string, type: ModalType) => {
    setModalState({ plantId, type });
  };
  
  const handlePhotoClick = () => {
    addNotification('Fotogalerie-Funktion kommt bald!', 'info');
  };

  const handleAddJournalEntryFromModal = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
      if (modalState) {
          addJournalEntry(modalState.plantId, entry);
      }
  };
  
  const priorityClasses: Record<TaskPriority, string> = {
    high: 'border-red-500/50 bg-red-500/10',
    medium: 'border-amber-500/50 bg-amber-500/10',
    low: 'border-blue-500/50 bg-blue-500/10',
  };
  const priorityOrder: Record<TaskPriority, number> = { high: 1, medium: 2, low: 3 };

  const priorityIcons: Record<TaskPriority, { icon: React.ReactNode; color: string }> = {
    high: { icon: <PhosphorIcons.Lightning />, color: 'text-red-500' },
    medium: { icon: <PhosphorIcons.ArrowUp />, color: 'text-amber-500' },
    low: { icon: <PhosphorIcons.ArrowDown />, color: 'text-blue-500' },
  };

  const priorityLabels: Record<TaskPriority, string> = {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
  };


  const allTasks = useMemo(() => plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name })))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
  [plants]);
  
  const allProblems = plants
    .filter((p): p is Plant => p !== null)
    .flatMap(p => p.problems.map(problem => ({ ...problem, plantId: p.id, plantName: p.name })));

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <DashboardSummary 
                activePlantsCount={sortedPlants.length}
                openTasksCount={allTasks.length}
                onStartGrow={handleAddPlant}
                onWaterAll={handleWaterAll}
            />

            <TipCard />
            
            {sortedPlants.length === 0 ? (
                <Card className="flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-400 dark:border-slate-600 min-h-[300px]">
                    <PhosphorIcons.Plant className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Keine Pflanzen im Anbau</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Gehe zur Sorten-Datenbank, um deinen ersten Grow zu starten.</p>
                    <Button onClick={handleAddPlant}>Ersten Grow starten</Button>
                </Card>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Deine Growbox</h2>
                        <div className="flex items-center gap-2">
                           <label htmlFor="plant-sort-select" className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sortieren nach:</label>
                            <select id="plant-sort-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <option value="age">Alter</option>
                                <option value="stage">Phase</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {sortedPlants.map((plant) => (
                            <PlantCard
                                key={plant.id}
                                plant={plant}
                                onInspect={() => handleInspectPlant(plant.id)}
                                onWater={() => handleOpenModal(plant.id, 'watering')}
                                onFeed={() => handleOpenModal(plant.id, 'feeding')}
                                onLog={() => handleOpenModal(plant.id, 'observation')}
                                onPhoto={handlePhotoClick}
                            /> 
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card>
                <h3 className="text-xl font-bold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <PhosphorIcons.Checks className="w-6 h-6" /> Offene Aufgaben
                </h3>
                {allTasks.length > 0 ? (
                    <div className="space-y-3">
                        {allTasks.map(task => (
                            <div key={`${task.plantId}-${task.id}`} className={`p-2 border-l-4 ${priorityClasses[task.priority]} rounded-r-md flex items-center justify-between`}>
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.plantName}</p>
                                </div>
                                <div className={`w-5 h-5 flex-shrink-0 ${priorityIcons[task.priority].color}`} title={`Priorität: ${priorityLabels[task.priority]}`}>
                                    {priorityIcons[task.priority].icon}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Keine offenen Aufgaben. Alles im grünen Bereich!</p>
                )}
            </Card>
             <Card>
                <h3 className="text-xl font-bold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <PhosphorIcons.WarningCircle className="w-6 h-6" /> Aktive Warnungen
                </h3>
                {allProblems.length > 0 ? (
                    <div className="space-y-3">
                        {allProblems.map((problem, index) => (
                            <div key={`${problem.plantId}-${index}`} className="p-2 border-l-4 border-amber-500/50 bg-amber-500/10 rounded-r-md">
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{problem.message}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{problem.plantName}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Keine Probleme bei deinen Pflanzen festgestellt. Weiter so!</p>
                )}
            </Card>
        </div>
    </div>
     {modalState?.type === 'watering' && <WateringModal onClose={() => setModalState(null)} onConfirm={(details, notes) => handleAddJournalEntryFromModal({ type: 'WATERING', details, notes })} />}
     {modalState?.type === 'feeding' && <FeedingModal onClose={() => setModalState(null)} onConfirm={(details, notes) => handleAddJournalEntryFromModal({ type: 'FEEDING', details, notes })} />}
     {modalState?.type === 'observation' && <ObservationModal onClose={() => setModalState(null)} onConfirm={(details, notes) => handleAddJournalEntryFromModal({ type: 'OBSERVATION', details, notes })} />}
    </>
  );
};