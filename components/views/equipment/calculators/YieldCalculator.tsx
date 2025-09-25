import React, { useState, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { CalculatorSection, Input, ResultDisplay, Select } from './common';

type Experience = 'beginner' | 'advanced' | 'expert';
type Training = 'none' | 'lst' | 'scrog';

export const YieldCalculator: React.FC = () => {
    const { t } = useTranslations();
    const [wattage, setWattage] = useState(300);
    const [experience, setExperience] = useState<Experience>('advanced');
    const [training, setTraining] = useState<Training>('lst');

    const result = useMemo(() => {
        const baseEfficiency: Record<Experience, number> = { beginner: 0.7, advanced: 1.0, expert: 1.5 };
        const trainingMultiplier: Record<Training, number> = { none: 1.0, lst: 1.15, scrog: 1.25 };
        
        const gpw = baseEfficiency[experience] * trainingMultiplier[training];
        const estimatedYield = wattage * gpw;
        
        return {
            yield: estimatedYield.toFixed(0),
            gpw: gpw.toFixed(2)
        };
    }, [wattage, experience, training]);

    const experienceOptions = Object.keys(t('equipmentView.calculators.yield.levels')).map(key => ({
        value: key,
        label: t(`equipmentView.calculators.yield.levels.${key}`)
    }));
    
    const trainingOptions = Object.keys(t('equipmentView.calculators.yield.trainings')).map(key => ({
        value: key,
        label: t(`equipmentView.calculators.yield.trainings.${key}`)
    }));

    return (
        <CalculatorSection title={t('equipmentView.calculators.yield.title')} description={t('equipmentView.calculators.yield.description')}>
            <Input label={t('equipmentView.calculators.yield.wattage')} type="number" unit="W" value={wattage} onChange={e => setWattage(Number(e.target.value))} />
            <Select label={t('equipmentView.calculators.yield.level')} options={experienceOptions} value={experience} onChange={e => setExperience(e.target.value as Experience)} />
            <Select label={t('equipmentView.calculators.yield.training')} options={trainingOptions} value={training} onChange={e => setTraining(e.target.value as Training)} />
            <ResultDisplay label={t('equipmentView.calculators.yield.result')} value={result.yield} unit="g">
                 <p className="text-xs text-slate-400 mt-1">{t('equipmentView.calculators.yield.efficiency')}: {result.gpw} {t('common.units.g_w')}</p>
            </ResultDisplay>
        </CalculatorSection>
    );
};
