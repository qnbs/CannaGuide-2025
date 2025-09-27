import React, { useState } from 'react';
import { Plant, PlantStage } from '../../../types';
import { useTranslations } from '../../../hooks/useTranslations';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { Tabs } from '../../common/Tabs';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { useAppStore } from '../../../stores/useAppStore';
import { selectArchivedAdvisorResponsesForPlant } from '../../../stores/selectors';
import { PostHarvestTab } from './detailedPlantViewTabs/PostHarvestTab';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState('overview');
    
    const { 
        archive, 
        addArchivedAdvisorResponse, 
        updateArchivedAdvisorResponse, 
        deleteArchivedAdvisorResponse,
        completeTask 
    } = useAppStore(state => ({
        archive: selectArchivedAdvisorResponsesForPlant(plant.id)(state),
        addArchivedAdvisorResponse: state.addArchivedAdvisorResponse,
        updateArchivedAdvisorResponse: state.updateArchivedAdvisorResponse,
        deleteArchivedAdvisorResponse: state.deleteArchivedAdvisorResponse,
        completeTask: state.completeTask,
    }));

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    const tabs = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        ...(isPostHarvest ? [{ id: 'postharvest', label: t('plantsView.detailedView.tabs.postHarvest'), icon: <PhosphorIcons.ArchiveBox /> }] : []),
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.ListChecks /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
        { id: 'ai', label: t('plantsView.detailedView.tabs.ai'), icon: <PhosphorIcons.Sparkle /> },
    ];
    
    const handleCompleteTask = (taskId: string) => {
        completeTask(plant.id, taskId);
    };

    return (
        <div className="animate-fade-in space-y-4">
            <header>
                <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={onClose}>
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                </div>
                <div className="mt-4">
                    <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">{plant.name}</h1>
                    <p className="text-slate-400">{plant.strain.name} - {t('plantsView.plantCard.day')} {plant.age}</p>
                </div>
            </header>
            
            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab plant={plant} />}
                {activeTab === 'postharvest' && <PostHarvestTab plant={plant} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'tasks' && <TasksTab tasks={plant.tasks} onCompleteTask={handleCompleteTask} />}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
                {activeTab === 'ai' && (
                    <AiTab
                        plant={plant}
                        archive={archive}
                        addResponse={addArchivedAdvisorResponse}
                        updateResponse={updateArchivedAdvisorResponse}
                        deleteResponse={deleteArchivedAdvisorResponse}
                    />
                )}
            </div>
        </div>
    );
};
