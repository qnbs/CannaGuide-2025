import React, { useState } from 'react';
import { Plant, JournalEntry, JournalEntryType, Task } from '../../../types';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { WateringModal, FeedingModal, ObservationModal, TrainingModal, PhotoModal } from './ActionModals';
import { useTranslations } from '../../../hooks/useTranslations';
import { OverviewTab } from './detailedPlantViewTabs/OverviewTab';
import { JournalTab } from './detailedPlantViewTabs/JournalTab';
import { TasksTab } from './detailedPlantViewTabs/TasksTab';
import { PhotosTab } from './detailedPlantViewTabs/PhotosTab';
import { AiTab } from './detailedPlantViewTabs/AiTab';

interface DetailedPlantViewProps {
  plant: Plant;
  onClose: () => void;
  onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onCompleteTask: (taskId: string) => void;
}

type ActiveTab = 'overview' | 'journal' | 'tasks' | 'photos' | 'ai';
type ActionType = 'watering' | 'feeding' | 'observation' | 'training' | 'photo' | null;

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose, onAddJournalEntry, onCompleteTask }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [action, setAction] = useState<ActionType>(null);
    
    const handleConfirmAction = (details: JournalEntry['details'], notes: string) => {
        if (!action) return;
        const typeMap: Record<string, JournalEntryType> = {
            watering: 'WATERING', feeding: 'FEEDING', training: 'TRAINING', photo: 'PHOTO', observation: 'OBSERVATION',
        };
        onAddJournalEntry({ type: typeMap[action], details, notes });
        setAction(null);
    };

    const tabs: {id: ActiveTab, label: string}[] = [
        { id: 'overview', label: t('plantsView.detailedView.tabs.overview') },
        { id: 'journal', label: t('plantsView.detailedView.tabs.journal') },
        { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks') },
        { id: 'photos', label: t('plantsView.detailedView.tabs.photos') },
        { id: 'ai', label: t('plantsView.detailedView.tabs.ai') },
    ];

    const renderTabContent = () => {
        switch(activeTab) {
            case 'overview': return <OverviewTab plant={plant} />;
            case 'journal': return <JournalTab journal={plant.journal} />;
            case 'tasks': return <TasksTab tasks={plant.tasks} onCompleteTask={onCompleteTask} />;
            case 'photos': return <PhotosTab journal={plant.journal} />;
            case 'ai': return <AiTab plant={plant} />;
            default: return null;
        }
    }

    return (
        <div className="animate-fade-in relative pb-20">
            <header className="flex items-center justify-between mb-4">
                <button onClick={onClose} className="flex items-center text-slate-300 hover:text-primary-400">
                    <PhosphorIcons.ArrowLeft className="w-6 h-6 mr-2" />
                    {t('plantsView.detailedView.back')}
                </button>
                <div className="text-right">
                    <h1 className="text-3xl font-bold font-display text-primary-400">{plant.name}</h1>
                    <p className="text-slate-300">{plant.strain.name} - {t('plantsView.plantCard.day')} {plant.age}</p>
                </div>
            </header>
            
            <div className="border-b border-slate-700 mb-6">
              <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 px-1 pb-4 text-sm md:text-base font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {renderTabContent()}
            
             <div className="action-bar grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button onClick={() => setAction('watering')}><PhosphorIcons.Drop className="inline w-4 h-4 mr-1"/>{t('plantsView.detailedView.actions.water')}</Button>
                <Button onClick={() => setAction('feeding')}><PhosphorIcons.TestTube className="inline w-4 h-4 mr-1"/>{t('plantsView.detailedView.actions.feed')}</Button>
                <Button onClick={() => setAction('training')}><PhosphorIcons.Scissors className="inline w-4 h-4 mr-1"/>{t('plantsView.detailedView.actions.train')}</Button>
                <Button onClick={() => setAction('photo')}><PhosphorIcons.Camera className="inline w-4 h-4 mr-1"/>{t('plantsView.detailedView.actions.photo')}</Button>
                <Button onClick={() => setAction('observation')}><PhosphorIcons.MagnifyingGlass className="inline w-4 h-4 mr-1"/>{t('plantsView.detailedView.actions.observe')}</Button>
            </div>


            {action === 'watering' && <WateringModal onClose={() => setAction(null)} onConfirm={handleConfirmAction} />}
            {action === 'feeding' && <FeedingModal onClose={() => setAction(null)} onConfirm={handleConfirmAction} />}
            {action === 'observation' && <ObservationModal onClose={() => setAction(null)} onConfirm={handleConfirmAction} />}
            {action === 'training' && <TrainingModal onClose={() => setAction(null)} onConfirm={handleConfirmAction} />}
            {action === 'photo' && <PhotoModal onClose={() => setAction(null)} onConfirm={handleConfirmAction} />}
        </div>
    );
};