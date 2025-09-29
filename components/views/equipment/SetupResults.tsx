import React, { useState } from 'react';
import { Recommendation, SavedSetup, RecommendationCategory, RecommendationItem } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

interface SetupResultsProps {
    recommendation: Recommendation | null;
    isLoading: boolean;
    error: string | null;
    sourceDetails: { area: string; budget: string; growStyle: string; };
    startOver: () => void;
    handleGenerate: () => void;
    onSaveSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    loadingMessage: string;
}

const RationaleModal: React.FC<{ category: string, rationale: string, onClose: () => void }> = ({ category, rationale, onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-primary-400 mb-2">{t('common.why')} {category}?</h3>
                <p className="text-sm text-slate-300">{rationale}</p>
                <div className="text-right mt-4">
                    <Button onClick={onClose}>{t('common.close')}</Button>
                </div>
            </Card>
        </div>
    );
};

export const SetupResults: React.FC<SetupResultsProps> = ({ recommendation, isLoading, error, sourceDetails, startOver, handleGenerate, onSaveSetup, loadingMessage }) => {
    const { t } = useTranslation();
    const [rationale, setRationale] = useState<{ category: string; text: string } | null>(null);

    if (isLoading) {
        return <AiLoadingIndicator loadingMessage={loadingMessage} />;
    }
    
    if (error) {
        return (
            <div className="text-center p-8">
                <PhosphorIcons.XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400">{t('equipmentView.configurator.error')}</p>
                <p className="text-sm text-slate-400 mb-4">{error}</p>
                <Button onClick={handleGenerate}>{t('equipmentView.configurator.tryAgain')}</Button>
            </div>
        );
    }

    if (!recommendation) return null;

    const totalCost = (Object.values(recommendation) as (RecommendationItem | string)[]).reduce((sum, item) => {
        if (typeof item === 'object' && item.price) {
            return sum + item.price;
        }
        return sum;
    }, 0);


    const handleSave = () => {
        const setupName = `${t(`equipmentView.configurator.styles.${sourceDetails.growStyle}`)} ${sourceDetails.area} (${t(`equipmentView.configurator.setupNameBudgets.${sourceDetails.budget}`)})`;
        const name = window.prompt(t('equipmentView.configurator.setupNamePrompt'), setupName);
        if (name) {
            onSaveSetup({ name, recommendation, totalCost, sourceDetails });
        }
    };
    
    const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];

    return (
        <div className="animate-fade-in">
            {rationale && <RationaleModal category={rationale.category} rationale={rationale.text} onClose={() => setRationale(null)} />}
            
            <h2 className="text-2xl font-bold text-primary-400">{t('equipmentView.configurator.resultsTitle')}</h2>
            <p className="text-slate-400 mb-4 text-sm">{t('equipmentView.configurator.resultsSubtitle', {
                area: sourceDetails.area,
                budget: t(`equipmentView.configurator.budgets.${sourceDetails.budget}`),
                style: t(`equipmentView.configurator.styles.${sourceDetails.growStyle}`),
            })}</p>
            
            <div className="space-y-3">
                {categoryOrder.map(key => {
                    const item = recommendation[key as RecommendationCategory];
                    if (!item) return null;
                    const categoryLabel = t(`equipmentView.configurator.categories.${key}`);
                    return (
                        <Card key={key} className="p-3 bg-slate-800/50">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <h4 className="font-bold text-slate-100">{categoryLabel}</h4>
                                    <p className="text-sm text-primary-300">{item.name} {item.watts && `(${item.watts}W)`}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold">{(item.price as number).toFixed(2)} {t('common.units.currency_eur')}</span>
                                    <Button size="sm" variant="secondary" onClick={() => setRationale({ category: categoryLabel, text: item.rationale })}>{t('common.why')}</Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            {recommendation.proTip && (
                 <Card key="proTip" className="p-3 bg-primary-900/30 mt-4">
                    <h4 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                        <PhosphorIcons.Sparkle /> {t('strainsView.tips.form.categories.proTip')}
                    </h4>
                    <p className="text-sm text-slate-300">{recommendation.proTip}</p>
                </Card>
            )}

            <div className="mt-6 pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-2xl font-bold">
                    <span>{t('equipmentView.configurator.total')}: </span>
                    <span className="text-primary-400">{totalCost.toFixed(2)} {t('common.units.currency_eur')}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={startOver}>{t('equipmentView.configurator.startOver')}</Button>
                    <Button onClick={handleSave}>{t('equipmentView.configurator.saveSetup')}</Button>
                </div>
            </div>
        </div>
    );
};