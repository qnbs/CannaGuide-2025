import React from 'react';
import { useTranslation } from 'react-i18next';
import { VentilationCalculator } from './calculators/VentilationCalculator';
import { LightCalculator } from './calculators/LightCalculator';
import { CostCalculator } from './calculators/CostCalculator';
import { NutrientCalculator } from './calculators/NutrientCalculator';
import { ConverterCalculator } from './calculators/ConverterCalculator';
import { YieldCalculator } from './calculators/YieldCalculator';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

type CalculatorType = 'ventilation' | 'light' | 'cost' | 'nutrients' | 'converter' | 'yield';

const calculatorList: { id: CalculatorType; Component: React.FC; icon: React.ReactNode; titleKey: string }[] = [
    { id: 'ventilation', Component: VentilationCalculator, icon: <PhosphorIcons.Fan />, titleKey: 'equipmentView.calculators.ventilation.title' },
    { id: 'light', Component: LightCalculator, icon: <PhosphorIcons.Sun />, titleKey: 'equipmentView.calculators.light.title' },
    { id: 'cost', Component: CostCalculator, icon: <PhosphorIcons.Drop />, titleKey: 'equipmentView.calculators.cost.title' },
    { id: 'nutrients', Component: NutrientCalculator, icon: <PhosphorIcons.Flask />, titleKey: 'equipmentView.calculators.nutrients.title' },
    { id: 'converter', Component: ConverterCalculator, icon: <PhosphorIcons.ArrowClockwise />, titleKey: 'equipmentView.calculators.converter.title' },
    { id: 'yield', Component: YieldCalculator, icon: <PhosphorIcons.ChartPieSlice />, titleKey: 'equipmentView.calculators.yield.title' },
];

export const Calculators: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            {calculatorList.map((calc, index) => (
                <details key={calc.id} className="group glass-pane rounded-lg overflow-hidden ring-1 ring-inset ring-white/20" open={index === 0}>
                    <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                        <h4 className="font-semibold text-slate-100 flex items-center gap-3">
                            <div className="w-6 h-6 text-primary-300">{calc.icon}</div>
                            {t(calc.titleKey)}
                        </h4>
                        <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="p-4 border-t border-slate-700/50">
                        <calc.Component />
                    </div>
                </details>
            ))}
        </div>
    );
};