
import React, { useState, useEffect, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectActivePlants, selectSandboxState } from '@/stores/selectors';
import { runComparisonScenario } from '@/stores/slices/sandboxSlice';
import { Plant, Experiment, Scenario, ScenarioAction, SandboxState } from '@/types';
import { scenarioService } from '@/services/scenarioService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { PlantVisualizer } from '../plants/PlantVisualizer';
import { Select } from '@/components/ui/ThemePrimitives';
import { Modal } from '@/components/common/Modal';

const ExperimentResults: React.FC<{ experiment: Experiment }> = memo(({ experiment }) => {
    const { t } = useTranslation();
    const [day, setDay] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval: number;
        if (isPlaying) {
            interval = window.setInterval(() => {
                setDay(d => (d + 1) % experiment.durationDays);
            }, 300);
        }
        return () => clearInterval(interval);
    }, [isPlaying, experiment.durationDays]);

    // Create a temporary full plant object for visualization based on history
    const createPlantFromHistory = (basePlant: Plant, historyEntry: any): Plant => {
        return {
            ...basePlant,
            height: historyEntry.height,
            stressLevel: historyEntry.stressLevel,
            health: historyEntry.health,
            // We can add more properties from history if needed for more complex visualizations
        };
    };

    const plantAatDay = createPlantFromHistory(experiment.originalFinalState, experiment.originalHistory[day] || {});
    const plantBatDay = createPlantFromHistory(experiment.modifiedFinalState, experiment.modifiedHistory[day] || {});
    
    const metrics: (keyof Plant | 'substrate.ph' | 'substrate.ec')[] = [ 'biomass', 'height', 'health', 'stressLevel' ];
    
    const getMetricValue = (plant: Plant, key: string): number => {
        if (key.includes('.')) {
            const keys = key.split('.');
            return (plant as any)[keys[0]][keys[1]];
        }
        return (plant as any)[key];
    }

    const calculateDiff = (valA: number, valB: number) => {
        if (valA === 0) return Infinity;
        const diff = ((valB - valA) / valA) * 100;
        const color = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400';
        const sign = diff > 0 ? '+' : '';
        return <span className={color}>{sign}{diff.toFixed(1)}%</span>;
    };

    return (
        <Card className="mt-4 animate-fade-in">
            <h3 className="text-xl font-bold">{experiment.name}</h3>
            <p className="text-sm text-slate-400">{experiment.scenarioDescription}</p>

            <div className="my-6">
                <div className="flex items-center gap-4">
                    <Button size="sm" className="!p-2" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <PhosphorIcons.Pause /> : <PhosphorIcons.Play />}
                    </Button>
                    <input
                        id="day-slider"
                        type="range"
                        min="0"
                        max={experiment.durationDays - 1}
                        value={day}
                        onChange={e => setDay(Number(e.target.value))}
                        className="w-full"
                    />
                     <span className="text-sm font-mono bg-slate-700 px-2 py-1 rounded-md">{t('plantsView.plantCard.day')} {day + 1}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <h4 className="font-bold">Original</h4>
                    <PlantVisualizer plant={plantAatDay} className="w-full h-48 mx-auto" />
                </div>
                 <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                    <h4 className="font-bold">Modifiziert</h4>
                    <PlantVisualizer plant={plantBatDay} className="w-full h-48 mx-auto" />
                </div>
            </div>
            
            <div className="mt-6">
                 <h4 className="text-lg font-bold mb-2">Finale Metriken-Analyse</h4>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="p-2">Metrik</th>
                                <th className="p-2 text-right">Original</th>
                                <th className="p-2 text-right">Modifiziert</th>
                                <th className="p-2 text-right">Differenz</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map(key => (
                                <tr key={key.toString()} className="border-b border-slate-700">
                                    <td className="p-2 font-semibold">{key.toString()}</td>
                                    <td className="p-2 text-right font-mono">{getMetricValue(experiment.originalFinalState, key.toString()).toFixed(2)}</td>
                                    <td className="p-2 text-right font-mono">{getMetricValue(experiment.modifiedFinalState, key.toString()).toFixed(2)}</td>
                                    <td className="p-2 text-right font-mono">{calculateDiff(getMetricValue(experiment.originalFinalState, key.toString()), getMetricValue(experiment.modifiedFinalState, key.toString()))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </Card>
    );
});


export const SandboxView: React.FC = memo(() => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const activePlants = useAppSelector(selectActivePlants);
    const { savedExperiments, isLoading, error } = useAppSelector(selectSandboxState);
    const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
    
    useEffect(() => {
        if(activePlants.length > 0) {
            setSelectedPlantId(activePlants[0].id);
        }
    }, [activePlants]);

    useEffect(() => {
        if (savedExperiments.length > 0 && !selectedExperimentId) {
            setSelectedExperimentId(savedExperiments[savedExperiments.length - 1].id);
        }
    }, [savedExperiments, selectedExperimentId]);

    const handleRun = () => {
        if (selectedPlantId) {
            const scenario = scenarioService.getScenarioById('topping-vs-lst');
            if(scenario) {
                dispatch(runComparisonScenario({ plantId: selectedPlantId, scenario }));
            }
            setIsModalOpen(false);
        }
    };
    
    const selectedExperiment = savedExperiments.find(e => e.id === selectedExperimentId);

    return (
        <div className="space-y-6">
             {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('knowledgeView.sandbox.modal.title')}>
                    <div className="space-y-4">
                        <p>{t('knowledgeView.sandbox.modal.description')}</p>
                         <Select
                            value={selectedPlantId || ''}
                            onChange={e => setSelectedPlantId(e.target.value)}
                            options={activePlants.map(p => ({ value: p.id, label: p.name }))}
                            disabled={activePlants.length === 0}
                         />
                         {activePlants.length === 0 && <p className="text-amber-400 text-sm">{t('knowledgeView.sandbox.modal.noPlants')}</p>}
                    </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleRun} disabled={!selectedPlantId || isLoading}>{t('knowledgeView.sandbox.modal.runScenario')}</Button>
                    </div>
                </Modal>
            )}
            <Card>
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold font-display text-primary-400">{t('knowledgeView.sandbox.title')}</h3>
                    <Button onClick={() => setIsModalOpen(true)} disabled={isLoading || activePlants.length === 0}>
                         {isLoading ? t('knowledgeView.sandbox.runningSimulation') : t('knowledgeView.sandbox.startExperiment')}
                    </Button>
                </div>
                 {isLoading && <AiLoadingIndicator loadingMessage={t('knowledgeView.sandbox.runningSimulation')} />}
            </Card>

            <Card>
                <h4 className="text-lg font-bold mb-2">{t('knowledgeView.sandbox.savedExperiments')}</h4>
                {savedExperiments.length === 0 && !isLoading ? (
                    <p className="text-slate-400">{t('knowledgeView.sandbox.noExperiments')}</p>
                ) : (
                    <div className="space-y-2">
                        {savedExperiments.map(exp => (
                            <button 
                                key={exp.id}
                                onClick={() => setSelectedExperimentId(exp.id)}
                                className={`w-full text-left p-2 rounded-md transition-colors ${selectedExperimentId === exp.id ? 'bg-primary-900/50' : 'hover:bg-slate-800'}`}
                            >
                                <p className="font-semibold">{exp.name}</p>
                                <p className="text-xs text-slate-400">
                                    {t('knowledgeView.sandbox.experimentMeta', { basePlantName: exp.basePlantName, date: new Date(exp.createdAt).toLocaleDateString()})}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {selectedExperiment && <ExperimentResults experiment={selectedExperiment} />}
        </div>
    );
});