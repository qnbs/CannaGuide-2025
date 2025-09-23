import React, { useState } from 'react';
import { Plant } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { OverviewTab } from '@/components/views/plants/detailedPlantViewTabs/OverviewTab';
import { JournalTab } from '@/components/views/plants/detailedPlantViewTabs/JournalTab';
import { PhotosTab } from '@/components/views/plants/detailedPlantViewTabs/PhotosTab';
import { TasksTab } from '@/components/views/plants/detailedPlantViewTabs/TasksTab';
import { AiTab } from '@/components/views/plants/detailedPlantViewTabs/AiTab';
import { LogActionModal, ModalState, ModalType } from '@/components/views/plants/LogActionModal';
import { ActionToolbar } from './ActionToolbar';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

type PlantDetailTab = 'overview' | 'journal' | 'photos' | 'tasks' | 'ai';

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const { 
        addJournalEntry, 
        completeTask,
        archive,
        addResponse,
        updateResponse,
        deleteResponse
    } = useAppStore(state => ({
        addJournalEntry: state.addJournalEntry,
        completeTask: state.completeTask,
        archive: state.archivedAdvisorResponses,
        addResponse: state.addArchivedAdvisorResponse,
        updateResponse: state.updateArchivedAdvisorResponse,
        deleteResponse: state.deleteArchivedAdvisorResponse,
    }));
    const [activeTab, setActiveTab] = useState<PlantDetailTab>('overview');
    const [modalState, setModalState] = useState<ModalState | null>(null);

    const plantArchive = archive[plant.id] || [];

    const handleAction = (type: NonNullable<ModalType>) => {
        setModalState({ type, plantId: plant.id });
    };

    const tabs: { id: PlantDetailTab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.ListChecks /> },
        { id: 'ai', label: t('ai.advisor'), icon: <PhosphorIcons.Brain /> },
    ];
    
    return (
        <div className="animate-fade-in">
            {modalState && (
                <LogActionModal 
                    plant={plant}
                    modalState={modalState} 
                    setModalState={setModalState}
                    onAddJournalEntry={addJournalEntry}
                />
            )}

            <div className="flex items-center justify-between mb-4">
                <Button variant="secondary" onClick={onClose}>
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                <div>
                    <h2 className="text-3xl font-bold font-display text-primary-400 text-right">{plant.name}</h2>
                    <p className="text-slate-400 text-sm text-right">{plant.strain.name}</p>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                 <div className="flex-grow">
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as PlantDetailTab)} />
                </div>
                <ActionToolbar onAction={handleAction} />
            </div>

            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab plant={plant} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
                {activeTab === 'tasks' && <TasksTab tasks={plant.tasks} onCompleteTask={(taskId) => completeTask(plant.id, taskId)} />}
                {activeTab === 'ai' && <AiTab plant={plant} archive={plantArchive} addResponse={addResponse} updateResponse={updateResponse} deleteResponse={deleteResponse}/>}
            </div>
        </div>
    );
};