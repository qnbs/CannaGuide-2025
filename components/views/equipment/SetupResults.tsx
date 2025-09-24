import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { SavedSetup, Recommendation, RecommendationCategory, RecommendationItem } from '@/types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { AiTask } from '@/stores/slices/aiSlice';

type Area = '60x60' | '80x80' | '100x100' | '120x60' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'balanced' | 'yield' | 'stealth';

interface SetupResultsProps {
    task: AiTask<Recommendation>;
    onSaveSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    startOver: () => void;
    handleGenerate: () => void;
    area: Area;
    budget: Budget;
    growStyle: GrowStyle;
}

const RationaleModal: React.FC<{ content: { title: string, content: string }, onClose: () => void }> = ({ content, onClose }) => {
    const { t } = useTranslations();
    const modalRef = useFocusTrap(true);
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay-animate" role="dialog" aria-modal="true" aria-labelledby="rationale-modal-title">
            <Card ref={modalRef} className="w-full max-w-md modal-content-animate" onClick={(e) => e.stopPropagation()}>
                <h3 id="rationale-modal-title" className="text-xl font-bold text-primary-400 mb-4">{content.title}</h3>
                <p className="text-slate-300">{content.content}</p>
                <div className="text-right mt-6">
                    <Button onClick={onClose}>{t('common.close')}</Button>
                </div>
            </Card>
        </div>
    );
};

export const SetupResults: React.FC<SetupResultsProps> = ({
    task, onSaveSetup, startOver, handleGenerate, area, budget, growStyle
}) => {
    const { t } = useTranslations();
    const addNotification = useAppStore(state => state.addNotification);
    const [rationaleModalContent, setRationaleModalContent] = useState<{title: string, content: string} | null>(null);
    const [setupName, setSetupName] = useState('');

    const { recommendation, isLoading, error, loadingMessage } = useMemo(() => ({
        recommendation: task.result,
        isLoading: task.status === 'loading',
        error: task.error || null,
        loadingMessage: task.loadingMessage || t('ai.generating')
    }), [task, t]);

     useEffect(() => {
        if (recommendation) {
            const defaultName = `${area} ${t(`equipmentView.configurator.styles.${growStyle}`)} ${t(`equipmentView.configurator.setupNameBudgets.${budget}`)}`;
            setSetupName(defaultName);
        }
    }, [recommendation, area, growStyle, budget, t]);

    const costBreakdown = useMemo(() => {
        if (!recommendation) return null;
        let total = 0;
        const breakdownData = (Object.keys(recommendation) as RecommendationCategory[]).map(key => {
            const item = recommendation[key];
            total += item.price;
            return { category: key, price: item.price };
        });
        return { breakdown: breakdownData, total };
    }, [recommendation]);
    
    const handleSave = () => {
        const name = setupName.trim();
        if (name && recommendation && costBreakdown) {
            if (window.confirm(t('equipmentView.configurator.setupSaveConfirm', { name }))) {
                try {
                    const newSetup: Omit<SavedSetup, 'id' | 'createdAt'> = {
                        name,
                        recommendation,
                        sourceDetails: {
                            area,
                            budget: t(`equipmentView.configurator.setupNameBudgets.${budget}`),
                            growStyle: t(`equipmentView.configurator.styles.${growStyle}`),
                        },
                        totalCost: costBreakdown.total,
                    };
                    onSaveSetup(newSetup);
                } catch (e) {
                    addNotification(t('equipmentView.configurator.setupSaveError'), 'error');
                    console.error(e);
                }
            }
        }
    };
    
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold font-display">{t('equipmentView.configurator.resultsTitle')}</h3>
                <Button onClick={startOver} variant="secondary" size="sm"><PhosphorIcons.ArrowClockwise className="inline w-4 h-4 mr-1.5"/>{t('equipmentView.configurator.startOver')}</Button>
            </div>
            {isLoading ? (
                <div className="text-center p-8">
                    <PhosphorIcons.ArrowClockwise className="w-12 h-12 mx-auto text-primary-500 animate-spin mb-4" />
                    <p className="text-slate-400 animate-pulse">{loadingMessage}</p>
                </div>
            ) : error ? (
                <Card className="text-center bg-red-900/20 border-red-500/50">
                    <h4 className="font-bold text-red-300">{t('common.error')}</h4>
                    <p className="text-red-400">{error}</p>
                    <div className="mt-4 flex justify-center gap-2">
                         <Button onClick={startOver} variant="secondary">{t('equipmentView.configurator.startOver')}</Button>
                         <Button onClick={handleGenerate}>{t('equipmentView.configurator.tryAgain')}</Button>
                    </div>
                </Card>
            ) : recommendation && costBreakdown && (
               <>
                    <Card className="bg-primary-900/20">
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
                                            <div className="text-primary-400 mt-1 w-8 h-8 flex-shrink-0">{gearIcons[key]}</div>
                                            <div>
                                                <h4 className="font-bold text-slate-100">{categoryLabels[key]}</h4>
                                                <p className="text-sm text-slate-400">{item.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold">{item.price} €</p>
                                            <Button variant="secondary" size="sm" className="mt-1 !shadow-none !bg-slate-800" onClick={() => setRationaleModalContent({title: t('equipmentView.configurator.rationaleModalTitle', { category: categoryLabels[key] }), content: item.rationale})}>
                                                {t('common.why')}
                                            </Button>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-3"><PhosphorIcons.Calculator/>{t('equipmentView.configurator.costBreakdown')}</h4>
                                <div className="space-y-1 text-sm">
                                    {costBreakdown.breakdown.map(item => (
                                        <div key={item.category} className="flex justify-between">
                                            <span className="text-slate-300">{categoryLabels[item.category]}</span>
                                            <span>{item.price} €</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold border-t border-slate-700 pt-2 mt-2">
                                        <span>{t('equipmentView.configurator.total')}</span>
                                        <span>≈ {costBreakdown.total.toFixed(2)} €</span>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2 pt-4 border-t border-slate-700">
                                    <label htmlFor="setup-name" className="block text-sm font-semibold text-slate-300">{t('common.name')}</label>
                                    <input
                                        id="setup-name"
                                        type="text"
                                        value={setupName}
                                        onChange={(e) => setSetupName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100"
                                        placeholder={t('equipmentView.configurator.setupNamePrompt')}
                                    />
                                    <Button onClick={handleSave} className="w-full" disabled={!setupName.trim()}>
                                        {t('equipmentView.configurator.saveSetup')}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                     </div>
                </>
            )}
            {rationaleModalContent && <RationaleModal content={rationaleModalContent} onClose={() => setRationaleModalContent(null)} />}
        </div>
    );
};