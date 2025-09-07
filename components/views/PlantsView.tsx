import React, { useState } from 'react';
import { Plant, View, JournalEntry, ArchivedAdvisorResponse, AIResponse } from '../../types';
import { PlantCard } from './plants/PlantSlot';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTranslations } from '../../hooks/useTranslations';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { DashboardSummary } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { TipOfTheDay } from './plants/TipOfTheDay';
import { CombinedHistoryChart } from './plants/CombinedHistoryChart';
import { AiDiagnostics } from './plants/AiDiagnostics';
import { ModalState } from '../../common/ActionModalsContainer';
import { GlobalAdvisorArchiveView } from './plants/GlobalAdvisorArchiveView';
import { Tabs } from '../common/Tabs';

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
  onWaterAll: () => void;
  advisorArchive: Record<string, ArchivedAdvisorResponse[]>;
  addAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
  updateAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
  deleteAdvisorResponse: (plantId: string, responseId: string) => void;
}

type PlantsViewTab = 'dashboard' | 'archive';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useTranslations();
  return (
    <Card className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 transition-colors">
      <h3 className="font-semibold text-lg text-slate-300">{t('plantsView.emptySlot.title')}</h3>
      <p className="text-sm text-slate-400 mb-4">{t('plantsView.emptySlot.subtitle')}</p>
      <Button onClick={onStart}>{t('plantsView.emptySlot.button')}</Button>
    </Card>
  );
};

export const PlantsView: React.FC<PlantsViewProps> = ({
  plants,
  setActiveView,
  selectedPlantId,
  setSelectedPlantId,
  setModalState,
  completeTask,
  advanceDay,
  onWaterAll,
  advisorArchive,
  addAdvisorResponse,
  updateAdvisorResponse,
  deleteAdvisorResponse
}) => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<PlantsViewTab>('dashboard');
  const activePlants = plants.filter((p): p is Plant => p !== null);
  const selectedPlant = activePlants.find(p => p.id === selectedPlantId) || null;

  const handleAddJournalEntry = (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
      setModalState({ type: (entry.type as string).toLowerCase(), plantId });
  };

  const allTasks = activePlants.flatMap(p => 
    p.tasks.filter(t => !t.isCompleted).map(t => ({ ...t, plantId: p.id, plantName: p.name }))
  );
  const allProblems = activePlants.flatMap(p => 
    p.problems.map(prob => ({ ...prob, plantId: p.id, plantName: p.name }))
  );

  const tabs = [
      { id: 'dashboard', label: t('plantsView.tabs.dashboard') },
      { id: 'archive', label: t('plantsView.tabs.archive') },
  ];

  if (selectedPlant) {
    return (
      <DetailedPlantView
        plant={selectedPlant}
        onClose={() => setSelectedPlantId(null)}
        onAddJournalEntry={(entry) => handleAddJournalEntry(selectedPlant.id, entry)}
        onCompleteTask={(taskId) => completeTask(selectedPlant.id, taskId)}
        advisorArchive={advisorArchive[selectedPlant.id] || []}
        addAdvisorResponse={addAdvisorResponse}
        updateAdvisorResponse={updateAdvisorResponse}
        deleteAdvisorResponse={deleteAdvisorResponse}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
        <div className="mb-6 flex-shrink-0">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as PlantsViewTab)} />
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto">
        {activeTab === 'dashboard' ? (
             <div className="space-y-6">
                <DashboardSummary
                    plants={activePlants}
                    openTasksCount={allTasks.length}
                    onAdvanceDay={advanceDay}
                    onWaterAll={onWaterAll}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plants.map((plant, index) => (
                    <div key={index} className="h-full">
                        {plant ? (
                        <PlantCard plant={plant} onInspect={() => setSelectedPlantId(plant.id)} />
                        ) : (
                        <EmptyPlantSlot onStart={() => setActiveView(View.Strains)} />
                        )}
                    </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                    <TasksAndWarnings tasks={allTasks} problems={allProblems} />
                    <AiDiagnostics plant={null} />
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400">{t('plantsView.summary.heightChart')}</h3>
                        <div className="h-64">
                            <CombinedHistoryChart plants={activePlants} />
                        </div>
                    </Card>
                    <TipOfTheDay />
                    </div>
                </div>
            </div>
        ) : (
            <GlobalAdvisorArchiveView 
                archive={advisorArchive} 
                plants={activePlants} 
                updateResponse={updateAdvisorResponse} 
                deleteResponse={deleteAdvisorResponse} 
            />
        )}
       </div>
    </div>
  );
};