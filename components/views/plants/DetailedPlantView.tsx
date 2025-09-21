// This file was missing and has been recreated based on its usage across the application.
import React, { useState } from 'react';
import { Plant, JournalEntry, PlantStage } from '../../../types';
import { usePlants } from '../../../hooks/usePlants';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { Button } from '../../common/Button';
import { Tabs } from '../../common/Tabs';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { usePlantAdvisorArchive } from '../../../hooks/usePlantAdvisorArchive';
import { ActionModalsContainer, ModalState, ModalType } from '../../common/ActionModalsContainer';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

type PlantDetailTab = 'overview' | 'journal' | 'photos' | 'tasks' | 'ai';

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const { addJournalEntry, completeTask } = usePlants();
    const [activeTab, setActiveTab] = useState<PlantDetailTab>('overview');
    const { archive, addResponse, updateResponse, deleteResponse } = usePlantAdvisorArchive();
    const [modalState, setModalState] = useState<ModalState | null>(null);

    const plantArchive = archive[plant.id] || [];

    const handleAction = (type: ModalType) => {
        setModalState({ plantId: plant.id, type });
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
            <ActionModalsContainer 
                modalState={modalState} 
                setModalState={setModalState}
                onAddJournalEntry={addJournalEntry}
            />

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
                 <div className="flex-shrink-0 flex gap-2">
                    <Button onClick={() => handleAction('watering')}><PhosphorIcons.Drop className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.watering')}</Button>
                    <Button onClick={() => handleAction('feeding')}><PhosphorIcons.TestTube className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.feeding')}</Button>
                    <Button onClick={() => handleAction('photo')}><PhosphorIcons.Camera className="w-4 h-4 mr-1"/> {t('plantsView.detailedView.journalFilters.photo')}</Button>
                </div>
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