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

const OverviewTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const stageDetails = PLANT_STAGE_DETAILS[plant.stage];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
                <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
            </Card>
            <Card className="md:col-span-2">
                 <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">Vitalwerte</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <VitalStat label="pH-Wert" value={plant.vitals.ph} unit="" idealMin={stageDetails.idealVitals.ph.min} idealMax={stageDetails.idealVitals.ph.max} color="bg-green-500" />
                    <VitalStat label="EC-Wert" value={plant.vitals.ec} unit="mS/cm" idealMin={stageDetails.idealVitals.ec.min} idealMax={stageDetails.idealVitals.ec.max} color="bg-amber-500" />
                    <VitalStat label="Feuchtigkeit" value={plant.vitals.substrateMoisture} unit="%" idealMin={40} idealMax={80} color="bg-blue-500" />
                    <VitalStat label="Stresslevel" value={plant.stressLevel} unit="%" idealMin={0} idealMax={20} color="bg-red-500" />
                 </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">Umgebung</h3>
                <div className="space-y-2 text-slate-700 dark:text-slate-200">
                     <p><strong>Temperatur:</strong> {plant.environment.temperature}°C</p>
                     <p><strong>Luftfeuchtigkeit:</strong> {plant.environment.humidity}%</p>
                     <p><strong>Lichtintensität:</strong> {plant.environment.light}%</p>
                     <p><strong>Höhe:</strong> {plant.height.toFixed(1)} cm</p>
                </div>
            </Card>
            <Card>
                <h3 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">Verlauf</h3>
                <div className="h-48">
                  <HistoryChart history={plant.history} />
                </div>
            </Card>
        </div>
    )
}

const journalTypeLabels: Record<JournalEntryType, string> = {
    WATERING: 'Bewässerung',
    FEEDING: 'Düngung',
    TRAINING: 'Training',
    OBSERVATION: 'Beobachtung',
    SYSTEM: 'System',
    PHOTO: 'Foto',
};

const JournalTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const [filter, setFilter] = useState<JournalEntryType | 'ALL'>('ALL');

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
    
    const filteredJournal = useMemo(() => 
        [...plant.journal].reverse().filter(entry => filter === 'ALL' || entry.type === filter), 
        [plant.journal, filter]
    );

    const filters: (JournalEntryType | 'ALL')[] = ['ALL', 'WATERING', 'FEEDING', 'TRAINING', 'PHOTO', 'OBSERVATION', 'SYSTEM'];

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                {filters.map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-full transition-colors font-semibold ${filter === f ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                        {f === 'ALL' ? 'Alle' : journalTypeLabels[f]}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
            {filteredJournal.map(entry => (
                <Card key={entry.id} className="flex items-start gap-4">
                    <div className="w-6 h-6 flex-shrink-0 mt-1">{iconMap[entry.type]}</div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                           <h4 className="font-bold text-slate-800 dark:text-slate-200">{journalTypeLabels[entry.type]}</h4>
                           <time className="text-xs text-slate-400 dark:text-slate-500">{new Date(entry.timestamp).toLocaleString()}</time>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{entry.notes} {formatDetails(entry)}</p>
                        {entry.details?.imageUrl && (
                            <img src={entry.details.imageUrl} alt={entry.notes} className="mt-2 rounded-lg max-h-60" />
                        )}
                    </div>
                </Card>
            ))}
            {filteredJournal.length === 0 && <p className="text-center text-slate-500 py-4">Keine Einträge für diesen Filter gefunden.</p>}
        </div>
        </div>
    )
}

const TasksTab: React.FC<{ plant: Plant, onCompleteTask: (taskId: string) => void }> = ({ plant, onCompleteTask }) => {
    const priorityClasses = {
        high: 'border-red-500/50 bg-red-500/10',
        medium: 'border-amber-500/50 bg-amber-500/10',
        low: 'border-blue-500/50 bg-blue-500/10',
    };
    return (
         <div className="space-y-3">
            {plant.tasks.length === 0 && <p className="text-slate-500 text-center p-4">Bisher wurden keine Aufgaben erstellt.</p>}
            {[...plant.tasks].reverse().map(task => (
                <Card key={task.id} className={`border-l-4 ${task.isCompleted ? 'opacity-50 border-slate-300' : priorityClasses[task.priority]}`}>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className={`font-bold text-slate-800 dark:text-slate-200 ${task.isCompleted ? 'line-through' : ''}`}>{task.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
                        </div>
                        {!task.isCompleted && <Button onClick={() => onCompleteTask(task.id)} size="sm">Erledigen</Button>}
                    </div>
                </Card>
            ))}
         </div>
    )
}

const PhotosTab: React.FC<{ plant: Plant }> = ({ plant }) => {
    const photoEntries = useMemo(() => 
        [...plant.journal].filter(e => e.type === 'PHOTO').reverse(), 
        [plant.journal]
    );

    if (photoEntries.length === 0) {
        return <p className="text-center text-slate-500 py-4">Es wurden noch keine Fotos hinzugefügt.</p>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photoEntries.map(entry => (
                <Card key={entry.id} className="p-2">
                    <img src={entry.details?.imageUrl} alt={entry.notes} className="w-full h-40 object-cover rounded-md mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-300">{entry.notes}</p>
                    <p className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</p>
                </Card>
            ))}
        </div>
    );
};


const AiAdvisorTab: React.FC<{ plant: Plant }> = ({ plant }) => {
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
            <p className="mb-4">Stelle eine Frage zu dieser Pflanze. Die KI analysiert die aktuellen Daten.</p>
             <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder={'z.B. "Warum hängen die Blätter?"'}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-slate-800 dark:text-white"
                />
                <Button onClick={handleAsk} disabled={isLoading || !query.trim()}>Fragen</Button>
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

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = ({ label, icon, onClick }) => (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-md transition-colors space-y-1 h-16"
    >
      <div className="w-7 h-7">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

export const DetailedPlantView: React.FC<DetailedPlantViewProps> = ({ plant, onClose, onAddJournalEntry, onCompleteTask }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [activeModal, setActiveModal] = useState<ActionType>(null);
    
    const trainingHistory = useMemo(() => plant.journal.filter(e => e.type === 'TRAINING'), [plant.journal]);

    const tabs: {id: ActiveTab, label: string, icon: React.ReactNode}[] = [
        { id: 'overview', label: 'Übersicht', icon: <PhosphorIcons.ChartPieSlice /> },
        { id: 'journal', label: 'Journal', icon: <PhosphorIcons.Book /> },
        { id: 'tasks', label: 'Aufgaben', icon: <PhosphorIcons.Checks /> },
        { id: 'photos', label: 'Fotos', icon: <PhosphorIcons.Camera /> },
        { id: 'ai', label: 'KI-Berater', icon: <PhosphorIcons.Sparkle /> },
    ];
    
    const handleActionConfirm = (type: JournalEntryType) => (details: JournalEntry['details'], notes: string) => {
        onAddJournalEntry({ type, notes, details });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                     <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-500 mb-2">
                        <PhosphorIcons.ArrowLeft /> Zurück zum Dashboard
                    </button>
                    <h2 className="text-3xl font-bold text-primary-500 dark:text-primary-300">{plant.name}</h2>
                    <p className="text-slate-500">{plant.strain.name} - Tag {plant.age}</p>
                </div>
                 <div className="w-48 h-48 -mt-8">
                    <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture} trainingHistory={trainingHistory}/>
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
                {activeTab === 'photos' && <PhotosTab plant={plant} />}
                {activeTab === 'ai' && <AiAdvisorTab plant={plant} />}
            </div>
            
            <div className="action-bar">
                 <div className="flex justify-around items-center gap-1">
                    <ActionButton label="Gießen" icon={<PhosphorIcons.Drop />} onClick={() => setActiveModal('watering')} />
                    <ActionButton label="Düngen" icon={<PhosphorIcons.TestTube />} onClick={() => setActiveModal('feeding')} />
                    <ActionButton label="Training" icon={<PhosphorIcons.Scissors />} onClick={() => setActiveModal('training')} />
                    <ActionButton label="Foto" icon={<PhosphorIcons.Camera />} onClick={() => setActiveModal('photo')} />
                    <ActionButton label="Beobachten" icon={<PhosphorIcons.MagnifyingGlass />} onClick={() => setActiveModal('observation')} />
                 </div>
            </div>

            {activeModal === 'watering' && <WateringModal onClose={() => setActiveModal(null)} onConfirm={handleActionConfirm('WATERING')} />}
            {activeModal === 'feeding' && <FeedingModal onClose={() => setActiveModal(null)} onConfirm={handleActionConfirm('FEEDING')} />}
            {activeModal === 'observation' && <ObservationModal onClose={() => setActiveModal(null)} onConfirm={handleActionConfirm('OBSERVATION')} />}
            {activeModal === 'training' && <TrainingModal onClose={() => setActiveModal(null)} onConfirm={handleActionConfirm('TRAINING')} />}
            {activeModal === 'photo' && <PhotoModal onClose={() => setActiveModal(null)} onConfirm={handleActionConfirm('PHOTO')} />}

        </div>
    );
};