import React, { useState, memo, useEffect } from 'react';
import { Plant, PlantStage, ModalType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { PostHarvestTab } from './detailedPlantViewTabs/PostHarvestTab';
import { useAppDispatch } from '@/stores/store';
import { completeTask, updatePlantToNow } from '@/stores/slices/simulationSlice';
import { openActionModal as openActionModalAction, openDiagnosticsModal } from '@/stores/slices/uiSlice';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = memo(({ plant, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('overview');
    
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
                <Button variant="secondary" onClick={onClose} size="sm">
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
            </div>
            <div className="mt-4 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">{plant.name}</h1>
                <p className="text-slate-400">{plant.strain.name} - {t('plantsView.plantCard.day')} {plant.age}</p>
            </div>
        </header>
    );
    
    return (
        <div className="animate-fade-in space-y-6">
            {header}
            
            <nav className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200 w-24 h-20 ${
                            activeTab === tab.id
                                ? 'bg-primary-600 text-white scale-105 shadow-lg ring-1 ring-primary-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                    >
                        <div className="w-6 h-6">{tab.icon}</div>
                        <span className="text-xs font-semibold text-center">{tab.label}</span>
                    </button>
                ))}
            </nav>
            
            <div>
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