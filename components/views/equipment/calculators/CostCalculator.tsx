import React, { useState, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { CalculatorSection, Input } from './common';

export const CostCalculator: React.FC = () => {
    const { t } = useTranslations();
    const [inputs, setInputs] = useState({ lightPower: 300, lightHours: 12, fanPower: 40, fanHours: 24, otherPower: 20, price: 0.30 });

    const handleChange = (field: keyof typeof inputs, value: string) => {
        setInputs(prev => ({ ...prev, [field]: Number(value) }));
    };

    const costs = useMemo(() => {
        const lightKwh = (inputs.lightPower * inputs.lightHours) / 1000;
        const fanKwh = (inputs.fanPower * inputs.fanHours) / 1000;
        const otherKwh = (inputs.otherPower * 24) / 1000;
        const dailyKwh = lightKwh + fanKwh + otherKwh;
        const dailyCost = dailyKwh * inputs.price;

        return {
            daily: dailyCost.toFixed(2),
            weekly: (dailyCost * 7).toFixed(2),
            monthly: (dailyCost * 30).toFixed(2),
            cycle: (dailyCost * 90).toFixed(2),
        };
    }, [inputs]);

    return (
        <CalculatorSection title={t('equipmentView.calculators.cost.title')} description={t('equipmentView.calculators.cost.description')}>
            <div className="grid grid-cols-2 gap-4">
                <Input label={t('equipmentView.calculators.cost.lightPower')} type="number" unit="W" value={inputs.lightPower} onChange={e => handleChange('lightPower', e.target.value)} />
                <Input label={t('equipmentView.calculators.cost.lightHours')} type="number" unit={t('common.units.h_day')} value={inputs.lightHours} onChange={e => handleChange('lightHours', e.target.value)} />
                <Input label={t('equipmentView.calculators.cost.fanPower')} type="number" unit="W" value={inputs.fanPower} onChange={e => handleChange('fanPower', e.target.value)} />
                <Input label={t('equipmentView.calculators.cost.fanHours')} type="number" unit={t('common.units.h_day')} value={inputs.fanHours} onChange={e => handleChange('fanHours', e.target.value)} />
                <Input label={t('equipmentView.calculators.cost.otherPower')} type="number" unit="W" value={inputs.otherPower} onChange={e => handleChange('otherPower', e.target.value)} />
                <Input label={t('equipmentView.calculators.cost.price')} type="number" step="0.01" unit={t('common.units.price_kwh')} value={inputs.price} onChange={e => handleChange('price', e.target.value)} />
            </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('equipmentView.calculators.cost.daily')}</p>
                    <p className="text-xl font-bold text-primary-400">{costs.daily} {t('common.units.currency_eur')}</p>
                </div>
                 <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('equipmentView.calculators.cost.weekly')}</p>
                    <p className="text-xl font-bold text-primary-400">{costs.weekly} {t('common.units.currency_eur')}</p>
                </div>
                 <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('equipmentView.calculators.cost.monthly')}</p>
                    <p className="text-xl font-bold text-primary-400">{costs.monthly} {t('common.units.currency_eur')}</p>
                </div>
                 <div className="bg-slate-800/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-400 uppercase">{t('equipmentView.calculators.cost.cycle')}</p>
                    <p className="text-xl font-bold text-primary-400">{costs.cycle} {t('common.units.currency_eur')}</p>
                    <p className="text-xs text-slate-500">{t('equipmentView.calculators.cost.cycleSub')}</p>
                </div>
            </div>
        </CalculatorSection>
    );
};
