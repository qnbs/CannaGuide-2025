import React, { useState, useMemo, useCallback } from 'react';
import { SavedStrainTip, Strain, StructuredGrowTips } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { EditStrainTipModal } from './EditStrainTipModal';
import { selectHasAvailableSlots } from '@/stores/selectors';
import { DataExportModal } from '@/components/common/DataExportModal';
import { exportService } from '@/services/exportService';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { addNotification, initiateGrowFromStrainList } from '@/stores/slices/uiSlice';
import { BulkActionsBar } from './BulkActionsBar';

interface StrainTipsViewProps {
    savedTips: SavedStrainTip[];
    deleteTip: (id: string) => void;
    updateTip: (updatedTip: SavedStrainTip) => void;
    allStrains: Strain[];
}

const TipItem: React.FC<{ tip: SavedStrainTip, onEdit: (tip: SavedStrainTip) => void, onDelete: (id: string) => void }> = ({ tip, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const tipCategories = [
        { key: 'nutrientTip', icon: <PhosphorIcons.Flask />, label: t('strainsView.tips.form.categories.nutrientTip') },
        { key: 'trainingTip', icon: <PhosphorIcons.Scissors />, label: t('strainsView.tips.form.categories.trainingTip') },
        { key: 'environmentalTip', icon: <PhosphorIcons.Fan />, label: t('strainsView.tips.form.categories.environmentalTip') },
        { key: 'proTip', icon: <PhosphorIcons.Sparkle />, label: t('strainsView.tips.form.categories.proTip') },
    ];
    return (
        <div className="animate-fade-in">
             {tip.imageUrl && (
                <div className="mb-4 -mx-3 -mt-3">
                    <img src={tip.imageUrl} alt={tip.strainName} className="rounded-t-lg w-full" />
                </div>
            )}
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
            <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-3">
                {tipCategories.map(cat => {
                    const tipContent = tip[cat.key as keyof StructuredGrowTips];
                    if (!tipContent) return null;
                    return (
                        <div key={cat.key}>
                             <h5 className="font-semibold text-primary-400 text-sm flex items-center gap-2 mb-1">{cat.icon}{cat.label}</h5>
                             <p className="text-sm text-slate-300 pl-7">{tipContent}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


export const StrainTipsView: React.FC<StrainTipsViewProps> = ({ savedTips, deleteTip, updateTip, allStrains }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);

    const [editingTip, setEditingTip] = useState<SavedStrainTip | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState<'grouped' | 'date'>('grouped');
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleUpdateSave = (updatedTip: SavedStrainTip) => {
        updateTip(updatedTip);
        setEditingTip(null);
    };
    
    const filteredTips = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) return savedTips;
        return savedTips.filter(tip => 
            tip.strainName.toLowerCase().includes(lowerCaseSearch) ||
            tip.title.toLowerCase().includes(lowerCaseSearch) ||
            tip.nutrientTip.toLowerCase().includes(lowerCaseSearch) ||
            tip.trainingTip.toLowerCase().includes(lowerCaseSearch) ||
            tip.environmentalTip.toLowerCase().includes(lowerCaseSearch) ||
            tip.proTip.toLowerCase().includes(lowerCaseSearch)
        );
    }, [savedTips, searchTerm]);

    const sortedAndGrouped = useMemo(() => {
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

    const allVisibleIds = useMemo(() => {
        if (sortMode === 'date') {
            return (sortedAndGrouped as SavedStrainTip[]).map(t => t.id);
        }
        return (sortedAndGrouped as [string, SavedStrainTip[]][]).flatMap(([, tips]) => tips.map(t => t.id));
    }, [sortedAndGrouped, sortMode]);

    const handleToggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    }, []);

    const handleToggleAll = useCallback(() => {
        if (selectedIds.size === allVisibleIds.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allVisibleIds));
        }
    }, [selectedIds.size, allVisibleIds]);

    const handleBulkDelete = useCallback(() => {
        if (window.confirm(t('strainsView.exportsManager.deleteConfirmPlural', { count: selectedIds.size }))) {
            selectedIds.forEach(id => deleteTip(id));
            setSelectedIds(new Set());
        }
    }, [selectedIds, deleteTip, t]);
    
    const handleExport = (source: 'selected' | 'all', format: any) => {
        if (!window.confirm(t('common.exportConfirm') as string)) return;

        const dataToExport = source === 'selected' ? savedTips.filter(tip => selectedIds.has(tip.id)) : filteredTips;
        if (dataToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            return;
        }
        // FIX: Added the missing 't' function as the fourth argument to match the function signature.
        exportService.exportStrainTips(dataToExport, format, `CannaGuide_Strain_Tips_${new Date().toISOString().slice(0, 10)}`, t);
        setIsExportModalOpen(false);
    };

    return (
        <div className="mt-4">
            {editingTip && <EditStrainTipModal tip={editingTip} onClose={() => setEditingTip(null)} onSave={handleUpdateSave} />}
            <DataExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} title={t('strainsView.tips.title')} selectionCount={selectedIds.size} totalCount={filteredTips.length} translationBasePath="strainsView.tips.exportModal" />

            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onDelete={handleBulkDelete}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.tips.title')}</h3>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <input type="text" placeholder={t('strainsView.tips.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                     <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}><PhosphorIcons.DownloadSimple className="w-5 h-5"/></Button>
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                       <Button variant="ghost" onClick={() => setSortMode('grouped')} className={`!p-1.5 !rounded-md ${sortMode === 'grouped' ? '!bg-slate-700 !text-primary-300' : ''}`} aria-label={t('strainsView.tips.sortOptions.grouped')} title={t('strainsView.tips.sortOptions.grouped')}><PhosphorIcons.GridFour className="w-5 h-5" /></Button>
                       <Button variant="ghost" onClick={() => setSortMode('date')} className={`!p-1.5 !rounded-md ${sortMode === 'date' ? '!bg-slate-700 !text-primary-300' : ''}`} aria-label={t('strainsView.tips.sortOptions.date')} title={t('strainsView.tips.sortOptions.date')}><PhosphorIcons.ListBullets className="w-5 h-5" /></Button>
                    </div>
                </div>
            </div>
             {savedTips.length === 0 ? (
                <Card className="text-center py-10 text-slate-500"><PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" /><h3 className="font-semibold">{t('strainsView.tips.noTips.title')}</h3><p className="text-sm">{t('strainsView.tips.noTips.subtitle')}</p></Card>
            ) : filteredTips.length === 0 ? (
                 <Card className="text-center py-10 text-slate-500"><p>{t('strainsView.tips.noResults', { term: searchTerm })}</p></Card>
            ) : (
                <div className="space-y-3">
                    <div className="px-3 flex items-center gap-3">
                        <input type="checkbox" checked={selectedIds.size === allVisibleIds.length && allVisibleIds.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                        <label className="text-sm text-slate-400">{t('strainsView.selectedCount', { count: selectedIds.size })}</label>
                    </div>
                    {sortMode === 'grouped' ? (
                        (sortedAndGrouped as [string, SavedStrainTip[]][]).map(([strainName, tips]) => {
                             const strain = allStrains.find(s => s.id === tips[0].strainId);
                             return (
                                <details key={strainName} open={true} className="group ring-1 ring-inset ring-white/20 rounded-lg overflow-hidden">
                                     <summary className="list-none"><div className="flex justify-between items-center p-3 rounded-t-lg bg-slate-800 hover:bg-slate-700/50 cursor-pointer"><h4 className="font-bold text-slate-100">{strainName} ({tips.length})</h4><div className="flex items-center gap-2">{strain && (<div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}><Button size="sm" variant="secondary" className="!p-1.5" onClick={(e) => { e.stopPropagation(); dispatch(initiateGrowFromStrainList(strain)); }} disabled={!hasAvailableSlots}><PhosphorIcons.Plant className="w-4 h-4" /></Button></div>)}<PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" /></div></div></summary>
                                    <div className="p-3 space-y-3 bg-slate-800/40">
                                        {tips.map(tip => (<Card key={tip.id} className="bg-slate-800/50 p-3 flex gap-3 items-start overflow-hidden"><input type="checkbox" checked={selectedIds.has(tip.id)} onChange={() => handleToggleSelection(tip.id)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500"/><div className="flex-1"><TipItem tip={tip} onEdit={setEditingTip} onDelete={deleteTip} /></div></Card>))}
                                    </div>
                                </details>
                            )
                        })
                    ) : (
                        (sortedAndGrouped as SavedStrainTip[]).map(tip => (<Card key={tip.id} className="bg-slate-800 p-3 flex gap-3 items-start overflow-hidden ring-1 ring-inset ring-white/20"><input type="checkbox" checked={selectedIds.has(tip.id)} onChange={() => handleToggleSelection(tip.id)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500"/><div className="flex-1"><p className="text-xs font-bold text-primary-300 mb-2">{tip.strainName}</p><TipItem tip={tip} onEdit={setEditingTip} onDelete={deleteTip} /></div></Card>))
                    )}
                </div>
            )}
        </div>
    );
};