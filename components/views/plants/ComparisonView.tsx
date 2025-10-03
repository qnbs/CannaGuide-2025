import React, { useState, useEffect, memo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Plant, Scenario } from '@/types';
import { useTranslation } from 'react-i18next';
import { scenarioService } from '@/services/scenarioService';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { PlantVisualizer } from './PlantVisualizer';
import { Card } from '@/components/common/Card';

interface ComparisonViewProps {
  plant: Plant;
  scenario: Scenario;
  onClose: () => void;
}

const PlantResultCard: React.FC<{ plant: Plant, title: string }> = memo(({ plant, title }) => (
    <Card className="text-center">
        <h3 className="text-lg font-bold text-primary-300">{title}</h3>
        <div className="h-48 my-2 flex items-center justify-center">
             <PlantVisualizer plant={plant} />
        </div>
        <div className="space-y-1 text-sm">
             <p><strong>Height:</strong> {plant.height.toFixed(1)} cm</p>
             <p><strong>Biomass:</strong> {plant.biomass.toFixed(1)} g</p>
             <p><strong>Stress:</strong> {plant.stressLevel.toFixed(1)}%</p>
        </div>
    </Card>
));

export const ComparisonView: React.FC<ComparisonViewProps> = memo(({ plant, scenario, onClose }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [results, setResults] = useState<{ plantA: Plant, plantB: Plant } | null>(null);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        scenarioService.runComparisonScenario(plant, scenario)
            .then(res => {
                if (isMounted) {
                    setResults(res);
                    setIsLoading(false);
                }
            });
        return () => { isMounted = false; }
    }, [plant, scenario]);

    const getActionLabel = (action: string) => {
        if (action === 'NONE') return t('common.unchanged');
        return action;
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={t(scenario.titleKey)} size="2xl">
            {isLoading && <AiLoadingIndicator loadingMessage="Running accelerated simulation..." />}
            {results && (
                <div className="space-y-4">
                     <p className="text-center text-slate-400">{t(scenario.descriptionKey)} ({scenario.durationDays} days)</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PlantResultCard 
                            plant={results.plantA}
                            title={getActionLabel(scenario.plantAModifier.action)}
                        />
                         <PlantResultCard 
                            plant={results.plantB}
                            title={getActionLabel(scenario.plantBModifier.action)}
                        />
                     </div>
                </div>
            )}
        </Modal>
    );
});