import React, { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorSection, Input, ResultDisplay } from './common';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface Component {
    id: string;
    name: string;
    dose: number;
}

export const NutrientCalculator: React.FC = () => {
    const { t } = useTranslation();
    const [waterAmount, setWaterAmount] = useState(5);
    const [components, setComponents] = useState<Component[]>([{ id: useId(), name: 'Grow', dose: 2 }]);

    const addComponent = () => {
        setComponents(prev => [...prev, { id: useId(), name: `Comp. ${prev.length + 1}`, dose: 1 }]);
    };
    
    const removeComponent = (id: string) => {
        setComponents(prev => prev.filter(c => c.id !== id));
    };
    
    const updateComponent = (id: string, field: 'name' | 'dose', value: string | number) => {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    return (
        <CalculatorSection title={t('equipmentView.calculators.nutrients.title')} description={t('equipmentView.calculators.nutrients.description')}>
            <Input label={t('equipmentView.calculators.nutrients.reservoir')} type="number" unit="L" value={waterAmount} onChange={e => setWaterAmount(Number(e.target.value))} />
            <div className="space-y-3">
                {components.map(comp => (
                    <div key={comp.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                        <Input label={t('equipmentView.calculators.nutrients.component')} type="text" value={comp.name} onChange={e => updateComponent(comp.id, 'name', e.target.value)} />
                        <Input label={t('equipmentView.calculators.nutrients.dose')} type="number" unit="ml/L" value={comp.dose} onChange={e => updateComponent(comp.id, 'dose', Number(e.target.value))} />
                        <ResultDisplay label={t('equipmentView.calculators.nutrients.totalFor')} value={(comp.dose * waterAmount).toFixed(1)} unit="ml" />
                         <Button variant="danger" size="sm" onClick={() => removeComponent(comp.id)} className="!p-2.5 h-10 self-end"><PhosphorIcons.TrashSimple className="w-5 h-5"/></Button>
                    </div>
                ))}
            </div>
            <Button onClick={addComponent} variant="secondary" className="w-full">
                <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />
                {t('equipmentView.calculators.nutrients.addComponent')}
            </Button>
        </CalculatorSection>
    );
};