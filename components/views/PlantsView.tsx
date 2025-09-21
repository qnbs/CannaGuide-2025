import React, { useState, useMemo } from 'react';
import { Plant, View, JournalEntry, ArchivedAdvisorResponse, AIResponse, Task, PlantProblem } from '../../types';
import { PlantCard } from './plants/PlantSlot';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTranslations } from '../../hooks/useTranslations';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { TipOfTheDay } from './plants/TipOfTheDay';
import { CombinedHistoryChart } from './plants/CombinedHistoryChart';
import { AiDiagnostics } from './plants/AiDiagnostics';
import { ModalState } from '../../common/ActionModalsContainer';
import { GlobalAdvisorArchiveView } from './plants/GlobalAdvisorArchiveView';
import { Tabs } from '../common/Tabs';
import { usePlants } from '../../hooks/usePlants';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { GardenVitals } from './plants/DashboardSummary';

interface PlantsViewProps {
  setActiveView: (view: View) => void;
  selectedPlantId: string | null;
  setSelectedPlantId: (id: string | null) => void;
  setModalState: (state: ModalState | null) => void;
  advisorArchive: Record<string, ArchivedAdvisorResponse[]>;
  addAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
  updateAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
  deleteAdvisorResponse: (plantId: string, responseId: string) => void;
}

type PlantsViewTab = 'dashboard' | 'archive';
type ActionCenterTab = 'tasks' | 'diagnostics' | 'tip';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useTranslations();
  return (
    <Card className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 transition-colors card-interactive" onClick={onStart}>
      <h3 className="font-semibold text-lg text-slate-300">{t('plantsView.emptySlot.title')}</h3>
      <p className="text-sm text-slate-400 mb-4">{t('plantsView.emptySlot.subtitle')}</p>
      <Button>{t('plantsView.emptySlot.button')}</Button>
    </Card>
  );
};

const ActionCenter: React.FC<{
    tasks: (Task & { plantId: string, plantName: string })[],
    problems: (PlantProblem & { plantId: string, plantName: string })[],
}> = ({ tasks, problems }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<ActionCenterTab>('tasks');

    const tabs = useMemo(() => [
        { id: 'tasks', label: t('plantsView.actionCenter.tasks'), icon: <PhosphorIcons.Checks /> },
        { id: 'diagnostics', label: t('plantsView.actionCenter.diagnostics'), icon: <PhosphorIcons.MagicWand /> },
        { id: 'tip', label: t('plantsView.actionCenter.tip'), icon: <PhosphorIcons.LightbulbFilament /> },
    ], [t]);
    
    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
                <PhosphorIcons.Lightning className="w-6 h-6"/>
                {t('plantsView.actionCenter.title')}
            </h3>
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as ActionCenterTab)} />
            <div className="mt-4">
                {activeTab === 'tasks' && <TasksAndWarnings tasks={tasks} problems={problems} />}
                {activeTab === 'diagnostics' && <AiDiagnostics plant={null} />}
                {activeTab === 'tip' && <TipOfTheDay />}
            </div>
        </Card>
    );
};


export const PlantsView: React.FC<PlantsViewProps> = ({
  setActiveView,
  selectedPlantId,
  setSelectedPlantId,
  setModalState,
  advisorArchive,
  addAdvisorResponse,
  updateAdvisorResponse,
  deleteAdvisorResponse
}) => {
  const { t } = useTranslations();
  const { plants, completeTask, waterAllPlants, advanceDay } = usePlants();
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
      { id: 'dashboard', label: t('plantsView.tabs.dashboard'), icon: <PhosphorIcons.ChartPieSlice /> },
      { id: 'archive', label: t('plantsView.tabs.archive'), icon: <PhosphorIcons.Archive /> },
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
        <div className="flex-shrink-0 mb-6">
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as PlantsViewTab)} />
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto">
        {activeTab === 'dashboard' ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <GardenVitals plants={activePlants} openTasksCount={allTasks.length} onWaterAll={waterAllPlants} onAdvanceDay={advanceDay} />
                    <ActionCenter tasks={allTasks} problems={allProblems} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

                    <Card>
                        <h3 className="text-xl font-bold font-display mb-4 text-primary-400 flex items-center gap-2">
                            <PhosphorIcons.Ruler className="w-6 h-6"/>
                            {t('plantsView.summary.heightChart')}
                        </h3>
                        <div className="h-64">
                            <CombinedHistoryChart plants={activePlants} />
                        </div>
                    </Card>
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