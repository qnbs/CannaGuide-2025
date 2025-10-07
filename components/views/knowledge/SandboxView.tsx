import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectSandboxState, selectActivePlants } from '@/stores/selectors';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Modal } from '@/components/common/Modal';
import { runComparisonScenario } from '@/stores/slices/sandboxSlice';
import { scenarioService } from '@/services/scenarioService';
import { ComparisonView } from '../plants/ComparisonView';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

const SandboxView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { currentExperiment, status } = useAppSelector(selectSandboxState);
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
    
    if (status === 'running') {
        return <AiLoadingIndicator loadingMessage={t('knowledgeView.sandbox.runningSimulation')} />;
    }
    
    if (currentExperiment) {
        return <ComparisonView experiment={currentExperiment as any} />;
    }

    return (
        <div>
            {isModalOpen && (
                 <Modal isOpen={true} onClose={() => setIsModalOpen(false)} title={t('knowledgeView.sandbox.modal.title')}>
                    {activePlants.length > 0 ? (
                        <div className="space-y-4">
                            <p>{t('knowledgeView.sandbox.modal.description')}</p>
                             <select value={selectedPlantId || ''} onChange={e => setSelectedPlantId(e.target.value)} className="w-full select-input">
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
                <Button onClick={() => setIsModalOpen(true)}>
                    <PhosphorIcons.Flask className="w-5 h-5 mr-2" />
                    {t('knowledgeView.sandbox.startExperiment')}
                </Button>
            </div>
            
            <p>Saved experiments will be shown here.</p>
        </div>
    );
};

export default SandboxView;
