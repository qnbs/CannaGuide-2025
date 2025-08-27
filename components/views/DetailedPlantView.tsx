import React, { useState } from 'react';
import { Plant, JournalEntry, JournalEntryType, Task } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PlantVisual } from './PlantVisual';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { geminiService } from '../../../services/geminiService';
import { AIResponse } from '../../../types';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { PLANT_STAGE_DETAILS } from '../../../constants';
import { HistoryChart } from './HistoryChart';
import { WateringModal, FeedingModal, ObservationModal } from './ActionModals';
import { PlantLifecycleTimeline } from './PlantLifecycleTimeline';

interface DetailedPlantViewProps {
  plant: Plant;
  onClose: () => void;
  onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onCompleteTask: (taskId: string) => void;
}

type ActiveTab = 'overview' | 'journal' | 'tasks' | 'ai';
type ModalType = 'watering' | 'feeding' | 'observation' | null;

const VitalStat: React.FC<{ label: string, value: number, unit: string, idealMin: number, idealMax: number, color: string }> = ({ label, value, unit, idealMin, idealMax, color }) => {
    const isIdeal = value >= idealMin && value <= idealMax;
    const percentage = Math.min(100, Math.max(0, (value / (idealMax * 1.5)) * 100)); // Simple scale
    
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                <span className={`font-mono text-lg ${isIdeal ? 'text-green-500' : 'text-amber-500'}`}>{value.toFixed(2)}<span className="text-sm ml-1">{unit}</span></span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }}></div>
                <div className="relative h-0">
                    <div className="absolute top-[-4px] h-4 w-0.5 bg-slate-400" style={{ left: `${(idealMin / (idealMax * 1.5)) * 100}%` }} title={`Min: ${idealMin}`}></div>
                    <div className="absolute top-[-4px] h-4 w-0.5 bg-slate-400" style={{ left: `${(idealMax / (idealMax * 1.5)) * 100}%` }} title={`Max: ${idealMax}`}></div>
                </div>
            </div>
        </div>
    );
};

const OverviewTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t } = useTranslations();
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
                <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
            </Card>
            <Card className="md:col-span-2">
                 <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">{t('detailedPlant.vitals')}</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <VitalStat label={t('detailedPlant.ph')} value={plant.vitals.ph} unit="" idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} color="bg-green-500" />
                    <VitalStat label={t('detailedPlant.ec')} value={plant.vitals.ec} unit="mS/cm" idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} color="bg-amber-500" />
                    <VitalStat label={t('detailedPlant.substrateMoisture')} value={plant.vitals.substrateMoisture} unit="%" idealMin={40} idealMax={80} color="bg-blue-500" />
                    <VitalStat label={t('detailedPlant.stressLevel')} value={plant.stressLevel} unit="%" idealMin={0} idealMax={20} color="bg-red-500" />
                 </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">{t('detailedPlant.environment')}</h3>
                <div className="space-y-2 text-slate-700 dark:text-slate-200">
                     <p><strong>{t('detailedPlant.temperature')}:</strong> {plant.environment.temperature}°C</p>
                     <p><strong>{t('detailedPlant.humidity')}:</strong> {plant.environment.humidity}%</p>
                     <p><strong>{t('detailedPlant.lightIntensity')}:</strong> {plant.environment.light}%</p>
                     <p><strong>{t('detailedPlant.height')}:</strong> {plant.height.toFixed(1)} cm</p>
                </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">{t('detailedPlant.history')}</h3>
                <div className="h-48">
                  <HistoryChart history={plant.history} />
                </div>
            </Card>
        </div>
    )
}

const JournalTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t } = useTranslations();
    
    const iconMap: Record<JournalEntryType, React.ReactNode> = {
        WATERING: <PhosphorIcons.Drop className="text-blue-500" />,
        FEEDING: <PhosphorIcons.TestTube className="text-amber-500" />,
        TRAINING: <PhosphorIcons.Scissors className="text-purple-500" />,
        OBSERVATION: <PhosphorIcons.MagnifyingGlass className="text-slate-500" />,
        SYSTEM: <PhosphorIcons.Gear className="text-slate-400" />,
        PHOTO: <PhosphorIcons.Camera className="text-pink-500" />,
    };

    const formatDetails = (entry: JournalEntry) => {
        if (!entry.details) return null;
        const parts = [];
        if (entry.details.waterAmount) parts.push(`${entry.details.waterAmount}ml`);
        if (entry.details.ph) parts.push(`pH ${entry.details.ph.toFixed(1)}`);
        if (entry.details.ec) parts.push(`EC ${entry.details.ec.toFixed(1)}`);
        if(parts.length === 0) return null;
        return <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({parts.join(', ')})</span>
    }

    return (
        <div className="space-y-3">
            {[...plant.journal].reverse().map(entry => (
                <Card key={entry.id} className="flex items-start gap-4">
                    <div className="w-6 h-6 flex-shrink-0 mt-1">{iconMap[entry.type]}</div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                           <h4 className="font-bold text-slate-800 dark:text-slate-200">{t(`journal.type.${entry.type}`)}</h4>
                           <time className="text-xs text-slate-400 dark:text-slate-500">{new Date(entry.timestamp).toLocaleString()}</time>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{entry.notes} {formatDetails(entry)}</p>
                    </div>
                </Card>
            ))}
        </div>
    )
}

const TasksTab: React.FC<{ plant: Plant, onCompleteTask: (taskId: string) => void }> = ({ plant, onCompleteTask }) => {
    const { t } = useTranslations();
    const priorityClasses = {
        high: 'border-red-500/50 bg-red-500/10',
        medium: 'border-amber-500/50 bg-amber-500/10',
        low: 'border-blue-500/50 bg-blue-500/10',
    };
    return (
         <div className="space-y-3">
            {plant.tasks.length === 0 && <p className="text-slate-500 text-center p-4">{t('tasks.noTasksYet')}</p>}
            {[...plant.tasks].reverse().map(task => (
                <Card key={task.id} className={`border-l-4 ${task.isCompleted ? 'opacity-50 border-slate-300' : priorityClasses[task.priority]}`}>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className={`font-bold text-slate-800 dark:text-slate-200 ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                        </div>
                        {!task.isCompleted && <Button onClick={() => onCompleteTask(task.id)} size="sm">{t('tasks.complete')}</Button>}
                    </div>
                </Card>
            ))}
         </div>
    )
}

const AiAdvisorTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t } = useTranslations();
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setResponse(null);
        const res = await geminiService.askAboutPlant(plant, query);
        setResponse(res);
        setIsLoading(false);
    };

    return (
        <Card>
            <p className="mb-4">{t('aiAdvisor.description')}</p>
             <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder={t('aiAdvisor.placeholder')}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white"
                />
                <Button onClick={handleAsk} disabled={isLoading || !query.trim()}>{t('aiAdvisor.button')}</Button>
            </div>
            {isLoading && <SkeletonLoader count={3} />}
            {response && (
                 <article className="prose dark:prose-invert max-w-none bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg">
                    <h3 className="!text-primary-600 dark:!text-primary-300">{response.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: response.content }} />
                </article>
            )}
        </Card>
    )
}

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose, onAddJournalEntry, onCompleteTask }) => {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [modal, setModal] = useState<ModalType>(null);

    const tabs: {id: ActiveTab, label: string, icon: React.ReactNode}[] = [
        { id: 'overview', label: t('detailedPlant.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'journal', label: t('detailedPlant.tabs.journal'), icon: <PhosphorIcons.Book /> },
        { id: 'tasks', label: t('detailedPlant.tabs.tasks'), icon: <PhosphorIcons.Checks /> },
        { id: 'ai', label: t('detailedPlant.tabs.ai'), icon: <PhosphorIcons.Sparkle /> },
    ];
    
    const handleActionConfirm = (type: JournalEntryType) => (details: JournalEntry['details'], notes: string) => {
        onAddJournalEntry({ type, notes, details });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                     <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500 mb-2">
                        <PhosphorIcons.ArrowLeft /> {t('common.backToDashboard')}
                    </button>
                    <h2 className="text-3xl font-bold text-primary-500 dark:text-primary-300">{plant.name}</h2>
                    <p className="text-slate-500">{plant.strain.name} - {t('plantSlot.day')} {plant.age}</p>
                </div>
                 <div className="w-48 h-48 -mt-8">
                    <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture} />
                </div>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 flex items-center gap-2 px-1 pb-4 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-grow pb-24">
                {activeTab === 'overview' && <OverviewTab plant={plant} />}
                {activeTab === 'journal' && <JournalTab plant={plant} />}
                {activeTab === 'tasks' && <TasksTab plant={plant} onCompleteTask={onCompleteTask} />}
                {activeTab === 'ai' && <AiAdvisorTab plant={plant} />}
            </div>
            
            <div className="action-bar">
                <div className="flex justify-around items-center gap-2">
                    <Button variant="primary" onClick={() => setModal('watering')} className="flex-1 flex flex-col items-center h-16 justify-center">
                        <PhosphorIcons.Drop className="w-6 h-6 mb-1"/>
                        <span className="text-xs">{t('detailedPlant.actions.water')}</span>
                    </Button>
                    <Button variant="primary" onClick={() => setModal('feeding')} className="flex-1 flex flex-col items-center h-16 justify-center">
                         <PhosphorIcons.TestTube className="w-6 h-6 mb-1"/>
                        <span className="text-xs">{t('detailedPlant.actions.feed')}</span>
                    </Button>
                    <Button variant="secondary" onClick={() => setModal('observation')} className="flex-1 flex flex-col items-center h-16 justify-center">
                         <PhosphorIcons.MagnifyingGlass className="w-6 h-6 mb-1"/>
                        <span className="text-xs">{t('detailedPlant.actions.observe')}</span>
                    </Button>
                </div>
            </div>

            {modal === 'watering' && <WateringModal onClose={() => setModal(null)} onConfirm={handleActionConfirm('WATERING')} />}
            {modal === 'feeding' && <FeedingModal onClose={() => setModal(null)} onConfirm={handleActionConfirm('FEEDING')} />}
            {modal === 'observation' && <ObservationModal onClose={() => setModal(null)} onConfirm={handleActionConfirm('OBSERVATION')} />}

        </div>
    );
};