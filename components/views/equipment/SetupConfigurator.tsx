import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { SkeletonLoader } from '../../common/SkeletonLoader';

type Step = 1 | 2 | 3 | 4; // 1: Area, 2: Style, 3: Budget, 4: Results
type Area = '60x60' | '80x80' | '100x100' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'Anfängerfreundlich' | 'Maximaler Ertrag' | 'Diskret';
type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';

interface RecommendationItem {
    name: string;
    watts?: number;
    price: number;
    category: RecommendationCategory;
}
type Recommendation = Record<RecommendationCategory, RecommendationItem>;

// Data for recommendations and costs
const baseRecommendations: Record<Area, Record<Budget, Recommendation>> = {
    // Basic setups for each size and budget. Style modifiers will be applied to these.
    '60x60': {
        low: { tent: {name: '60x60x160cm Growbox', price: 60, category: 'tent'}, light: { name: '100W LED Full Spectrum', watts: 100, price: 70, category: 'light' }, ventilation: { name: '150 m³/h Exhaust Kit', price: 80, category: 'ventilation' }, pots: { name: '2x 11L Fabric Pots', price: 15, category: 'pots' }, soil: { name: '25L Light-Mix Soil', price: 15, category: 'soil' }, nutrients: { name: 'Organic Starter Set', price: 20, category: 'nutrients' }, extra: { name: 'Timer, Thermo/Hygro', price: 20, category: 'extra' } },
        medium: { tent: {name: '60x60x180cm Brand Growbox', price: 90, category: 'tent'}, light: { name: '150W Dimmable LED', watts: 150, price: 120, category: 'light' }, ventilation: { name: '180 m³/h Exhaust Kit', price: 110, category: 'ventilation' }, pots: { name: '2x 11L Fabric Pots', price: 15, category: 'pots' }, soil: { name: '50L Quality Soil', price: 25, category: 'soil' }, nutrients: { name: 'Mineral Nutrient Set + Cal/Mag', price: 40, category: 'nutrients' }, extra: { name: 'Timer, pH Meter', price: 35, category: 'extra' } },
        high: { tent: {name: '60x60x180cm Premium Growbox', price: 150, category: 'tent'}, light: { name: '200W High-End LED', watts: 200, price: 250, category: 'light' }, ventilation: { name: 'EC Fan w/ Controller (~200 m³/h)', price: 200, category: 'ventilation' }, pots: { name: '2x 15L Air-Pots', price: 25, category: 'pots' }, soil: { name: '50L Coco Coir', price: 20, category: 'soil' }, nutrients: { name: 'Complete Coco Nutrient Line', price: 80, category: 'nutrients' }, extra: { name: 'Digital Controller, pH/EC Meter', price: 100, category: 'extra' } }
    },
    '80x80': {
        low: { tent: {name: '80x80x180cm Growbox', price: 80, category: 'tent'}, light: { name: '150W LED Full Spectrum', watts: 150, price: 100, category: 'light' }, ventilation: { name: '250 m³/h Exhaust Kit', price: 90, category: 'ventilation' }, pots: { name: '3x 11L Fabric Pots', price: 20, category: 'pots' }, soil: { name: '50L Light-Mix Soil', price: 25, category: 'soil' }, nutrients: { name: 'Organic Starter Set', price: 20, category: 'nutrients' }, extra: { name: 'Timer, Thermo/Hygro', price: 20, category: 'extra' } },
        medium: { tent: {name: '80x80x180cm Brand Growbox', price: 120, category: 'tent'}, light: { name: '250W Dimmable LED', watts: 250, price: 220, category: 'light' }, ventilation: { name: '350 m³/h Exhaust Kit', price: 130, category: 'ventilation' }, pots: { name: '3x 15L Fabric Pots', price: 25, category: 'pots' }, soil: { name: '75L Quality Soil', price: 35, category: 'soil' }, nutrients: { name: 'Mineral Nutrient Set + Root Stimulator', price: 50, category: 'nutrients' }, extra: { name: 'Timer, pH Meter, Clip Fan', price: 50, category: 'extra' } },
        high: { tent: {name: '80x80x200cm Premium Growbox', price: 180, category: 'tent'}, light: { name: '320W High-End LED', watts: 320, price: 350, category: 'light' }, ventilation: { name: 'EC Fan w/ Controller (~400 m³/h)', price: 250, category: 'ventilation' }, pots: { name: '3x 18L Air-Pots', price: 30, category: 'pots' }, soil: { name: '75L Coco Coir', price: 30, category: 'soil' }, nutrients: { name: 'Complete Nutrient Line (A+B, PK)', price: 100, category: 'nutrients' }, extra: { name: 'Digital Controller, pH/EC Meter, Fans', price: 120, category: 'extra' } }
    },
    '100x100': {
        low: { tent: {name: '100x100x200cm Growbox', price: 100, category: 'tent'}, light: { name: '250W LED Full Spectrum', watts: 250, price: 180, category: 'light' }, ventilation: { name: '350 m³/h Exhaust Kit', price: 130, category: 'ventilation' }, pots: { name: '4x 15L Fabric Pots', price: 30, category: 'pots' }, soil: { name: '75L Light-Mix Soil', price: 35, category: 'soil' }, nutrients: { name: 'Organic Starter Set', price: 20, category: 'nutrients' }, extra: { name: 'Timer, Thermo/Hygro, Fan', price: 40, category: 'extra' } },
        medium: { tent: {name: '100x100x200cm Brand Growbox', price: 150, category: 'tent'}, light: { name: '400W Dimmable LED', watts: 400, price: 350, category: 'light' }, ventilation: { name: '500 m³/h Exhaust Kit', price: 180, category: 'ventilation' }, pots: { name: '4x 18L Fabric Pots', price: 35, category: 'pots' }, soil: { name: '100L Quality Soil', price: 45, category: 'soil' }, nutrients: { name: 'Large Mineral Nutrient Set', price: 70, category: 'nutrients' }, extra: { name: 'Timer, pH/EC Meter, Fans', price: 80, category: 'extra' } },
        high: { tent: {name: '100x100x200cm Premium Growbox', price: 220, category: 'tent'}, light: { name: '500W High-End LED Bar System', watts: 500, price: 550, category: 'light' }, ventilation: { name: 'EC Fan w/ Controller (~600 m³/h)', price: 300, category: 'ventilation' }, pots: { name: '4x 20L Air-Pots', price: 40, category: 'pots' }, soil: { name: '100L Coco Coir', price: 40, category: 'soil' }, nutrients: { name: 'Full Professional Nutrient Line', price: 150, category: 'nutrients' }, extra: { name: 'Digital Controller, Humidifier', price: 150, category: 'extra' } }
    },
    '120x120': {
        low: { tent: {name: '120x120x200cm Growbox', price: 120, category: 'tent'}, light: { name: '400W LED Full Spectrum', watts: 400, price: 280, category: 'light' }, ventilation: { name: '500 m³/h Exhaust Kit', price: 180, category: 'ventilation' }, pots: { name: '4x 18L Fabric Pots', price: 35, category: 'pots' }, soil: { name: '100L Light-Mix Soil', price: 45, category: 'soil' }, nutrients: { name: 'Organic Starter Set', price: 20, category: 'nutrients' }, extra: { name: 'Timer, Thermo/Hygro, Fan', price: 40, category: 'extra' } },
        medium: { tent: {name: '120x120x200cm Brand Growbox', price: 180, category: 'tent'}, light: { name: '600W Dimmable LED', watts: 600, price: 500, category: 'light' }, ventilation: { name: '800 m³/h Exhaust Kit', price: 250, category: 'ventilation' }, pots: { name: '5x 20L Fabric Pots', price: 45, category: 'pots' }, soil: { name: '150L Quality Soil', price: 60, category: 'soil' }, nutrients: { name: 'Large Mineral Nutrient Set', price: 70, category: 'nutrients' }, extra: { name: 'Timer, pH/EC Meter, Fans', price: 80, category: 'extra' } },
        high: { tent: {name: '120x120x220cm Premium Growbox', price: 280, category: 'tent'}, light: { name: '720W High-End LED Bar System', watts: 720, price: 800, category: 'light' }, ventilation: { name: 'EC Fan w/ Controller (~1000 m³/h)', price: 400, category: 'ventilation' }, pots: { name: '5x 25L Air-Pots', price: 50, category: 'pots' }, soil: { name: '150L Coco Coir', price: 50, category: 'soil' }, nutrients: { name: 'Full Professional Nutrient Line', price: 150, category: 'nutrients' }, extra: { name: 'Digital Controller, Humidifier, Fan', price: 180, category: 'extra' } }
    },
};

const styleModifiers: Record<GrowStyle, Partial<Record<Budget, Partial<Recommendation>>>> = {
    'Anfängerfreundlich': {
        low: { nutrients: { name: 'Bio-Tabs Starterkit', price: 25, category: 'nutrients' } },
        medium: { nutrients: { name: 'BioBizz Starter-Pack', price: 30, category: 'nutrients' } },
    },
    'Maximaler Ertrag': {
        medium: { light: { name: '320W High-End LED', watts: 320, price: 350, category: 'light' } }, // Example for 80x80
        high: { soil: { name: '150L Coco Coir + Perlite', price: 55, category: 'soil' }, nutrients: { name: 'Advanced Nutrients Pro Line', price: 200, category: 'nutrients' } }
    },
    'Diskret': {
        low: { ventilation: { name: '180 m³/h Silent Exhaust Kit', price: 120, category: 'ventilation' } },
        medium: { ventilation: { name: '350 m³/h Silent Exhaust Kit', price: 160, category: 'ventilation' } },
        high: { ventilation: { name: 'EC Fan w/ Silencer (~400 m³/h)', price: 300, category: 'ventilation' } }
    }
};

const getFinalRecommendation = (area: Area, budget: Budget, growStyle: GrowStyle): Recommendation => {
    const baseRec = { ...baseRecommendations[area][budget] };
    const modifier = styleModifiers[growStyle]?.[budget];
    if (modifier) {
        return { ...baseRec, ...modifier };
    }
    return baseRec;
};

export const SetupConfigurator: React.FC = () => {
    const [step, setStep] = useState<Step>(1);
    const [area, setArea] = useState<Area>('80x80');
    const [budget, setBudget] = useState<Budget>('medium');
    const [growStyle, setGrowStyle] = useState<GrowStyle>('Anfängerfreundlich');
    
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = () => {
        setIsLoading(true);
        setStep(4);
        setRecommendation(null);
        
        setTimeout(() => {
            const rec = getFinalRecommendation(area, budget, growStyle);
            setRecommendation(rec);
            setIsLoading(false);
        }, 300);
    };
    
    const startOver = () => {
        setStep(1);
        setRecommendation(null);
    };

    const costBreakdown = useMemo(() => {
        if (!recommendation) return null;
        const breakdown: { category: RecommendationCategory; price: number }[] = [];
        let total = 0;
        for (const key in recommendation) {
            const item = recommendation[key as RecommendationCategory];
            breakdown.push({ category: item.category, price: item.price });
            total += item.price;
        }
        return { breakdown, total };
    }, [recommendation]);
    
    const gearIcons: Record<RecommendationCategory, React.ReactNode> = {
        tent: <PhosphorIcons.Cube />, light: <PhosphorIcons.LightbulbFilament />, ventilation: <PhosphorIcons.Fan />,
        pots: <PhosphorIcons.Plant />, soil: <PhosphorIcons.Drop />, nutrients: <PhosphorIcons.Flask />, extra: <PhosphorIcons.Wrench />,
    };

    const categoryLabels: Record<RecommendationCategory, string> = {
        tent: 'Growbox (Zelt)', light: 'Beleuchtung', ventilation: 'Abluftsystem', pots: 'Töpfe',
        soil: 'Erde & Substrat', nutrients: 'Dünger', extra: 'Zubehör'
    };

    return (
        <Card>
            {step < 4 && (
                 <>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Setup Konfigurator</h2>
                            <p className="text-slate-600 dark:text-slate-400">Finde die passende Ausrüstung in 3 einfachen Schritten.</p>
                        </div>
                        <span className="font-bold text-slate-400">{`Schritt ${step}/3`}</span>
                    </div>
                     <div className="relative h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full my-6">
                        <div className="absolute h-1 bg-primary-500 rounded-full transition-all duration-300" style={{width: `${(step-1)/3 * 100}%`}}></div>
                    </div>
                    
                    {step === 1 && (
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Wähle deine Anbaufläche</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(['60x60', '80x80', '100x100', '120x120'] as Area[]).map(val => 
                                    <button key={val} onClick={() => setArea(val)} className={`p-4 text-center rounded-lg border-2 transition-colors ${area === val ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-400'}`}>
                                        <PhosphorIcons.Cube className="w-8 h-8 mx-auto mb-1 text-primary-500"/>
                                        <span className="font-bold">{val} cm</span>
                                    </button>
                                )}
                             </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Wähle deinen Grow-Stil</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(['Anfängerfreundlich', 'Maximaler Ertrag', 'Diskret'] as GrowStyle[]).map(val => 
                                    <button key={val} onClick={() => setGrowStyle(val)} className={`p-4 text-center rounded-lg border-2 transition-colors ${growStyle === val ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-400'}`}>
                                        <span className="font-bold">{val}</span>
                                        <p className="text-xs text-slate-500 mt-1">{val === 'Anfängerfreundlich' ? 'Einfach zu bedienende und fehlerverzeihende Komponenten.' : val === 'Maximaler Ertrag' ? 'Fokus auf Leistung und hohe Ernteergebnisse.' : 'Leise und unauffällige Komponenten für einen Stealth-Grow.'}</p>
                                    </button>
                                )}
                             </div>
                        </div>
                    )}
                    {step === 3 && (
                         <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">Wähle dein Budget</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(['low', 'medium', 'high'] as Budget[]).map(val => 
                                    <button key={val} onClick={() => setBudget(val)} className={`p-4 text-center rounded-lg border-2 transition-colors ${budget === val ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-400'}`}>
                                        <span className="font-bold">{val === 'low' ? 'Niedrig' : val === 'medium' ? 'Mittel' : 'Hoch'}</span>
                                         <p className="text-xs text-slate-500 mt-1">{val === 'low' ? 'Grundausstattung für den Start.' : val === 'medium' ? 'Gute Balance aus Preis und Leistung.' : 'Premium-Komponenten für optimale Kontrolle.'}</p>
                                    </button>
                                )}
                             </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        <Button variant="secondary" onClick={() => setStep(prev => Math.max(1, prev-1) as Step)} disabled={step === 1}>Zurück</Button>
                        {step < 3 ? (
                             <Button onClick={() => setStep(prev => Math.min(3, prev+1) as Step)}>Nächster Schritt</Button>
                        ) : (
                             <Button onClick={handleGenerate}><PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />Setup generieren</Button>
                        )}
                    </div>
                 </>
            )}
            
            {(step === 4) && (
                <>
                    {isLoading ? (
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700"><SkeletonLoader count={5}/></div>
                    ) : recommendation && costBreakdown && (
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-center">Deine persönliche Setup-Empfehlung</h3>
                                 <Button onClick={startOver} variant="secondary" size="sm"><PhosphorIcons.ArrowClockwise className="inline w-4 h-4 mr-1.5"/>Neu starten</Button>
                            </div>
                            
                            <Card className="bg-primary-50 dark:bg-primary-900/20">
                                <p className="prose prose-sm dark:prose-invert max-w-none text-center">
                                    {`Für deine ${area}cm Fläche, mit einem ${budget === 'low' ? 'niedrigen' : budget === 'medium' ? 'mittleren' : 'hohen'} Budget und dem Stil "${growStyle}", ist dies eine empfohlene Konfiguration.`}
                                </p>
                            </Card>

                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    {(Object.keys(recommendation) as RecommendationCategory[]).map(key => {
                                        const item = recommendation[key];
                                        return (
                                            <Card key={key} className="flex items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="text-primary-500 mt-1 w-8 h-8 flex-shrink-0">{gearIcons[key]}</div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{categoryLabels[key]}</h4>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.name}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                                <div className="space-y-6">
                                    <Card>
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3"><PhosphorIcons.Stack/>Kostenaufschlüsselung</h4>
                                        <div className="space-y-1 text-sm">
                                            {costBreakdown.breakdown.map(item => (
                                                <div key={item.category} className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-300">{categoryLabels[item.category]}</span>
                                                    <span>{item.price} €</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                                                <span>Total</span>
                                                <span>≈ {costBreakdown.total} €</span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                             </div>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};