import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorSection, Input, ResultDisplay, Select } from './common';
import { PlantStage } from '@/types';

export const LightCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [dimensions, setDimensions] = useState({ width: 80, depth: 80 });
    const [stage, setStage] = useState<PlantStage>(PlantStage.Flowering);

    const { ppfd, dli, watts } = useMemo(() => {
        const area = (dimensions.width / 100) * (dimensions.depth / 100);
        if (area <= 0) return { ppfd: 0, dli: 0, watts: 0 };

        const ppfdTargets: Record<string, number> = {
            [PlantStage.Seedling]: 200,
            [PlantStage.Vegetative]: 500,
            [PlantStage.Flowering]: 900,
        };
        const lightHours: Record<string, number> = {
            [PlantStage.Seedling]: 18,
            [PlantStage.Vegetative]: 18,
            [PlantStage.Flowering]: 12,
        };

        const targetPpfd = ppfdTargets[stage] || 0;
        const hours = lightHours[stage] || 0;
        const targetDli = (targetPpfd * hours * 3600) / 1000000;
        
        const ledEfficiency = 2.5; // µmol/J
        const requiredPpfd = targetPpfd * area;
        const requiredWatts = requiredPpfd / ledEfficiency;

        return { ppfd: targetPpfd, dli: targetDli, watts: Math.round(requiredWatts) };
    }, [dimensions, stage]);

    const stageOptions = [
        { value: PlantStage.Seedling, label: t('plantStages.SEEDLING') },
        { value: PlantStage.Vegetative, label: t('plantStages.VEGETATIVE') },
        { value: PlantStage.Flowering, label: t('plantStages.FLOWERING') },
    ];

    return (
        <CalculatorSection title={t('equipmentView.calculators.light.title')} description={t('equipmentView.calculators.light.description')}>
            <div className="grid grid-cols-2 gap-4">
                <Input label={t('equipmentView.calculators.light.width')} type="number" unit="cm" value={dimensions.width} onChange={e => setDimensions(d => ({ ...d, width: Number(e.target.value) }))} />
                <Input label={t('equipmentView.calculators.light.depth')} type="number" unit="cm" value={dimensions.depth} onChange={e => setDimensions(d => ({ ...d, depth: Number(e.target.value) }))} />
            </div>
            <Select label={t('equipmentView.calculators.light.stage')} options={stageOptions} value={stage} onChange={e => setStage(e.target.value as PlantStage)} />
            <ResultDisplay label={t('equipmentView.calculators.light.result')} value={watts.toString()} unit="W">
                <div className="text-xs text-slate-400 mt-2 grid grid-cols-2 gap-2">
                    <div title={t('equipmentView.calculators.light.ppfdTooltip')}><strong>PPFD</strong> {ppfd} µmol/m²/s</div>
                    <div title={t('equipmentView.calculators.light.dliTooltip')}><strong>DLI</strong> {dli.toFixed(1)} mol/m²/day</div>
                </div>
            </ResultDisplay>
        </CalculatorSection>
    );
};