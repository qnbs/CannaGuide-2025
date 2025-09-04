import React, { useState, useMemo } from 'react';
import { Plant, JournalEntry, JournalEntryType, Task, TrainingType } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PlantVisual } from './PlantVisual';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { geminiService } from '../../../services/geminiService';
import { AIResponse } from '../../../types';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { PLANT_STAGE_DETAILS } from '../../../constants';
import { HistoryChart } from './HistoryChart';
import { WateringModal, FeedingModal, ObservationModal, TrainingModal, PhotoModal } from './ActionModals';
import { PlantLifecycleTimeline } from './PlantLifecycleTimeline';
import { useTranslations } from '../../../hooks/useTranslations';

interface DetailedPlantViewProps {
  plant: Plant;
  onClose: () => void;
  onAddJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  onCompleteTask: (taskId: string) => void;
}

type ActiveTab = 'overview' | 'journal' | 'tasks' | 'photos' | 'ai';
type ActionType = 'watering' | 'feeding' | 'observation' | 'training' | 'photo' | null;

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

const ProactiveAITipCard: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t, locale } = useTranslations();
    const [aiTip, setAiTip] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTip = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tip = await geminiService.getProactiveTip(plant, t('plantsView.detailedView.aiTip'), t('common.aiResponseError'), locale);
            setAiTip(tip);
        } catch (e) {
            setError(t('plantsView.detailedView.aiTipError'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [plant, t, locale]);

    React.useEffect(() => {
        fetchTip();
    }, [fetchTip]);
    
    return (
        <Card className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
                    <PhosphorIcons.MagicWand className="w-6 h-6" />
                    {t('plantsView.detailedView.aiTip')}
                 </h3>
                 <Button variant="secondary" size="sm" onClick={fetchTip} disabled={isLoading} className="!p-2" aria-label={t('common.next')}>
                    <PhosphorIcons.ArrowClockwise className="w-4 h-4"/>
                </Button>
            </div>
             <div className="prose prose-sm dark:prose-invert max-w-none">
                {isLoading ? <SkeletonLoader count={2} /> :
                 error ? <p className="text-red-500">{error}</p> :
                 aiTip?.title === 'Error' ? <p>{t('common.aiResponseError')}</p> :
                 <p>{aiTip?.content}</p>
                }
            </div>
        </Card>
    );
};

const AIAdvisorCard: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t, locale } = useTranslations();
    const [query, setQuery] = useState('');
    const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAskAI = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setAiResponse(null);
        const titleTemplate = t('plantsView.detailedView.aiAdvisor.titleTemplate', { name: plant.name });
        const res = await geminiService.askAboutPlant(plant, query, titleTemplate, locale);
        setAiResponse(res);
        setIsLoading(false);
    };

    return (
        <Card>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('plantsView.detailedView.aiAdvisor.prompt')}</p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAskAI()}
                    placeholder={t('plantsView.detailedView.aiAdvisor.placeholder')}
                    className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm"
                />
                <Button onClick={handleAskAI} disabled={isLoading || !query.trim()}>{t('plantsView.detailedView.aiAdvisor.button')}</Button>
            </div>
            <div className="mt-4">
                {isLoading && <SkeletonLoader count={4} />}
                {aiResponse && (
                     <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg animate-fade-in">
                        <article className="prose dark:prose-invert max-w-none">
                             <h4 className="!text-primary-600 dark:!text-primary-300 !mt-0">{aiResponse.title === 'Error' ? t('common.error') : aiResponse.title}</h4>
                             <div dangerouslySetInnerHTML={{ __html: aiResponse.content === 'The AI could not generate a response. Please try again later or rephrase your request.' ? t('common.aiResponseError') : aiResponse.content }} />
                        </article>
                     </div>
                )}
            </div>
        </Card>
    )
}


export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose, onAddJournalEntry, onCompleteTask }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [journalFilter, setJournalFilter] = useState<JournalEntryType | 'ALL'>('ALL');
  const [actionModal, setActionModal] = useState<ActionType>(null);
  const { t } = useTranslations();
  
  const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;
  const idealEnv = PLANT_STAGE_DETAILS[plant.stage].idealEnv;

  const sortedJournal = useMemo(() => [...plant.journal].sort((a, b) => b.timestamp - a.timestamp), [plant.journal]);
  const filteredJournal = useMemo(() => journalFilter === 'ALL' ? sortedJournal : sortedJournal.filter(entry => entry.type === journalFilter), [sortedJournal, journalFilter]);
  const sortedTasks = useMemo(() => [...plant.tasks].sort((a, b) => (a.isCompleted ? 1 : -1) || b.createdAt - a.createdAt), [plant.tasks]);

  const journalIcons: Record<JournalEntryType, React.ReactNode> = {
    WATERING: <PhosphorIcons.Drop />,
    FEEDING: <PhosphorIcons.TestTube />,
    TRAINING: <PhosphorIcons.Scissors />,
    OBSERVATION: <PhosphorIcons.MagnifyingGlass />,
    SYSTEM: <PhosphorIcons.Gear />,
    PHOTO: <PhosphorIcons.Camera />,
  };
  const journalFilterOptions: (JournalEntryType | 'ALL')[] = ['ALL', 'WATERING', 'FEEDING', 'TRAINING', 'OBSERVATION', 'PHOTO', 'SYSTEM'];
  const journalFilterLabels: Record<JournalEntryType | 'ALL', string> = {
    ALL: t('common.all'),
    WATERING: t('plantsView.detailedView.journalFilters.watering'),
    FEEDING: t('plantsView.detailedView.journalFilters.feeding'),
    TRAINING: t('plantsView.detailedView.journalFilters.training'),
    OBSERVATION: t('plantsView.detailedView.journalFilters.observation'),
    SYSTEM: t('plantsView.detailedView.journalFilters.system'),
    PHOTO: t('plantsView.detailedView.journalFilters.photo'),
  };

  const tabs = [
    { id: 'overview', label: t('plantsView.detailedView.tabs.overview'), icon: <PhosphorIcons.ChartPieSlice/> },
    { id: 'journal', label: t('plantsView.detailedView.tabs.journal'), icon: <PhosphorIcons.BookOpenText/> },
    { id: 'tasks', label: t('plantsView.detailedView.tabs.tasks'), icon: <PhosphorIcons.ListChecks/> },
    { id: 'photos', label: t('plantsView.detailedView.tabs.photos'), icon: <PhosphorIcons.Camera/> },
    { id: 'ai', label: t('plantsView.detailedView.tabs.ai'), icon: <PhosphorIcons.Sparkle/> },
  ];
  
  const handleAddJournalAndClose = (details: JournalEntry['details'], notes: string) => {
    if (actionModal) {
      const typeMap: Record<string, JournalEntryType> = {
        watering: 'WATERING',
        feeding: 'FEEDING',
        training: 'TRAINING',
        photo: 'PHOTO',
        observation: 'OBSERVATION',
      };
      const entryType = typeMap[actionModal];
      if(entryType) {
        onAddJournalEntry({ type: entryType, details, notes });
      }
    }
    setActionModal(null);
  };

  const actionButtons: {type: ActionType, label: string, icon: React.ReactNode}[] = [
    { type: 'watering', label: t('plantsView.detailedView.actions.water'), icon: <PhosphorIcons.Drop /> },
    { type: 'feeding', label: t('plantsView.detailedView.actions.feed'), icon: <PhosphorIcons.TestTube /> },
    { type: 'training', label: t('plantsView.detailedView.actions.train'), icon: <PhosphorIcons.Scissors /> },
    { type: 'photo', label: t('plantsView.detailedView.actions.photo'), icon: <PhosphorIcons.Camera /> },
    { type: 'observation', label: t('plantsView.detailedView.actions.observe'), icon: <PhosphorIcons.MagnifyingGlass /> },
  ];

  const photoJournal = useMemo(() => sortedJournal.filter(j => j.type === 'PHOTO' && j.details?.imageUrl), [sortedJournal]);

  return (
    <>
      <div className="pb-24">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-semibold mb-4">
          <PhosphorIcons.ArrowLeft className="w-4 h-4" />
          {t('plantsView.detailedView.back')}
        </button>

        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">{plant.name}</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{plant.strain.name} - {t(`plantStages.${plant.stage}`)}, {t('plantsView.plantCard.day')} {plant.age}</p>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as ActiveTab)} className={`shrink-0 flex items-center gap-2 px-1 pb-4 text-sm md:text-base font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                        <div className="w-5 h-5">{tab.icon}</div> {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture} trainingHistory={plant.journal.filter(e => e.type === 'TRAINING')} />
                    </Card>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-xl font-bold mb-4">{t('plantsView.detailedView.vitals')}</h3>
                        <div className="space-y-4">
                             <VitalStat label={t('plantsView.detailedView.ph')} value={plant.vitals.ph} unit="" idealMin={idealVitals.ph.min} idealMax={idealVitals.ph.max} color="bg-green-500" />
                             <VitalStat label={t('plantsView.detailedView.ec')} value={plant.vitals.ec} unit="mS/cm" idealMin={idealVitals.ec.min} idealMax={idealVitals.ec.max} color="bg-amber-500" />
                             <VitalStat label={t('plantsView.detailedView.moisture')} value={plant.vitals.substrateMoisture} unit="%" idealMin={30} idealMax={80} color="bg-blue-500" />
                             <VitalStat label={t('plantsView.detailedView.stress')} value={plant.stressLevel} unit="%" idealMin={0} idealMax={20} color="bg-red-500" />
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-xl font-bold mb-4">{t('plantsView.detailedView.environment')}</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-2xl font-bold">{plant.environment.temperature.toFixed(1)}°C</p><p className="text-xs text-slate-500">{t('plantsView.detailedView.temperature')}</p></div>
                            <div><p className="text-2xl font-bold">{plant.environment.humidity.toFixed(0)}%</p><p className="text-xs text-slate-500">{t('plantsView.detailedView.humidity')}</p></div>
                            <div><p className="text-2xl font-bold">{plant.height.toFixed(1)} cm</p><p className="text-xs text-slate-500">{t('plantsView.detailedView.height')}</p></div>
                        </div>
                    </Card>
                </div>
                 <ProactiveAITipCard plant={plant} />
                 <Card className="h-64">
                    <h3 className="text-xl font-bold mb-2">{t('plantsView.detailedView.history')}</h3>
                    <HistoryChart history={plant.history} />
                 </Card>
                 <div className="md:col-span-3">
                    <Card>
                         <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
                    </Card>
                 </div>
            </div>
          )}

          {activeTab === 'journal' && (
            <Card>
                 <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
                    {journalFilterOptions.map(opt => (
                        <button key={opt} onClick={() => setJournalFilter(opt)} className={`px-3 py-1 text-sm rounded-full transition-colors ${journalFilter === opt ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700'}`}>{journalFilterLabels[opt]}</button>
                    ))}
                 </div>
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {filteredJournal.length > 0 ? filteredJournal.map(entry => (
                        <div key={entry.id} className="flex items-start gap-4">
                            <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-primary-500">{journalIcons[entry.type]}</div>
                            <div className="flex-grow">
                                <p className="font-bold">{entry.notes}</p>
                                {entry.details && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {Object.entries(entry.details).map(([key, val]) => val ? `${key}: ${val} ` : '').join(' ')}
                                    </p>
                                )}
                                <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    )) : <p className="text-slate-500 text-center py-8">{t('plantsView.detailedView.journalNoEntries')}</p>}
                 </div>
            </Card>
          )}

          {activeTab === 'tasks' && (
            <Card>
                <div className="space-y-3">
                     {sortedTasks.length > 0 ? sortedTasks.map(task => (
                        <div key={task.id} className={`p-3 rounded-lg flex items-center justify-between ${task.isCompleted ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-white dark:bg-slate-700/50'}`}>
                            <div>
                                <p className={`font-bold ${task.isCompleted ? 'line-through' : ''}`}>{t(task.title)}</p>
                                <p className="text-sm text-slate-500">{t(task.description)}</p>
                            </div>
                            {!task.isCompleted && <Button size="sm" onClick={() => onCompleteTask(task.id)}>{t('plantsView.detailedView.tasksComplete')}</Button>}
                        </div>
                    )) : <p className="text-slate-500 text-center py-8">{t('plantsView.detailedView.tasksNoEntries')}</p>}
                </div>
            </Card>
          )}

          {activeTab === 'photos' && (
            <Card>
              {photoJournal.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photoJournal.map(p => (
                        <div key={p.id} className="group relative">
                            <img src={p.details?.imageUrl} alt={p.notes} className="w-full h-48 object-cover rounded-lg" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                                <p>{p.notes}</p>
                                <p className="opacity-70">{new Date(p.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">{t('plantsView.detailedView.photosNoEntries')}</p>
              )}
            </Card>
          )}

          {activeTab === 'ai' && (
            <AIAdvisorCard plant={plant} />
          )}

        </div>
      </div>
      <div className="action-bar">
        <div className="max-w-4xl mx-auto grid grid-cols-5 gap-2">
            {actionButtons.map(btn => (
                <button key={btn.type} onClick={() => setActionModal(btn.type as ActionType)} className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" aria-label={btn.label}>
                    <div className="w-7 h-7">{btn.icon}</div>
                    <span className="text-xs font-semibold">{btn.label}</span>
                </button>
            ))}
        </div>
      </div>
      {actionModal === 'watering' && <WateringModal onClose={() => setActionModal(null)} onConfirm={handleAddJournalAndClose} />}
      {actionModal === 'feeding' && <FeedingModal onClose={() => setActionModal(null)} onConfirm={handleAddJournalAndClose} />}
      {actionModal === 'observation' && <ObservationModal onClose={() => setActionModal(null)} onConfirm={handleAddJournalAndClose} />}
      {actionModal === 'training' && <TrainingModal onClose={() => setActionModal(null)} onConfirm={handleAddJournalAndClose} />}
      {actionModal === 'photo' && <PhotoModal onClose={() => setActionModal(null)} onConfirm={handleAddJournalAndClose} />}
    </>
  );
};
