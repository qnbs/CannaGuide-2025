import React, { useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Plant, Scenario } from '@/types';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { geminiService } from '@/services/geminiService';
import { closeDeepDiveModal } from '@/stores/slices/uiSlice';
import { useGenerateDeepDiveMutation } from '@/stores/api';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { scenarioService } from '@/services/scenarioService';
import { Button } from '@/components/common/Button';
import { selectDeepDiveModalState, selectPlantById } from '@/stores/selectors';
import { runComparisonScenario } from '@/stores/slices/sandboxSlice';

interface DeepDiveModalProps {
  plant: Plant;
  topic: string;
  onClose: () => void;
  onRunScenario: (scenario: Scenario) => void;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ plant, topic, onClose, onRunScenario }) => {
    const { t } = useTranslation();
    const [generateDeepDive, { data: response, isLoading, error }] = useGenerateDeepDiveMutation();

    useEffect(() => {
        if (!response && !isLoading && !error) {
            generateDeepDive({ topic, plant });
        }
    }, [plant, topic, response, isLoading, error, generateDeepDive]);

    const loadingMessage = useMemo(() => {
        const messages = geminiService.getDynamicLoadingMessages({
            useCase: 'deepDive',
            data: { topic, plantName: plant.name }
        });
        return messages[Math.floor(Math.random() * messages.length)];
    }, [topic, plant.name]);


    const relevantScenario = useMemo(() => {
        if (topic === 'Topping' || topic === 'LST') {
            return scenarioService.getScenarioById('topping-vs-lst');
        }
        return null;
    }, [topic]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`${t('common.deepDive')}: ${topic}`} size="2xl">
            {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
            {error && <div className="text-red-400">{'message' in error ? (error as any).message : t('ai.error.unknown')}</div>}
            {response && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg">
                        <PhosphorIcons.Info className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-300">{response.introduction}</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-primary-300 mb-2">Step-by-Step</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                            {response.stepByStep.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-green-400 mb-2">Pros</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-red-400 mb-2">Cons</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-primary-900/30 p-3 rounded-lg">
                        <h3 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                            <PhosphorIcons.Sparkle /> Pro-Tip
                        </h3>
                        <p className="text-sm text-slate-300">{response.proTip}</p>
                    </div>

                    {relevantScenario && (
                        <div className="text-center pt-4 border-t border-slate-700">
                             <Button onClick={() => onRunScenario(relevantScenario)}>
                                <PhosphorIcons.GameController className="w-5 h-5 mr-2" />
                                {t(relevantScenario.titleKey)}
                            </Button>
                            <p className="text-xs text-slate-500 mt-2">{t(relevantScenario.descriptionKey)}</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};


export const DeepDiveModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, plantId, topic } = useAppSelector(selectDeepDiveModalState);
    const plant = useAppSelector(selectPlantById(plantId));
    
    const handleRunScenario = (scenario: Scenario) => {
        if(plantId) {
            dispatch(runComparisonScenario({ plantId, scenario }));
            dispatch(closeDeepDiveModal());
        }
    };

    if (!isOpen || !plant || !topic) return null;

    return (
        <DeepDiveModal
            plant={plant}
            topic={topic}
            onClose={() => dispatch(closeDeepDiveModal())}
            onRunScenario={handleRunScenario}
        />
    );
};
