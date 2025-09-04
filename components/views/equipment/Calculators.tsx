import React, { useState, useMemo, useEffect } from 'react';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

type CalculatorType = 'ventilation' | 'light' | 'nutrients' | 'yield';

const CalculatorInput: React.FC<{
    label: string,
    value: string,
    onChange: (val: string) => void,
    unit: string
}> = ({ label, value, onChange, unit }) => (
    <div className="relative">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min="0"
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
        />
        <span className="absolute right-3 top-9 text-xs text-slate-500 dark:text-slate-400">{unit}</span>
    </div>
);

export const Calculators: React.FC = () => {
    const { t } = useTranslations();
    const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('ventilation');

    const [ventilation, setVentilation] = useState({ width: '80', depth: '80', height: '180', result: 0 });
    const [light, setLight] = useState({ width: '80', depth: '80', result: 0 });
    const [nutrients, setNutrients] = useState({ water: '5', dose: '2', result: 0 });
    const [yieldEst, setYieldEst] = useState({ area: '0.64', wattage: '250', level: 'advanced', result: 0 });

    useEffect(() => {
        const w = parseFloat(ventilation.width) / 100;
        const d = parseFloat(ventilation.depth) / 100;
        const h = parseFloat(ventilation.height) / 100;
        if (w > 0 && d > 0 && h > 0) {
            const volume = w * d * h;
            const airflow = volume * 60; // 60 air exchanges per hour
            setVentilation(v => ({ ...v, result: Math.round(airflow) }));
        }
    }, [ventilation.width, ventilation.depth, ventilation.height]);
    
     useEffect(() => {
        const w = parseFloat(light.width) / 100;
        const d = parseFloat(light.depth) / 100;
        if (w > 0 && d > 0) {
            const area = w * d;
            const wattage = area * 400; // 400W/m²
            setLight(l => ({...l, result: Math.round(wattage)}));
        }
    }, [light.width, light.depth]);

     useEffect(() => {
        const water = parseFloat(nutrients.water);
        const dose = parseFloat(nutrients.dose);
        if (water > 0 && dose >= 0) {
            const result = water * dose;
            setNutrients(n => ({...n, result}));
        }
    }, [nutrients.water, nutrients.dose]);

    useEffect(() => {
        const area = parseFloat(yieldEst.area);
        const wattage = parseFloat(yieldEst.wattage);
        const levelModifiers = { beginner: 0.7, advanced: 1.0, expert: 1.2 };
        if (area > 0 && wattage > 0) {
            const baseYield = (area * wattage) / 2; // More realistic base
            const modifiedYield = baseYield * levelModifiers[yieldEst.level as keyof typeof levelModifiers];
            setYieldEst(y => ({...y, result: Math.round(modifiedYield)}));
        }
    }, [yieldEst.area, yieldEst.wattage, yieldEst.level]);

    const calculators: { id: CalculatorType; icon: React.ReactNode; title: string; description: string }[] = [
        { id: 'ventilation', icon: <PhosphorIcons.Fan />, title: t('equipmentView.calculators.ventilation.title'), description: t('equipmentView.calculators.ventilation.description') },
        { id: 'light', icon: <PhosphorIcons.Sun />, title: t('equipmentView.calculators.light.title'), description: t('equipmentView.calculators.light.description') },
        { id: 'nutrients', icon: <PhosphorIcons.Flask />, title: t('equipmentView.calculators.nutrients.title'), description: t('equipmentView.calculators.nutrients.description') },
        { id: 'yield', icon: <PhosphorIcons.Plant />, title: t('equipmentView.calculators.yield.title'), description: t('equipmentView.calculators.yield.description') }
    ];

    const activeCalcData = calculators.find(c => c.id === activeCalculator);
    
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <nav className="flex sm:flex-col gap-2 flex-shrink-0">
                    {calculators.map(calc => (
                        <button key={calc.id} onClick={() => setActiveCalculator(calc.id)} className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 w-full ${activeCalculator === calc.id ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            <div className="w-6 h-6">{calc.icon}</div>
                            <span className="hidden sm:inline font-semibold">{calc.title}</span>
                        </button>
                    ))}
                </nav>

                <div className="flex-grow bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 min-h-[300px]">
                    {activeCalcData && (
                        <div>
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-300">{activeCalcData.title}</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{activeCalcData.description}</p>
                        </div>
                    )}
                    
                    {activeCalculator === 'ventilation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="md:col-span-2 grid grid-cols-3 gap-2">
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.width')} value={ventilation.width} onChange={val => setVentilation(v => ({...v, width: val}))} unit="cm"/>
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.depth')} value={ventilation.depth} onChange={val => setVentilation(v => ({...v, depth: val}))} unit="cm"/>
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.height')} value={ventilation.height} onChange={val => setVentilation(v => ({...v, height: val}))} unit="cm"/>
                            </div>
                            <div className="md:col-span-2 mt-4 p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg text-center transition-all animate-fade-in">
                                <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">{t('equipmentView.calculators.ventilation.result')}</p>
                                <p className="text-4xl font-bold text-primary-600 dark:text-primary-300 tracking-tight">{ventilation.result > 0 ? ventilation.result : '--'}<span className="text-xl ml-2">m³/h</span></p>
                            </div>
                        </div>
                    )}
                    {activeCalculator === 'light' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="md:col-span-2 grid grid-cols-2 gap-2">
                                <CalculatorInput label={t('equipmentView.calculators.light.width')} value={light.width} onChange={val => setLight(l => ({...l, width: val}))} unit="cm"/>
                                <CalculatorInput label={t('equipmentView.calculators.light.depth')} value={light.depth} onChange={val => setLight(l => ({...l, depth: val}))} unit="cm"/>
                            </div>
                            <div className="md:col-span-2 mt-4 p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg text-center transition-all animate-fade-in">
                                <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">{t('equipmentView.calculators.light.result')}</p>
                                <p className="text-4xl font-bold text-primary-600 dark:text-primary-300 tracking-tight">{light.result > 0 ? light.result : '--'}<span className="text-xl ml-2">Watt</span></p>
                            </div>
                        </div>
                    )}
                    {activeCalculator === 'nutrients' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="md:col-span-2 grid grid-cols-2 gap-2">
                                <CalculatorInput label={t('equipmentView.calculators.nutrients.waterAmount')} value={nutrients.water} onChange={val => setNutrients(n => ({...n, water: val}))} unit="L"/>
                                <CalculatorInput label={t('equipmentView.calculators.nutrients.dose')} value={nutrients.dose} onChange={val => setNutrients(n => ({...n, dose: val}))} unit="ml/L"/>
                             </div>
                             <div className="md:col-span-2 mt-4 p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg text-center transition-all animate-fade-in">
                                <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">{t('equipmentView.calculators.nutrients.result')}</p>
                                <p className="text-4xl font-bold text-primary-600 dark:text-primary-300 tracking-tight">{nutrients.result >= 0 ? nutrients.result.toFixed(1) : '--'}<span className="text-xl ml-2">ml</span></p>
                            </div>
                        </div>
                    )}
                    {activeCalculator === 'yield' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="md:col-span-2 grid grid-cols-2 gap-2">
                                <CalculatorInput label={t('equipmentView.calculators.yield.area')} value={yieldEst.area} onChange={val => setYieldEst(y => ({...y, area: val}))} unit="m²"/>
                                <CalculatorInput label={t('equipmentView.calculators.yield.wattage')} value={yieldEst.wattage} onChange={val => setYieldEst(y => ({...y, wattage: val}))} unit="W"/>
                                 <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('equipmentView.calculators.yield.level')}</label>
                                    <select value={yieldEst.level} onChange={e => setYieldEst(y => ({...y, level: e.target.value}))} className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors">
                                        <option value="beginner">{t('equipmentView.calculators.yield.levels.beginner')}</option>
                                        <option value="advanced">{t('equipmentView.calculators.yield.levels.advanced')}</option>
                                        <option value="expert">{t('equipmentView.calculators.yield.levels.expert')}</option>
                                    </select>
                                </div>
                             </div>
                             <div className="md:col-span-2 mt-4 p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg text-center transition-all animate-fade-in">
                                <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">{t('equipmentView.calculators.yield.result')}</p>
                                <p className="text-4xl font-bold text-primary-600 dark:text-primary-300 tracking-tight">{yieldEst.result > 0 ? `~${yieldEst.result}` : '--'}<span className="text-xl ml-2">g</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};