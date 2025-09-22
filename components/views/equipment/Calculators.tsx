import React, { useState, useEffect, useId, useMemo } from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';

type CalculatorType = 'ventilation' | 'light' | 'cost' | 'nutrients' | 'converter' | 'yield';

const CalculatorInput: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    unit?: string;
    tooltip?: string;
    step?: string;
}> = ({ label, value, onChange, unit, tooltip, step }) => {
    const id = useId();
    return (
        <div className="relative">
            <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 mb-1">
                {label}
                {tooltip && (
                    <span className="group relative cursor-help">
                        <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {tooltip}
                        </span>
                    </span>
                )}
            </label>
            <input
                id={id}
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                min="0"
                step={step || "any"}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-3 pr-10 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
            />
            {unit && <span className="absolute right-3 top-9 text-xs text-slate-400">{unit}</span>}
        </div>
    );
};

const CalculatorSelect: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    tooltip?: string;
}> = ({ label, value, onChange, options, tooltip }) => {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 mb-1">
                {label}
                {tooltip && (
                    <span className="group relative cursor-help">
                        <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {tooltip}
                        </span>
                    </span>
                )}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
};

const ResultCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="md:col-span-2 mt-4 p-4 bg-primary-900/50 rounded-lg text-center transition-all animate-fade-in">
        {children}
    </div>
);

const ResultDisplay: React.FC<{ label: string, value: string | number, unit?: string, sub?: string, tooltip?: string }> = ({ label, value, unit, sub, tooltip }) => (
    <div>
        <p className="text-sm font-semibold text-primary-200 flex items-center justify-center gap-1">
            {label}
            {tooltip && (
                 <span className="group relative cursor-help">
                    <PhosphorIcons.Question className="w-4 h-4 text-primary-300/70" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tooltip}
                    </span>
                </span>
            )}
        </p>
        <p className="text-4xl font-bold text-primary-300 tracking-tight">
            {value}
            {unit && <span className="text-xl ml-2">{unit}</span>}
        </p>
        {sub && <p className="text-xs text-primary-400 -mt-1">{sub}</p>}
    </div>
);

export const Calculators: React.FC = () => {
    const { t } = useTranslations();
    const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('ventilation');

    // State for all calculators
    const [ventilation, setVentilation] = useState({ w: '100', d: '100', h: '200', watts: '300', filter: 'yes' });
    const [light, setLight] = useState({ w: '100', d: '100', stage: 'flowering' });
    const [cost, setCost] = useState({ lightW: '300', lightH: '12', fanW: '40', fanH: '24', otherW: '20', otherH: '24', cost: '0.30' });
    const [nutrients, setNutrients] = useState({ size: '10', parts: [{ dose: '2' }, { dose: '1' }, { dose: '1.5' }]});
    const [converter, setConverter] = useState({ ec: '1.2', ppm500: '600', ppm700: '840' });
    const [yieldEst, setYieldEst] = useState({ watts: '300', skill: 'advanced', training: 'lst', genetics: 'medium' });

    // --- Calculation Logic ---
    const ventilationResult = useMemo(() => {
        const w = parseFloat(ventilation.w) / 100;
        const d = parseFloat(ventilation.d) / 100;
        const h = parseFloat(ventilation.h) / 100;
        const watts = parseFloat(ventilation.watts);
        if (!(w > 0 && d > 0 && h > 0 && watts >= 0)) return 0;
        const volume = w * d * h;
        const baseAirflow = volume * 60; // 60 exchanges/hr
        const heatAdjustment = 1 + (watts / 1000) * 0.2; // 20% increase per 1kW for heat
        const filterAdjustment = ventilation.filter === 'yes' ? 1.25 : 1; // 25% increase for filter
        return Math.round(baseAirflow * heatAdjustment * filterAdjustment);
    }, [ventilation]);

    const lightResult = useMemo(() => {
        const w = parseFloat(light.w) / 100;
        const d = parseFloat(light.d) / 100;
        if (!(w > 0 && d > 0)) return { wattage: '--', ppfd: '--', dli: '--' };
        const area = w * d;
        const ppfdTargets = { seedling: [200, 400], vegetative: [400, 600], flowering: [600, 1000] };
        const target = ppfdTargets[light.stage as keyof typeof ppfdTargets];
        const ledEfficiency = 2.5; // µmol/J
        const requiredWatts = [Math.round((target[0] * area) / ledEfficiency), Math.round((target[1] * area) / ledEfficiency)];
        const lightHours = light.stage === 'flowering' ? 12 : 18;
        const avgPPFD = (target[0] + target[1]) / 2;
        const dli = (avgPPFD * lightHours * 3600) / 1000000;
        return { wattage: `${requiredWatts[0]}-${requiredWatts[1]}`, ppfd: `${target[0]}-${target[1]}`, dli: dli.toFixed(1) };
    }, [light]);

    const costResult = useMemo(() => {
        const p = (str: string) => parseFloat(str) || 0;
        const dailyKwh = (p(cost.lightW) * p(cost.lightH) + p(cost.fanW) * p(cost.fanH) + p(cost.otherW) * p(cost.otherH)) / 1000;
        const daily = dailyKwh * p(cost.cost);
        return { daily: daily.toFixed(2), weekly: (daily * 7).toFixed(2), monthly: (daily * 30.4).toFixed(2), cycle: (daily * 90).toFixed(2) };
    }, [cost]);
    
    const nutrientResults = useMemo(() => {
        const size = parseFloat(nutrients.size) || 0;
        return nutrients.parts.map(part => (size * (parseFloat(part.dose) || 0)).toFixed(1));
    }, [nutrients]);

    useEffect(() => {
        const ec = parseFloat(converter.ec);
        if (!isNaN(ec)) {
            setConverter(c => ({...c, ppm500: (ec * 500).toFixed(0), ppm700: (ec * 700).toFixed(0)}));
        }
    }, [converter.ec]);

    const yieldResult = useMemo(() => {
        const watts = parseFloat(yieldEst.watts);
        if (!(watts > 0)) return { range: '--', gpw: '--'};
        const skillMod = { beginner: 0.7, advanced: 1.0, expert: 1.3 };
        const trainingMod = { none: 1.0, lst: 1.15, scrog: 1.25 };
        const geneticsMod = { low: 0.8, medium: 1.0, high: 1.2 };
        const base = watts * 0.8;
        const final = base * skillMod[yieldEst.skill as keyof typeof skillMod] * trainingMod[yieldEst.training as keyof typeof trainingMod] * geneticsMod[yieldEst.genetics as keyof typeof geneticsMod];
        return { range: `${Math.round(final * 0.8)}-${Math.round(final * 1.2)}`, gpw: (final / watts).toFixed(2) };
    }, [yieldEst]);
    
    const calculators: { id: CalculatorType; icon: React.ReactNode; title: string; description: string }[] = [
        { id: 'ventilation', icon: <PhosphorIcons.Fan />, title: t('equipmentView.calculators.ventilation.title'), description: t('equipmentView.calculators.ventilation.description') },
        { id: 'light', icon: <PhosphorIcons.Sun />, title: t('equipmentView.calculators.light.title'), description: t('equipmentView.calculators.light.description') },
        { id: 'cost', icon: <PhosphorIcons.Calculator />, title: t('equipmentView.calculators.cost.title'), description: t('equipmentView.calculators.cost.description') },
        { id: 'nutrients', icon: <PhosphorIcons.Flask />, title: t('equipmentView.calculators.nutrients.title'), description: t('equipmentView.calculators.nutrients.description') },
        { id: 'converter', icon: <PhosphorIcons.ArrowClockwise />, title: t('equipmentView.calculators.converter.title'), description: t('equipmentView.calculators.converter.description') },
        { id: 'yield', icon: <PhosphorIcons.Plant />, title: t('equipmentView.calculators.yield.title'), description: t('equipmentView.calculators.yield.description') }
    ];

    const activeCalcData = calculators.find(c => c.id === activeCalculator);
    
    return (
        <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <nav className="flex sm:flex-col gap-2 flex-shrink-0">
                    {calculators.map(calc => (
                        <button key={calc.id} onClick={() => setActiveCalculator(calc.id)} className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 w-full ${activeCalculator === calc.id ? 'bg-primary-500 text-on-accent font-bold shadow-md' : 'bg-slate-900 text-slate-100 hover:bg-slate-700'}`}>
                            <div className="w-6 h-6">{calc.icon}</div>
                            <span className="hidden sm:inline font-semibold">{calc.title}</span>
                        </button>
                    ))}
                </nav>

                <div className="flex-grow bg-slate-900 rounded-lg p-6 min-h-[300px]">
                    {activeCalcData && (
                        <div>
                            <h2 className="text-2xl font-bold font-display text-primary-400">{activeCalcData.title}</h2>
                            <p className="text-slate-300 mb-6 text-sm">{activeCalcData.description}</p>
                        </div>
                    )}
                    
                    {activeCalculator === 'ventilation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.width')} value={ventilation.w} onChange={val => setVentilation(v => ({...v, w: val}))} unit={t('common.units.cm')}/>
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.depth')} value={ventilation.d} onChange={val => setVentilation(v => ({...v, d: val}))} unit={t('common.units.cm')}/>
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.height')} value={ventilation.h} onChange={val => setVentilation(v => ({...v, h: val}))} unit={t('common.units.cm')}/>
                                <CalculatorInput label={t('equipmentView.calculators.ventilation.lightWattage')} value={ventilation.watts} onChange={val => setVentilation(v => ({...v, watts: val}))} unit={t('common.units.watt')} tooltip={t('equipmentView.calculators.ventilation.lightWattageTooltip')} />
                                <CalculatorSelect label={t('equipmentView.calculators.ventilation.carbonFilter')} value={ventilation.filter} onChange={val => setVentilation(v => ({...v, filter: val}))} options={[{value: 'yes', label: t('equipmentView.calculators.yes')}, {value: 'no', label: t('equipmentView.calculators.no')}]} tooltip={t('equipmentView.calculators.ventilation.carbonFilterTooltip')} />
                            </div>
                            <ResultCard><ResultDisplay label={t('equipmentView.calculators.ventilation.result')} value={ventilationResult || '--'} unit={t('common.units.m3_h')}/></ResultCard>
                        </div>
                    )}

                    {activeCalculator === 'light' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                <CalculatorInput label={t('equipmentView.calculators.light.width')} value={light.w} onChange={val => setLight(l => ({...l, w: val}))} unit={t('common.units.cm')}/>
                                <CalculatorInput label={t('equipmentView.calculators.light.depth')} value={light.d} onChange={val => setLight(l => ({...l, d: val}))} unit={t('common.units.cm')}/>
                                <CalculatorSelect label={t('equipmentView.calculators.light.stage')} value={light.stage} onChange={val => setLight(l => ({...l, stage: val}))} options={[{value: 'seedling', label: t('plantStages.SEEDLING')}, {value: 'vegetative', label: t('plantStages.VEGETATIVE')}, {value: 'flowering', label: t('plantStages.FLOWERING')}]} />
                            </div>
                            <ResultCard>
                                <div className="grid grid-cols-3 gap-2 divide-x divide-primary-500/30">
                                    <ResultDisplay label={t('equipmentView.calculators.light.result')} value={lightResult.wattage} unit={t('common.units.watt')}/>
                                    <ResultDisplay label="PPFD" value={lightResult.ppfd} unit="µmol/m²/s" tooltip={t('equipmentView.calculators.light.ppfdTooltip')} />
                                    <ResultDisplay label="DLI" value={lightResult.dli} unit="mol/m²/day" tooltip={t('equipmentView.calculators.light.dliTooltip')} />
                                </div>
                            </ResultCard>
                        </div>
                    )}
                    
                    {activeCalculator === 'cost' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                <CalculatorInput label={t('equipmentView.calculators.cost.lightPower')} value={cost.lightW} onChange={val => setCost(c=>({...c, lightW: val}))} unit={t('common.units.watt')}/>
                                <CalculatorInput label={t('equipmentView.calculators.cost.lightHours')} value={cost.lightH} onChange={val => setCost(c=>({...c, lightH: val}))} unit={t('common.units.h_day')}/>
                                <CalculatorInput label={t('equipmentView.calculators.cost.fanPower')} value={cost.fanW} onChange={val => setCost(c=>({...c, fanW: val}))} unit={t('common.units.watt')}/>
                                <CalculatorInput label={t('equipmentView.calculators.cost.fanHours')} value={cost.fanH} onChange={val => setCost(c=>({...c, fanH: val}))} unit={t('common.units.h_day')}/>
                                <CalculatorInput label={t('equipmentView.calculators.cost.otherPower')} value={cost.otherW} onChange={val => setCost(c=>({...c, otherW: val}))} unit={t('common.units.watt')}/>
                                <CalculatorInput label={t('equipmentView.calculators.cost.price')} value={cost.cost} onChange={val => setCost(c=>({...c, cost: val}))} unit={t('common.units.price_kwh')} step="0.01" />
                            </div>
                             <ResultCard>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 divide-x divide-primary-500/30">
                                    <ResultDisplay label={t('equipmentView.calculators.cost.daily')} value={costResult.daily} unit={t('common.units.currency_eur')} />
                                    <ResultDisplay label={t('equipmentView.calculators.cost.weekly')} value={costResult.weekly} unit={t('common.units.currency_eur')} />
                                    <ResultDisplay label={t('equipmentView.calculators.cost.monthly')} value={costResult.monthly} unit={t('common.units.currency_eur')} />
                                    <ResultDisplay label={t('equipmentView.calculators.cost.cycle')} value={costResult.cycle} unit={t('common.units.currency_eur')} sub={t('equipmentView.calculators.cost.cycleSub')} />
                                </div>
                             </ResultCard>
                        </div>
                    )}

                    {activeCalculator === 'nutrients' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-4">
                               <CalculatorInput label={t('equipmentView.calculators.nutrients.reservoir')} value={nutrients.size} onChange={val => setNutrients(n => ({...n, size: val}))} unit={t('common.units.L')}/>
                               {nutrients.parts.map((part, index) => (
                                   <CalculatorInput 
                                       key={index}
                                       label={`${t('equipmentView.calculators.nutrients.component')} ${index + 1}`} 
                                       value={part.dose}
                                       onChange={val => {
                                           const newParts = [...nutrients.parts];
                                           newParts[index].dose = val;
                                           setNutrients(n => ({...n, parts: newParts}));
                                       }}
                                       unit={t('common.units.ml_l')}
                                   />
                               ))}
                            </div>
                            <ResultCard>
                                <div className="space-y-2">
                                    {nutrientResults.map((res, index) => (
                                        <ResultDisplay key={index} label={`${t('equipmentView.calculators.nutrients.totalFor')} ${index + 1}`} value={res} unit={t('common.units.ml')}/>
                                    ))}
                                </div>
                            </ResultCard>
                        </div>
                    )}
                    
                    {activeCalculator === 'converter' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                             <div className="space-y-4">
                                <CalculatorInput label="EC" value={converter.ec} onChange={val => setConverter(c => ({...c, ec: val}))} unit={t('common.units.ms_cm')} step="0.1" />
                                <CalculatorInput label="PPM (500 scale)" value={converter.ppm500} onChange={val => setConverter({ec: (parseFloat(val)/500).toFixed(2), ppm500: val, ppm700: ((parseFloat(val)/500)*700).toFixed(0)})} unit={t('common.units.ppm')} />
                                <CalculatorInput label="PPM (700 scale)" value={converter.ppm700} onChange={val => setConverter({ec: (parseFloat(val)/700).toFixed(2), ppm500: ((parseFloat(val)/700)*500).toFixed(0), ppm700: val})} unit={t('common.units.ppm')} />
                            </div>
                            <ResultCard>
                                <p className="text-sm text-primary-200">{t('equipmentView.calculators.converter.resultInfo')}</p>
                            </ResultCard>
                        </div>
                    )}

                    {activeCalculator === 'yield' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-2 gap-4">
                                <CalculatorInput label={t('equipmentView.calculators.yield.wattage')} value={yieldEst.watts} onChange={val => setYieldEst(y => ({...y, watts: val}))} unit={t('common.units.watt')}/>
                                <CalculatorSelect label={t('equipmentView.calculators.yield.level')} value={yieldEst.skill} onChange={val => setYieldEst(y => ({...y, skill: val}))} options={[{value: 'beginner', label: t('equipmentView.calculators.yield.levels.beginner')}, {value: 'advanced', label: t('equipmentView.calculators.yield.levels.advanced')}, {value: 'expert', label: t('equipmentView.calculators.yield.levels.expert')}]} />
                                <CalculatorSelect label={t('equipmentView.calculators.yield.training')} value={yieldEst.training} onChange={val => setYieldEst(y => ({...y, training: val}))} options={[{value: 'none', label: t('equipmentView.calculators.yield.trainings.none')}, {value: 'lst', label: t('equipmentView.calculators.yield.trainings.lst')}, {value: 'scrog', label: t('equipmentView.calculators.yield.trainings.scrog')}]} />
                                <CalculatorSelect label={t('common.genetics')} value={yieldEst.genetics} onChange={val => setYieldEst(y => ({...y, genetics: val}))} options={[{value: 'low', label: t('strainsView.addStrainModal.yields.low')}, {value: 'medium', label: t('strainsView.addStrainModal.yields.medium')}, {value: 'high', label: t('strainsView.addStrainModal.yields.high')}]} />
                            </div>
                            <ResultCard>
                                <div className="grid grid-cols-2 gap-2 divide-x divide-primary-500/30">
                                    <ResultDisplay label={t('equipmentView.calculators.yield.result')} value={yieldResult.range} unit={t('common.units.g')} />
                                    <ResultDisplay label={t('equipmentView.calculators.yield.efficiency')} value={yieldResult.gpw} unit={t('common.units.g_w')} />
                                </div>
                            </ResultCard>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};