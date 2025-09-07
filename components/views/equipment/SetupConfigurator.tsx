import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { SavedSetup, Recommendation } from '../../../types';
import { SetupResults } from './SetupResults';

type Step = 1 | 2 | 3 | 4;
type Area = '60x60' | '80x80' | '100x100' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'yield' | 'stealth';

interface SetupConfiguratorProps {
    onSaveSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    step: Step;
    setStep: (step: Step) => void;
    area: Area;
    setArea: (area: Area) => void;
    budget: Budget;
    setBudget: (budget: Budget) => void;
    growStyle: GrowStyle;
    setGrowStyle: (style: GrowStyle) => void;
    recommendation: Recommendation | null;
    isLoading: boolean;
    error: string | null;
    handleGenerate: () => void;
    startOver: () => void;
}

export const SetupConfigurator: React.FC<SetupConfiguratorProps> = ({ 
    onSaveSetup, 
    step, setStep, 
    area, setArea, 
    budget, setBudget, 
    growStyle, setGrowStyle,
    recommendation, isLoading, error,
    handleGenerate, startOver
}) => {
    const { t } = useTranslations();

    return (
        <Card>
            {step < 4 ? (
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
                        <Button variant="secondary" onClick={() => setStep(Math.max(1, step-1) as Step)} disabled={step === 1}>{t('common.back')}</Button>
                        {step < 3 ? (
                             <Button onClick={() => setStep(Math.min(3, step+1) as Step)} className="button-enhanced-primary">{t('common.next')}</Button>
                        ) : (
                             <Button onClick={handleGenerate} className="button-enhanced-primary"><PhosphorIcons.Sparkle className="inline w-5 h-5 mr-2" />{t('equipmentView.configurator.generate')}</Button>
                        )}
                    </div>
                 </>
            ) : (
                <SetupResults
                    recommendation={recommendation}
                    isLoading={isLoading}
                    error={error}
                    onSaveSetup={onSaveSetup}
                    startOver={startOver}
                    handleGenerate={handleGenerate}
                    area={area}
                    budget={budget}
                    growStyle={growStyle}
                />
            )}
        </Card>
    );
};
