import React, { useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Plant, Scenario, DeepDiveGuide } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { getDynamicLoadingMessages } from '@/services/aiLoadingMessages';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { scenarioService } from '@/services/scenarioService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface DeepDiveModalProps {
  plant: Plant;
  topic: string;
  onClose: () => void;
  onRunScenario: (scenario: Scenario) => void;
  data?: DeepDiveGuide;
  isLoading: boolean;
  error?: unknown;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ plant, topic, onClose, onRunScenario, data: response, isLoading, error }) => {
    const { t } = useTranslation();

    const loadingMessage = useMemo(() => {
        if (!isLoading) return '';
        const messages = getDynamicLoadingMessages({
            useCase: 'deepDive',
            data: { topic, plantName: plant.name }
        });
        return messages[Math.floor(Math.random() * messages.length)];
    }, [topic, plant.name, isLoading]);


    const relevantScenario = useMemo(() => {
        if (topic === 'Topping' || topic === 'LST') {
            return scenarioService.getScenarioById('topping-vs-lst');
        }
        return null;
    }, [topic]);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`${t('common.deepDive')}: ${topic}`}
            description={t('plantsView.deepDive.description', { topic, plantName: plant.name })}
            size="2xl"
        >
            {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
            {!!error && <div className="text-red-400">{error instanceof Error ? error.message : t('ai.error.unknown')}</div>}
            {response && (
                <div className="space-y-4 pb-1">
                    <Card className="flex items-start gap-3 border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.12),rgba(15,23,42,0.9))]">
                        <PhosphorIcons.Info className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-300">{response.introduction}</p>
                    </Card>

                    <div>
                        <h3 className="font-bold text-base sm:text-lg text-primary-300 mb-2">{t('plantsView.deepDive.stepByStep')}</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm leading-6 text-slate-300">
                            {response.stepByStep.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-green-400 mb-2">{t('plantsView.deepDive.pros')}</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-red-400 mb-2">{t('plantsView.deepDive.cons')}</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>

                    <Card className="border-primary-400/15 bg-primary-900/20">
                        <h3 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                            <PhosphorIcons.Sparkle /> {t('common.proTip')}
                        </h3>
                        <p className="text-sm text-slate-300">{response.proTip}</p>
                    </Card>

                    {relevantScenario && (
                        <div className="text-center pt-4 border-t border-slate-700">
                             <Button onClick={() => onRunScenario(relevantScenario)}>
                                <PhosphorIcons.GameController className="w-5 h-5 mr-2" />
                                {t(relevantScenario.titleKey)}
                            </Button>
                            <p className="text-xs text-slate-500 mt-2">{t(relevantScenario.descriptionKey)}</p>
                        </div>
                    )}
                    <p className="text-xs text-slate-500 italic mt-4 text-center">{t('ai.disclaimer')}</p>
                </div>
            )}
        </Modal>
    );
};
