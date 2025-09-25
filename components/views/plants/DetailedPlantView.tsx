import React, { useState } from 'react';
import { Plant, AIResponse, ArchivedAdvisorResponse, PlantStage } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Tabs } from '@/components/common/Tabs';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { PostHarvestTab } from './detailedPlantViewTabs/PostHarvestTab';
import { LogActionModal, ModalState } from './LogActionModal';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const { 
        addJournalEntry, 
        completeTask, 
        archivedAdvisorResponses, 
        addArchivedAdvisorResponse,
        updateArchivedAdvisorResponse,
        deleteArchivedAdvisorResponse,
        topPlant,
        applyLst,
        applyPestControl
    } = useAppStore(state => ({
        addJournalEntry: state.addJournalEntry,
        completeTask: (taskId: string) => state.completeTask(plant.id, taskId),
        archivedAdvisorResponses: state.archivedAdvisorResponses[plant.id] || [],
        addArchivedAdvisorResponse: state.addArchivedAdvisorResponse,
        updateArchivedAdvisorResponse: state.updateArchivedAdvisorResponse,
        deleteArchivedAdvisorResponse: state.deleteArchivedAdvisorResponse,
        topPlant: state.topPlant,
        applyLst: state.applyLst,
        applyPestControl: state.applyPestControl,
    }));
    
    const [activeTab, setActiveTab] = useState('overview');
    const [modalState, setModalState] = useState<ModalState | null>(null);

    const isPostHarvest = [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage);

    const tabs = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.ListChecks /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
        { id: 'ai', label: t('plantsView.detailedView.tabs.ai'), icon: <PhosphorIcons.Brain /> },
    ];
    
    if (isPostHarvest) {
        tabs.push({ id: 'postHarvest', label: t('plantsView.detailedView.tabs.postHarvest'), icon: <PhosphorIcons.Archive /> });
    }
    
    const handleAddResponse = (plantId: string, response: AIResponse, query: string) => {
        addArchivedAdvisorResponse(plantId, response, query);
    };

    const handleDeleteResponse = (plantId: string, responseId: string) => {
        if(window.confirm(t('common.deleteResponse') + '?')) {
            deleteArchivedAdvisorResponse(plantId, responseId);
        }
    };
    
    return (
        <div className="animate-fade-in space-y-4">
            {modalState && (
                <LogActionModal 
                    plant={plant}
                    modalState={modalState}
                    setModalState={setModalState}
                    onAddJournalEntry={addJournalEntry}
                    onTopPlant={topPlant}
                    onApplyLST={applyLst}
                    onApplyPestControl={applyPestControl}
                />
            )}
            <header>
                <Button variant="secondary" onClick={onClose} className="mb-4">
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">{plant.name}</h1>
                    <p className="text-slate-400">{plant.strain.name} - {t('plantsView.plantCard.day')} {plant.age}</p>
                </div>
            </header>

            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab plant={plant} onLogAction={(type) => setModalState({ type, plantId: plant.id })} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'tasks' && <TasksTab tasks={plant.tasks} onCompleteTask={completeTask} />}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
                {activeTab === 'ai' && <AiTab plant={plant} archive={archivedAdvisorResponses} addResponse={handleAddResponse} updateResponse={updateArchivedAdvisorResponse} deleteResponse={handleDeleteResponse} />}
                {activeTab === 'postHarvest' && <PostHarvestTab plant={plant} />}
            </div>
        </div>
    );
};