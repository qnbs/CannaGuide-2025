
import React, { useState, memo, useEffect } from 'react';
import { Plant, PlantStage, ModalType, Task, TaskPriority } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Tabs } from '@/components/common/Tabs';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { PostHarvestTab } from './detailedPlantViewTabs/PostHarvestTab';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { completeTask, updatePlantToNow } from '@/stores/slices/simulationSlice';
import { openActionModal as openActionModalAction, openDiagnosticsModal } from '@/stores/slices/uiSlice';
import { selectIsExpertMode } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { PlantVisualizer } from './PlantVisualizer';
import { VitalBar } from './VitalBar';
import { ActionToolbar } from './ActionToolbar';


interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = memo(({ plant, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    const isExpertMode = useAppSelector(selectIsExpertMode);
    
    useEffect(() => {
        dispatch(updatePlantToNow(plant.id));
    }, [plant.id, dispatch]);

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    const tabs = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        ...(isPostHarvest ? [{ id: 'postharvest', label: t('plantsView.detailedView.tabs.postHarvest'), icon: <PhosphorIcons.ArchiveBox /> }] : []),
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.ListChecks /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
        { id: 'ai', label: t('plantsView.detailedView.tabs.ai'), icon: <PhosphorIcons.Sparkle /> },
    ];

    const header = (
        <header>
            <div className="flex items-center justify-between">
                <Button variant="secondary" onClick={onClose}>
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                 <Button onClick={() => dispatch(openDiagnosticsModal(plant.id))}>
                    <PhosphorIcons.Sparkle className="w-5 h-5 mr-2" />
                    {t('plantsView.aiDiagnostics.diagnoseProblem')}
                </Button>
            </div>
            <div className="mt-4">
                <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">{plant.name}</h1>
                <p className="text-slate-400">{plant.strain.name} - {t('plantsView.plantCard.day')} {plant.age}</p>
            </div>
        </header>
    );

    if (!isExpertMode) {
        const openTasks = plant.tasks.filter(t => !t.isCompleted);
        const priorityClasses: Record<TaskPriority, string> = { high: 'border-red-500/50 bg-red-500/10', medium: 'border-amber-500/50 bg-amber-500/10', low: 'border-blue-500/50 bg-blue-500/10', };
        const priorityIcons: Record<TaskPriority, { icon: React.ReactNode; color: string }> = { high: { icon: <PhosphorIcons.Lightning />, color: 'text-red-500' }, medium: { icon: <PhosphorIcons.ArrowUp />, color: 'text-amber-500' }, low: { icon: <PhosphorIcons.ArrowDown />, color: 'text-blue-500' }, };
        const priorityLabels: Record<TaskPriority, string> = { high: t('plantsView.tasks.priorities.high'), medium: t('plantsView.tasks.priorities.medium'), low: t('plantsView.tasks.priorities.low'), };
    
        return (
            <div className="animate-fade-in space-y-4">
                {header}
                <div className="space-y-6">
                     <Card>
                        <div className="flex flex-col items-center">
                            <PlantVisualizer plant={plant} className="w-48 h-48" />
                        </div>
                    </Card>
    
                    <Card>
                        <h3 className="text-xl font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.vitals')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <VitalBar value={plant.health} min={80} max={100} label={t('plantsView.summary.gardenHealth')} unit="%" />
                            <VitalBar value={plant.medium.moisture} min={20} max={80} label={t('plantsView.vitals.moisture')} unit="%" />
                        </div>
                    </Card>
                    
                    <Card>
                        <ActionToolbar onLogAction={(type: ModalType) => dispatch(openActionModalAction({ plantId: plant.id, type }))} />
                    </Card>
                    
                    <Card>
                        <h3 className="text-lg font-bold font-display text-primary-400 mb-3">{t('plantsView.summary.openTasks')} ({openTasks.length})</h3>
                        {openTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {openTasks.map(task => (
                                   <li key={task.id} className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${priorityClasses[task.priority]}`}>
                                       <div className="flex-grow">
                                           <p className="font-semibold text-slate-100">{t(task.title) || task.title}</p>
                                           <p className="text-sm text-slate-300">{t(task.description) || task.description}</p>
                                       </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 flex-shrink-0 ${priorityIcons[task.priority].color}`} title={`${t('plantsView.tasks.priority')}: ${priorityLabels[task.priority]}`}>
                                                {priorityIcons[task.priority].icon}
                                            </div>
                                           <Button size="sm" onClick={() => dispatch(completeTask({ plantId: plant.id, taskId: task.id }))}>{t('plantsView.detailedView.tasksComplete')}</Button>
                                       </div>
                                   </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-slate-400 py-4">{t('plantsView.tasks.none')}</p>
                        )}
                    </Card>
                </div>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in space-y-4">
            {header}
            
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab plant={plant} />}
                {activeTab === 'postharvest' && <PostHarvestTab plant={plant} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'tasks' && <TasksTab tasks={plant.tasks} onCompleteTask={(taskId) => dispatch(completeTask({ plantId: plant.id, taskId }))} />}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
                {activeTab === 'ai' && <AiTab plant={plant} />}
            </div>
        </div>
    );
});
