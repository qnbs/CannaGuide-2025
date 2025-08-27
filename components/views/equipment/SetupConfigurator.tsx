import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { geminiService } from '../../../services/geminiService';

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
    rationale: string;
}
type Recommendation = Record<RecommendationCategory, RecommendationItem>;

const RationaleModal: React.FC<{ content: { title: string, content: string }, onClose: () => void }> = ({ content, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-primary-500 mb-4">{content.title}</h3>
            <p className="text-slate-600 dark:text-slate-300">{content.content}</p>
            <div className="text-right mt-6">
                <Button onClick={onClose}>Schließen</Button>
            </div>
        </Card>
    </div>
);

export const SetupConfigurator: React.FC = () => {
    const [step, setStep] = useState<Step>(1);
    const [area, setArea] = useState<Area>('80x80');
    const [budget, setBudget] = useState<Budget>('medium');
    const [growStyle, setGrowStyle] = useState<GrowStyle>('Anfängerfreundlich');
    
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rationaleModalContent, setRationaleModalContent] = useState<{title: string, content: string} | null>(null);


    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        setStep(4);
        
        try {
            const result = await geminiService.getSetupRecommendation(area, growStyle, budget);
            if (result) {
                const transformed: Recommendation = (Object.keys(result) as RecommendationCategory[]).reduce((acc, key) => {
                    acc[key] = {
                        ...result[key],
                        category: key,
                    };
                    return acc;
                }, {} as Recommendation);
                setRecommendation(transformed);
            } else {
                setError("Die KI konnte keine Empfehlung generieren. Bitte versuche es später erneut.");
            }
        } catch (e) {
            console.error(e);
            setError("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const startOver = () => {
        setStep(1);
        setRecommendation(null);
        setError(null);
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
                        <div className="absolute h-1 bg-primary-500 rounded-full transition-all duration-300" style={{width: `${(step/3) * 100}%`}}></div>
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
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-center">Deine persönliche Setup-Empfehlung</h3>
                            <Button onClick={startOver} variant="secondary" size="sm"><PhosphorIcons.ArrowClockwise className="inline w-4 h-4 mr-1.5"/>Neu starten</Button>
                    </div>
                    {isLoading ? (
                        <SkeletonLoader count={7}/>
                    ) : error ? (
                        <Card className="text-center bg-red-50 dark:bg-red-900/20 border-red-500/50">
                            <h4 className="font-bold text-red-700 dark:text-red-300">Fehler</h4>
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </Card>
                    ) : recommendation && costBreakdown && (
                       <>
                            <Card className="bg-primary-50 dark:bg-primary-900/20">
                                <p className="prose prose-sm dark:prose-invert max-w-none text-center">
                                    {`Für deine ${area}cm Fläche, mit einem ${budget === 'low' ? 'niedrigen' : budget === 'medium' ? 'mittleren' : 'hohen'} Budget und dem Stil "${growStyle}", ist dies eine von der KI generierte Konfiguration.`}
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
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-bold">{item.price} €</p>
                                                    <Button variant="secondary" size="sm" className="mt-1 !shadow-none !bg-slate-200/50 dark:!bg-slate-700/50" onClick={() => setRationaleModalContent({title: `Warum ${categoryLabels[key]}?`, content: item.rationale})}>
                                                        Warum?
                                                    </Button>
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
                        </>
                    )}
                </div>
            )}
            {rationaleModalContent && <RationaleModal content={rationaleModalContent} onClose={() => setRationaleModalContent(null)} />}
        </Card>
    );
};