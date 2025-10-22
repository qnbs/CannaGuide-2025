import React, { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorSection, Input, ResultDisplay } from './common';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

export const VentilationCalculator: React.FC = memo(() => {
    const { t } = useTranslation();
    const [dimensions, setDimensions] = useState({ width: 80, depth: 80, height: 180 });
    const [wattage, setWattage] = useState(150);
    const [hasFilter, setHasFilter] = useState(true);

    const result = useMemo(() => {
        const volume = (dimensions.width / 100) * (dimensions.depth / 100) * (dimensions.height / 100);
        if (volume <= 0) return 0;
        
        const airChangesPerHour = 60;
        let baseM3h = volume * airChangesPerHour;

        const heatFactor = 1 + (wattage / 1000);
        baseM3h *= heatFactor;
        
        if (hasFilter) {
            baseM3h *= 1.35;
        }

        return Math.ceil(baseM3h);
    }, [dimensions, wattage, hasFilter]);

    return (
        <CalculatorSection title={t('equipmentView.calculators.ventilation.title')} description={t('equipmentView.calculators.ventilation.description')}>
            <div className="grid grid-cols-3 gap-4">
                <Input label={t('equipmentView.calculators.ventilation.width')} type="number" unit="cm" value={dimensions.width} onChange={e => setDimensions(d => ({ ...d, width: Number(e.target.value) }))} />
                <Input label={t('equipmentView.calculators.ventilation.depth')} type="number" unit="cm" value={dimensions.depth} onChange={e => setDimensions(d => ({ ...d, depth: Number(e.target.value) }))} />
                <Input label={t('equipmentView.calculators.ventilation.height')} type="number" unit="cm" value={dimensions.height} onChange={e => setDimensions(d => ({ ...d, height: Number(e.target.value) }))} />
            </div>
            <Input label={t('equipmentView.calculators.ventilation.lightWattage')} type="number" unit="W" value={wattage} onChange={e => setWattage(Number(e.target.value))} tooltip={t('equipmentView.calculators.ventilation.lightWattageTooltip')} />
            <div>
                 <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">{t('equipmentView.calculators.ventilation.carbonFilter')}
                    <span className="group/tooltip relative" tabIndex={0} role="tooltip">
                        <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 transition-opacity pointer-events-none z-10">{t('equipmentView.calculators.ventilation.carbonFilterTooltip')}</span>
                    </span>
                 </label>
                 <div className="flex gap-2">
                    <Button onClick={() => setHasFilter(true)} variant={hasFilter ? 'primary' : 'secondary'} className="flex-1">{t('equipmentView.calculators.yes')}</Button>
                    <Button onClick={() => setHasFilter(false)} variant={!hasFilter ? 'primary' : 'secondary'} className="flex-1">{t('equipmentView.calculators.no')}</Button>
                 </div>
            </div>
            <ResultDisplay label={t('equipmentView.calculators.ventilation.result')} value={result.toString()} unit="m³/h" />
        </CalculatorSection>
    );
});
