import React, { useState, useMemo } from 'react';
import { SavedStrainTip, Strain } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { EditResponseModal } from '@/components/common/EditResponseModal';
import { useStrainView } from '@/context/StrainViewContext';
import { usePlants } from '@/hooks/usePlants';

interface StrainTipsViewProps {
    savedTips: SavedStrainTip[];
    deleteTip: (id: string) => void;
    updateTip: (updatedTip: SavedStrainTip) => void;
    allStrains: Strain[];
}

const TipItem: React.FC<{ tip: SavedStrainTip, onEdit: (tip: SavedStrainTip) => void, onDelete: (id: string) => void }> = ({ tip, onEdit, onDelete }) => {
    const { t } = useTranslations();
    return (
        <Card className="bg-slate-800 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs text-slate-400">{new Date(tip.createdAt).toLocaleString()}</p>
                    <h4 className="font-bold text-primary-300 mt-1">{tip.title}</h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(tip)} aria-label={t('common.edit')}>
                        <PhosphorIcons.PencilSimple className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(tip.id)} aria-label={t('common.delete')}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: tip.content }} />
        </Card>
    );
};


export const StrainTipsView: React.FC<StrainTipsViewProps> = ({ savedTips, deleteTip, updateTip, allStrains }) => {
    const { t } = useTranslations();
    const { actions } = useStrainView();
    const { plants } = usePlants();
    const hasAvailableSlots = useMemo(() => plants.some(p => p === null), [plants]);

    const [editingTip, setEditingTip] = useState<SavedStrainTip | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState<'grouped' | 'date'>('grouped');

    const handleUpdateSave = (updated: { id: string, title: string, content: string }) => {
        if (!editingTip) return;
        const updatedTipData: SavedStrainTip = {
            ...editingTip,
            title: updated.title,
            content: updated.content
        };
        updateTip(updatedTipData);
        setEditingTip(null);
    };

    const filteredTips = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return savedTips;
        return savedTips.filter(tip => 
            tip.strainName.toLowerCase().includes(lowerCaseSearch) ||
            tip.title.toLowerCase().includes(lowerCaseSearch) ||
            tip.content.toLowerCase().includes(lowerCaseSearch)
        );
    }, [savedTips, searchTerm]);

    const groupedAndSortedTips = useMemo(() => {
        if (sortMode === 'date') {
            return [...filteredTips].sort((a,b) => b.createdAt - a.createdAt);
        }
        
        const grouped: Record<string, SavedStrainTip[]> = filteredTips.reduce((acc, tip) => {
            (acc[tip.strainName] = acc[tip.strainName] || []).push(tip);
            return acc;
        }, {} as Record<string, SavedStrainTip[]>);
        
        Object.values(grouped).forEach(tips => tips.sort((a, b) => b.createdAt - a.createdAt));
        
        return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredTips, sortMode]);


    return (
        <div className="mt-4">
            {editingTip && (
                <EditResponseModal
                    response={editingTip}
                    onClose={() => setEditingTip(null)}
                    onSave={handleUpdateSave}
                    title={t('strainsView.tips.editTipTitle')}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.tips.title')}</h3>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={t('strainsView.tips.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="flex gap-1 bg-slate-800 rounded-lg p-0.5">
                       <button onClick={() => setSortMode('grouped')} className={`p-1.5 rounded-md transition-colors ${sortMode === 'grouped' ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`} aria-label={t('strainsView.tips.sortOptions.grouped')} title={t('strainsView.tips.sortOptions.grouped')}>
                           <PhosphorIcons.GridFour className="w-5 h-5" />
                       </button>
                       <button onClick={() => setSortMode('date')} className={`p-1.5 rounded-md transition-colors ${sortMode === 'date' ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-600'}`} aria-label={t('strainsView.tips.sortOptions.date')} title={t('strainsView.tips.sortOptions.date')}>
                           <PhosphorIcons.ListBullets className="w-5 h-5" />
                       </button>
                    </div>
                </div>
            </div>
             {savedTips.length === 0 ? (
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">{t('strainsView.tips.noTips.title')}</h3>
                    <p className="text-sm">{t('strainsView.tips.noTips.subtitle')}</p>
                </Card>
            ) : filteredTips.length === 0 ? (
                 <Card className="text-center py-10 text-slate-500">
                    <p>{t('strainsView.tips.noResults', { term: searchTerm })}</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sortMode === 'grouped' ? (
                        (groupedAndSortedTips as [string, SavedStrainTip[]][]).map(([strainName, tips]) => {
                             const strain = allStrains.find(s => s.id === tips[0].strainId);
                             return (
                                <details key={strainName} open={true} className="group">
                                     <summary className="list-none">
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700/50 cursor-pointer">
                                             <h4 className="font-bold text-slate-100">{strainName} ({tips.length})</h4>
                                             <div className="flex items-center gap-2">
                                                {strain && (
                                                    <div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="!p-1.5"
                                                            onClick={(e) => { e.stopPropagation(); actions.initiateGrow(strain); }}
                                                            disabled={!hasAvailableSlots}
                                                        >
                                                            <PhosphorIcons.Plant className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                                 <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                                             </div>
                                        </div>
                                    </summary>
                                    <div className="pl-6 pt-3 space-y-3">
                                        {tips.map(tip => (
                                            <TipItem key={tip.id} tip={tip} onEdit={setEditingTip} onDelete={deleteTip} />
                                        ))}
                                    </div>
                                </details>
                            )
                        })
                    ) : (
                        (groupedAndSortedTips as SavedStrainTip[]).map(tip => (
                             <Card key={tip.id} className="bg-slate-800 animate-fade-in p-3">
                                <p className="text-xs font-bold text-primary-300 mb-2">{tip.strainName}</p>
                                <TipItem tip={tip} onEdit={setEditingTip} onDelete={deleteTip} />
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
