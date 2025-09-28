import React, { useState, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { CalculatorSection, Input, ResultDisplay } from './common';

export const YieldCalculator: React.FC = () => {
    const { t } = useTranslations();
    const [wattage, setWattage] = useState(300);
    const [efficiency, setEfficiency] = useState(1.2); // g/W

    const result = useMemo(() => {
        const yieldGrams = wattage * efficiency;
        return {
            low: (yieldGrams * 0.8).toFixed(0),
            medium: yieldGrams.toFixed(0),
            high: (yieldGrams * 1.2).toFixed(0),
        };
    }, [wattage, efficiency]);

    return (
        <CalculatorSection title={t('equipmentView.calculators.yield.title')} description={t('equipmentView.calculators.yield.description')}>
            <Input label={t('equipmentView.calculators.yield.lightWattage')} type="number" unit="W" value={wattage} onChange={e => setWattage(Number(e.target.value))} />
            <Input label={t('equipmentView.calculators.yield.efficiency')} type="number" step="0.1" unit={t('common.units.g_w')} value={efficiency} onChange={e => setEfficiency(Number(e.target.value))} tooltip={t('equipmentView.calculators.yield.efficiencyTooltip')} />
            <ResultDisplay label={t('equipmentView.calculators.yield.result')} value={result.medium} unit="g">
                <p className="text-xs text-slate-400 mt-1">({t('equipmentView.calculators.yield.range', { low: result.low, high: result.high })})</p>
            </ResultDisplay>
        </CalculatorSection>
    );
};
