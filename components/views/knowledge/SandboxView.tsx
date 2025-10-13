import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSandboxState, selectActivePlants, selectSavedExperiments } from '@/stores/selectors';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Modal } from '@/components/common/Modal';
import { runComparisonScenario, clearCurrentExperiment, saveExperiment, deleteExperiment } from '@/stores/slices/sandboxSlice';
import { scenarioService } from '@/services/scenarioService';
import { ComparisonView } from '../plants/ComparisonView';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { Card } from '@/components/common/Card';
import { SavedExperiment } from '@/types';

const SavedExperimentCard: React.FC<{ experiment: SavedExperiment; onDelete: () => void; onView: () => void }> = ({ experiment, onDelete, onView }) => {
    const { t } = useTranslation();
    const scenario = scenarioService.getScenarioById(experiment.scenarioId);
    if (!scenario) return null;
    return (
        <Card className="!p-3 bg-slate-800">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-slate-100">{t(scenario.titleKey)}</h4>
                    <p className="text-xs text-slate-400">Based on: {experiment.basePlantName}</p>
                    <p className="text-xs text-slate-500">Run: {new Date(experiment.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={onDelete}><PhosphorIcons.TrashSimple/></Button>
                </div>
            </div>
        </Card>
    )
}

const SandboxView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { currentExperiment, status, savedExperiments } = useAppSelector(selectSandboxState);
    const activePlants = useAppSelector(selectActivePlants);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedPlantId, setSelectedPlantId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (activePlants.length > 0 && !selectedPlantId) {
            setSelectedPlantId(activePlants[0].id);
        }
    }, [activePlants, selectedPlantId]);

    const handleRunScenario = () => {
        if (selectedPlantId) {
            const scenario = scenarioService.getScenarioById('topping-vs-lst');
            if (scenario) {
                dispatch(runComparisonScenario({ plantId: selectedPlantId, scenario }));
                setIsModalOpen(false);
            }
        }
    };
    
    const handleSave = () => {
        if(currentExperiment) {
            const basePlant = activePlants.find(p => p.id === (currentExperiment as any).basePlantId);
            const scenario = scenarioService.getScenarioById((currentExperiment as any).scenarioId);
            if (basePlant && scenario) {
                dispatch(saveExperiment({ scenario, basePlantName: basePlant.name }));
            }
        }
    };
    
    if (status === 'running') {
        return <AiLoadingIndicator loadingMessage={t('knowledgeView.sandbox.runningSimulation')} />;
    }
    
    if (status === 'succeeded' && currentExperiment) {
        return (
            <div>
                 <ComparisonView 
                    experiment={currentExperiment as any} 
                    onFinish={() => dispatch(clearCurrentExperiment())}
                 />
                 <div className="mt-4 text-center">
                    <Button onClick={handleSave}>
                        <PhosphorIcons.ArchiveBox className="w-5 h-5 mr-2"/>
                        Save Experiment Results
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {isModalOpen && (
                 <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title={t('knowledgeView.sandbox.modal.title')}>
                    {activePlants.length > 0 ? (
                        <div className="space-y-4">
                            <p>{t('knowledgeView.sandbox.modal.description')}</p>
                             <select value={selectedPlantId || ''} onChange={e => setSelectedPlantId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md p-2">
                                {activePlants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <Button onClick={handleRunScenario} className="w-full">{t('knowledgeView.sandbox.modal.runScenario')}</Button>
                        </div>
                    ) : (
                        <p>{t('knowledgeView.sandbox.modal.noPlants')}</p>
                    )}
                </Modal>
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold font-display text-primary-400">{t('knowledgeView.sandbox.title')}</h3>
                <Button onClick={() => setIsModalOpen(true)} disabled={activePlants.length === 0}>
                    <PhosphorIcons.Flask className="w-5 h-5 mr-2" />
                    {t('knowledgeView.sandbox.startExperiment')}
                </Button>
            </div>
            
            <h4 className="font-bold text-lg text-slate-200 mb-2">{t('knowledgeView.sandbox.savedExperiments')}</h4>
            {savedExperiments.length > 0 ? (
                <div className="space-y-2">
                    {savedExperiments.map(exp => (
                        <SavedExperimentCard
                            key={exp.id}
                            experiment={exp}
                            onDelete={() => dispatch(deleteExperiment(exp.id))}
                            onView={() => { /* This would load a saved experiment into the view */ }}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500">{t('knowledgeView.sandbox.noExperiments')}</p>
            )}
        </div>
    );
};

export default SandboxView;