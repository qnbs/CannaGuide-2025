import React, { useState } from 'react';
import { Plant, Scenario } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Tabs } from '@/components/common/Tabs';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { LogActionModal, ModalType } from './LogActionModal';
import { selectArchivedAdvisorResponsesForPlant } from '@/stores/selectors';
import { DeepDiveModal } from './deepDive/DeepDiveModal';
import { ComparisonView } from './ComparisonView';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState('overview');
    const [modalType, setModalType] = useState<ModalType | null>(null);
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
    const [deepDiveTopic, setDeepDiveTopic] = useState<string | null>(null);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [scenarioToRun, setScenarioToRun] = useState<Scenario | null>(null);
    
    const {
        addArchivedAdvisorResponse,
        updateArchivedAdvisorResponse,
        deleteArchivedAdvisorResponse,
        completeTask,
    } = useAppStore(state => ({
        addArchivedAdvisorResponse: state.addArchivedAdvisorResponse,
        updateArchivedAdvisorResponse: state.updateArchivedAdvisorResponse,
        deleteArchivedAdvisorResponse: state.deleteArchivedAdvisorResponse,
        completeTask: state.completeTask,
    }));
    
    const archivedResponses = useAppStore(state => selectArchivedAdvisorResponsesForPlant(plant.id)(state));

    const tabs = [
        { id: 'overview', label: t('strainsView.strainDetail.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'ai', label: t('plantsView.detailedView.tabs.ai'), icon: <PhosphorIcons.Brain /> },
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.Checks /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
    ];
    
    const handleLogAction = (type: NonNullable<ModalType>) => {
        setModalType(type);
    };

    const handleLearnMore = (topic: string) => {
        setDeepDiveTopic(topic);
        setIsDeepDiveOpen(true);
    };

    const handleRunScenario = (scenario: Scenario) => {
        setScenarioToRun(scenario);
        setIsDeepDiveOpen(false); // Close deep dive when starting scenario
        setIsComparisonModalOpen(true);
    };

    return (
        <div className="space-y-4 animate-fade-in">
             {modalType && <LogActionModal plant={plant} type={modalType} onClose={() => setModalType(null)} onLearnMore={handleLearnMore} />}
             {isDeepDiveOpen && deepDiveTopic && <DeepDiveModal plant={plant} topic={deepDiveTopic} onClose={() => setIsDeepDiveOpen(false)} onRunScenario={handleRunScenario} />}
             {isComparisonModalOpen && scenarioToRun && <ComparisonView plant={plant} scenario={scenarioToRun} onClose={() => setIsComparisonModalOpen(false)} />}
            
            <header className="flex items-center justify-between">
                <Button variant="secondary" onClick={onClose}>
                    <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                    {t('common.back')}
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-display text-primary-300 text-right">{plant.name}</h1>
                    <p className="text-slate-400 text-right">{plant.strain.name}</p>
                </div>
            </header>

            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <div className="mt-4">
                {activeTab === 'overview' && <OverviewTab plant={plant} onLogAction={handleLogAction} />}
                {activeTab === 'ai' && <AiTab plant={plant} archive={archivedResponses} addResponse={addArchivedAdvisorResponse} updateResponse={updateArchivedAdvisorResponse} deleteResponse={deleteArchivedAdvisorResponse} />}
                {activeTab === 'journal' && <JournalTab journal={plant.journal} />}
                {activeTab === 'tasks' && <TasksTab tasks={plant.tasks} onCompleteTask={(taskId) => completeTask(plant.id, taskId)} />}
                {activeTab === 'photos' && <PhotosTab journal={plant.journal} />}
            </div>
        </div>
    );
};
