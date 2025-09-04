import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { SkeletonLoader } from '../../common/SkeletonLoader';
import { geminiService } from '../../../services/geminiService';
import { useTranslations } from '../../../hooks/useTranslations';

type Step = 1 | 2 | 3 | 4; // 1: Area, 2: Style, 3: Budget, 4: Results
type Area = '60x60' | '80x80' | '100x100' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'yield' | 'stealth';
type RecommendationCategory = 'tent' | 'light' | 'ventilation' | 'pots' | 'soil' | 'nutrients' | 'extra';

interface RecommendationItem {
    name: string;
    watts?: number;
    price: number;
    category: RecommendationCategory;
    rationale: string;
}
type Recommendation = Record<RecommendationCategory, RecommendationItem>;

const RationaleModal: React.FC<{ content: { title: string, content: string }, onClose: () => void }> = ({ content, onClose }) => {
    const { t } = useTranslations();
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-primary-500 mb-4">{content.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{content.content}</p>
                <div className="text-right mt-6">
                    <Button onClick={onClose}>{t('common.close')}</Button>
                </div>
            </Card>
        </div>
    );
};

export const SetupConfigurator: React.FC = () => {
    const { t, locale } = useTranslations();
    const [step, setStep] = useState<Step>(1);
    const [area, setArea] = useState<Area>('80x80');
    const [budget, setBudget] = useState<Budget>('medium');
    const [growStyle, setGrowStyle] = useState<GrowStyle>('beginner');
    
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
            const result = await geminiService.getSetupRecommendation(area, t(`equipmentView.configurator.styles.${growStyle}`), t(`equipmentView.configurator.budgets.${budget}`), locale);
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
                setError(t('equipmentView.configurator.error'));
            }
        } catch (e) {
            console.error(e);
            setError(t('equipmentView.configurator.errorNetwork'));
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
        tent: t('equipmentView.configurator.categories.tent'),
        light: t('equipmentView.configurator.categories.light'),
        ventilation: t('equipmentView.configurator.categories.ventilation'),
        pots: t('equipmentView.configurator.categories.pots'),
        soil: t('equipmentView.configurator.categories.soil'),
        nutrients: t('equipmentView.configurator.categories.nutrients'),
        extra: t('equipmentView.configurator.categories.extra')
    };

    return (
        <Card>
            {step < 4 && (
                 <>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{t('equipmentView.configurator.title')}</h2>
                            <p className="text-slate-600 dark:text-slate-400">{t('equipmentView.configurator.subtitle')}</p>
                        </div>
                        <span className="font-bold text-slate-400">{t('equipmentView.configurator.step', { current: step, total: 3 })}</span>
                    </div>
                     <div className="relative h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full my-6">
                        <div className="absolute h-1 bg-primary-500 rounded-full transition-all duration-300" style={{width: `${(step/3) * 100}%`}}></div>
                    </div>
                    
                    {step === 1 && (
                        <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('equipmentView.configurator.step1Title')}</h3>
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
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('equipmentView.configurator.step2Title')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(['beginner', 'yield', 'stealth'] as GrowStyle[]).map(val => 
                                    <button key={val} onClick={() => setGrowStyle(val)} className={`p-4 text-center rounded-lg border-2 transition-colors ${growStyle === val ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-400'}`}>
                                        <span className="font-bold">{t(`equipmentView.configurator.styles.${val}`)}</span>
                                        <p className="text-xs text-slate-500 mt-1">{t(`equipmentView.configurator.styleDescriptions.${val}`)}</p>
                                    </button>
                                )}
                             </div>
                        </div>
                    )}
                    {step === 3 && (
                         <div>
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('equipmentView.configurator.step3Title')}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {(['low', 'medium', 'high'] as Budget[]).map(val => 
                                    <button key={val} onClick={() => setBudget(val)} className={`p-4 text-center rounded-lg border-2 transition-colors ${budget === val ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-slate-400'}`}>
                                        <span className="font-bold">{t(`equipmentView.configurator.budgets.${val}`)}</span>
                                         <p className="text-xs text-slate-500 mt-1">{t(`equipmentView.configurator.budgetDescriptions.${val}`)}</p>
                                    </button>
                                )}
                             </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        <Button variant="secondary" onClick={() => setStep(prev => Math.max(1, prev-1) as Step)} disabled={step === 1}>{t('common.back')}</Button>
                        {step < 3 ? (
                             <Button onClick={() => setStep(prev => Math.min(3, prev+1) as Step)}>{t('common.next')}</Button>
                        ) : (
                             <Button onClick={handleGenerate}><PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />{t('equipmentView.configurator.generate')}</Button>
                        )}
                    </div>
                 </>
            )}
            
            {(step === 4) && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-center">{t('equipmentView.configurator.resultsTitle')}</h3>
                            <Button onClick={startOver} variant="secondary" size="sm"><PhosphorIcons.ArrowClockwise className="inline w-4 h-4 mr-1.5"/>{t('equipmentView.configurator.startOver')}</Button>
                    </div>
                    {isLoading ? (
                        <SkeletonLoader count={7}/>
                    ) : error ? (
                        <Card className="text-center bg-red-50 dark:bg-red-900/20 border-red-500/50">
                            <h4 className="font-bold text-red-700 dark:text-red-300">{t('common.error')}</h4>
                            <p className="text-red-600 dark:text-red-400">{error}</p>
                        </Card>
                    ) : recommendation && costBreakdown && (
                       <>
                            <Card className="bg-primary-50 dark:bg-primary-900/20">
                                <p className="prose prose-sm dark:prose-invert max-w-none text-center">
                                    {t('equipmentView.configurator.resultsSubtitle', {area, budget: t(`equipmentView.configurator.budgets.${budget}`), style: t(`equipmentView.configurator.styles.${growStyle}`)})}
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
                                                    <Button variant="secondary" size="sm" className="mt-1 !shadow-none !bg-slate-200/50 dark:!bg-slate-700/50" onClick={() => setRationaleModalContent({title: t('equipmentView.configurator.rationaleModalTitle', { category: categoryLabels[key] }), content: item.rationale})}>
                                                        {t('common.why')}
                                                    </Button>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                                <div className="space-y-6">
                                    <Card>
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3"><PhosphorIcons.Calculator/>{t('equipmentView.configurator.costBreakdown')}</h4>
                                        <div className="space-y-1 text-sm">
                                            {costBreakdown.breakdown.map(item => (
                                                <div key={item.category} className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-300">{categoryLabels[item.category]}</span>
                                                    <span>{item.price} €</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between font-bold border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                                                <span>{t('equipmentView.configurator.total')}</span>
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