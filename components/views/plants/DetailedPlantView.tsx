// FIX: Implemented the DetailedPlantView component to resolve module not found errors.
import React, { useState } from 'react';
import { Plant, JournalEntry, ArchivedAdvisorResponse, AIResponse } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';
import { ActionToolbar } from './ActionToolbar';

interface DetailedPlantViewProps {
    plant: Plant;
    onClose: () => void;
    onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    onCompleteTask: (taskId: string) => void;
    advisorArchive: ArchivedAdvisorResponse[];
    addAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteAdvisorResponse: (plantId: string, responseId: string) => void;
}

type PlantViewTab = 'overview' | 'journal' | 'tasks' | 'photos' | 'ai';

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({
    plant,
    onClose,
    onAddJournalEntry,
    onCompleteTask,
    advisorArchive,
    addAdvisorResponse,
    updateAdvisorResponse,
    deleteAdvisorResponse,
}) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<PlantViewTab>('overview');
    
    const tabs: { id: PlantViewTab, label: string, icon: React.ReactNode }[] = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText /> },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.Checks /> },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera /> },
        { id: 'ai', label: t('ai.advisor'), icon: <PhosphorIcons.Brain /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab plant={plant} />;
            case 'journal': return <JournalTab journal={plant.journal} />;
            case 'tasks': return <TasksTab tasks={plant.tasks} onCompleteTask={onCompleteTask} />;
            case 'photos': return <PhotosTab journal={plant.journal} />;
            // FIX: Corrected prop name from 'deleteResponse' to 'deleteAdvisorResponse' to match props.
            case 'ai': return <AiTab plant={plant} archive={advisorArchive} addResponse={addAdvisorResponse} updateResponse={updateAdvisorResponse} deleteResponse={deleteAdvisorResponse} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4 flex items-center gap-4">
                <Button variant="secondary" size="sm" onClick={onClose} className="!p-2">
                    <PhosphorIcons.ArrowLeft className="w-5 h-5" />
                    <span className="sr-only">{t('common.back')}</span>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold font-display text-primary-400">{plant.name}</h2>
                    <p className="text-slate-400 text-sm">{plant.strain.name} - {t('plantStages.' + plant.stage)}</p>
                </div>
            </div>
            
            <div className="flex-shrink-0 mb-4">
                 <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 overflow-x-auto">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'bg-slate-700 text-primary-300 shadow-sm' 
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <div className="w-5 h-5">{tab.icon}</div>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto pr-2">
                {renderTabContent()}
            </div>
            
            {/* FIX: Integrated ActionToolbar to provide quick access to logging functions. */}
            <ActionToolbar onAddJournalEntry={onAddJournalEntry} />
        </div>
    );
};