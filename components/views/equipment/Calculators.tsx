import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { VentilationCalculator } from './calculators/VentilationCalculator';
import { LightCalculator } from './calculators/LightCalculator';
import { CostCalculator } from './calculators/CostCalculator';
import { NutrientCalculator } from './calculators/NutrientCalculator';
import { ConverterCalculator } from './calculators/ConverterCalculator';
import { YieldCalculator } from './calculators/YieldCalculator';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

type CalculatorType = 'ventilation' | 'light' | 'cost' | 'nutrients' | 'converter' | 'yield';

const calculatorComponents: Record<CalculatorType, React.FC> = {
    ventilation: VentilationCalculator,
    light: LightCalculator,
    cost: CostCalculator,
    nutrients: NutrientCalculator,
    converter: ConverterCalculator,
    'yield': YieldCalculator,
};

const calculatorIcons: Record<CalculatorType, React.ReactNode> = {
    ventilation: <PhosphorIcons.Fan />,
    light: <PhosphorIcons.Sun />,
    cost: <PhosphorIcons.Drop />,
    nutrients: <PhosphorIcons.Flask />,
    converter: <PhosphorIcons.ArrowClockwise />,
    'yield': <PhosphorIcons.ChartPieSlice />,
};

export const Calculators: React.FC = () => {
    const { t } = useTranslation();
    const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('ventilation');

    const calculators: { id: CalculatorType; title: string; description: string }[] = [
        { id: 'ventilation', title: t('equipmentView.calculators.ventilation.title'), description: t('equipmentView.calculators.ventilation.description') },
        { id: 'light', title: t('equipmentView.calculators.light.title'), description: t('equipmentView.calculators.light.description') },
        { id: 'cost', title: t('equipmentView.calculators.cost.title'), description: t('equipmentView.calculators.cost.description') },
        { id: 'nutrients', title: t('equipmentView.calculators.nutrients.title'), description: t('equipmentView.calculators.nutrients.description') },
        { id: 'converter', title: t('equipmentView.calculators.converter.title'), description: t('equipmentView.calculators.converter.description') },
        { id: 'yield', title: t('equipmentView.calculators.yield.title'), description: t('equipmentView.calculators.yield.description') },
    ];

    const ActiveComponent = calculatorComponents[activeCalculator];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
                {calculators.map(calc => (
                    <button
                        key={calc.id}
                        onClick={() => setActiveCalculator(calc.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${activeCalculator === calc.id ? 'bg-primary-900/50 border-l-4 border-primary-500' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-slate-700 ${activeCalculator === calc.id ? 'text-primary-300' : 'text-slate-300'}`}>
                                {calculatorIcons[calc.id]}
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-100">{calc.title}</h4>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            <div className="md:col-span-2">
                <Card className="h-full">
                    <ActiveComponent />
                </Card>
            </div>
        </div>
    );
};