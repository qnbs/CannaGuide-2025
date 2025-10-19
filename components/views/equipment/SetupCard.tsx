import React, { memo } from 'react';
import { SavedSetup, RecommendationCategory, RecommendationItem } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

interface SetupCardProps {
    setup: SavedSetup;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

export const SetupCard: React.FC<SetupCardProps> = memo(({ setup, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    
    const categoryOrder: RecommendationCategory[] = ['tent', 'light', 'ventilation', 'circulationFan', 'pots', 'soil', 'nutrients', 'extra'];

    return (
        <details className="group glass-pane rounded-lg overflow-hidden transition-all duration-300 ring-1 ring-inset ring-white/20">
            <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-lg text-slate-100 truncate">{setup.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                        <span>{new Date(setup.createdAt).toLocaleString()}</span>
                        <span className="w-1 h-1 bg-slate-600 rounded-full hidden sm:block"></span>
                        <span className="hidden sm:block">{t('equipmentView.configurator.total')}: <span className="font-semibold">{(setup.totalCost || 0).toFixed(2)}{t('common.units.currency_eur')}</span></span>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label={t('common.edit')} className="!p-2"><PhosphorIcons.PencilSimple className="w-4 h-4"/></Button>
                    <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(setup.id); }} aria-label={t('common.delete')} className="!p-2"><PhosphorIcons.TrashSimple className="w-4 h-4"/></Button>
                    <div className="p-2 text-slate-400 transition-transform duration-300 group-open:rotate-180"><PhosphorIcons.ChevronDown className="w-5 h-5" /></div>
                </div>
            </summary>
            <div className="border-t border-slate-700/50 p-4 space-y-3">
                {setup.recommendation && categoryOrder.map(key => {
                    const item = setup.recommendation[key as keyof typeof setup.recommendation] as RecommendationItem | string;
                    if (!item || typeof item !== 'object' || !item.name) return null;
                    const categoryLabel = t(`equipmentView.configurator.categories.${key}`);
                    return (
                        <div key={key} className="p-2 bg-slate-800/50 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-slate-200">{categoryLabel}</h4>
                                    <p className="text-sm text-primary-300">{item.name} {item.watts && `(${item.watts}W)`}</p>
                                </div>
                                <span className="text-sm font-mono font-semibold text-slate-300">{(item.price || 0).toFixed(2)} {t('common.units.currency_eur')}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 italic">"{item.rationale}"</p>
                        </div>
                    );
                })}
                 {setup.recommendation?.proTip && (
                     <div className="p-2 bg-primary-900/20 rounded-md">
                        <h4 className="font-semibold text-primary-300 flex items-center gap-1.5"><PhosphorIcons.Sparkle /> {t('strainsView.tips.form.categories.proTip')}</h4>
                        <p className="text-xs text-slate-300 mt-1 italic">"{setup.recommendation.proTip}"</p>
                    </div>
                )}
                {!setup.recommendation && (
                    <p className="text-sm text-slate-400">{t('equipmentView.savedSetups.noDetails')}</p>
                )}
            </div>
        </details>
    );
});
