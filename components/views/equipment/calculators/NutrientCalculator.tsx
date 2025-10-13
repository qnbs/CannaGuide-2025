import React, { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorSection, Input, ResultDisplay } from './common';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface Component {
    id: string;
    name: string;
    dose: number; // in ml/L
}

export const NutrientCalculator: React.FC = memo(() => {
    const { t } = useTranslation();
    const [waterAmount, setWaterAmount] = useState(5); // in Liters
    const [components, setComponents] = useState<Component[]>([
        { id: `comp-${Date.now()}`, name: 'Grow', dose: 2 }
    ]);

    const handleAddComponent = () => {
        setComponents(prev => [...prev, { id: `comp-${Date.now()}-${prev.length}`, name: '', dose: 0 }]);
    };

    const handleRemoveComponent = (id: string) => {
        setComponents(prev => prev.filter(c => c.id !== id));
    };

    const handleComponentChange = (id: string, field: 'name' | 'dose', value: string | number) => {
        setComponents(prev => prev.map(c => {
            if (c.id === id) {
                const numericValue = field === 'dose' ? Number(value) : value;
                return { ...c, [field]: numericValue };
            }
            return c;
        }));
    };

    return (
        <CalculatorSection title={t('equipmentView.calculators.nutrients.title')} description={t('equipmentView.calculators.nutrients.description')}>
            <Input
                label={t('equipmentView.calculators.nutrients.reservoir')}
                type="number"
                unit="L"
                value={waterAmount}
                onChange={e => setWaterAmount(Number(e.target.value))}
            />
            <div className="space-y-3">
                {components.map((comp, index) => (
                    <div key={comp.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_2fr] gap-2 items-end p-2 bg-slate-800/50 rounded-lg">
                        <Input
                            label={`${t('equipmentView.calculators.nutrients.component')} #${index + 1}`}
                            type="text"
                            placeholder="e.g., Grow, Bloom"
                            value={comp.name}
                            onChange={e => handleComponentChange(comp.id, 'name', e.target.value)}
                        />
                        <Input
                            label={t('equipmentView.calculators.nutrients.dose')}
                            type="number"
                            unit="ml/L"
                            value={comp.dose}
                            onChange={e => handleComponentChange(comp.id, 'dose', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                             <div className="flex-grow">
                                <ResultDisplay
                                    label={`${t('equipmentView.calculators.nutrients.totalFor')} ${waterAmount}L`}
                                    value={(comp.dose * waterAmount).toFixed(1)}
                                    unit="ml"
                                />
                            </div>
                            <Button variant="danger" size="sm" className="!p-2 self-center mb-1" onClick={() => handleRemoveComponent(comp.id)}>
                                <PhosphorIcons.TrashSimple className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant="secondary" onClick={handleAddComponent} className="w-full">
                <PhosphorIcons.Plus className="w-4 h-4 mr-2" />
                {t('equipmentView.calculators.nutrients.addComponent')}
            </Button>
        </CalculatorSection>
    );
});
