import React, { useState, useMemo, useCallback } from 'react';
import { SavedStrainTip, Strain, ExportFormat, StructuredGrowTips } from '@/types';
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
import { Input } from '@/components/ui/ThemePrimitives';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Speakable } from '@/components/common/Speakable';
import { SearchBar } from '@/components/common/SearchBar';


type TipCategory = 'all' | keyof StructuredGrowTips;

const TipItem: React.FC<{ tip: SavedStrainTip, onEdit: (tip: SavedStrainTip) => void, onDelete: (id: string) => void, showStrainName?: boolean }> = ({ tip, onEdit, onDelete, showStrainName = false }) => {
    const { t } = useTranslation();

    const tipCategories = [
        { key: 'nutrientTip', icon: <PhosphorIcons.Flask />, label: t('strainsView.tips.form.categories.nutrientTip') },
        { key: 'trainingTip', icon: <PhosphorIcons.Scissors />, label: t('strainsView.tips.form.categories.trainingTip') },
        { key: 'environmentalTip', icon: <PhosphorIcons.Fan />, label: t('strainsView.tips.form.categories.environmentalTip') },
        { key: 'proTip', icon: <PhosphorIcons.Sparkle />, label: t('strainsView.tips.form.categories.proTip') },
    ];

    return (
        <Card className="bg-slate-800/50 p-3 flex flex-col ring-1 ring-inset ring-slate-700/50">
             {tip.imageUrl && (
                <div className="mb-3 -mx-3 -mt-3 rounded-t-lg overflow-hidden">
                    <img src={tip.imageUrl} alt={tip.strainName} className="w-full h-auto" />
                </div>
            )}
            <div className="flex justify-between items-start gap-2">
                <div>
                    {showStrainName && <p className="text-sm font-bold text-primary-300">{tip.strainName}</p>}
                    <p className="text-xs text-slate-400">{new Date(tip.createdAt).toLocaleString()}</p>
                    <h4 className="font-semibold text-slate-100 mt-1">{tip.title}</h4>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(tip)} aria-label={t('common.edit')} className="!p-1.5 rounded-full"><PhosphorIcons.PencilSimple className="w-4 h-4" /></Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(tip.id)} aria-label={t('common.delete')} className="!p-1.5 rounded-full"><PhosphorIcons.TrashSimple className="w-4 h-4" /></Button>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                 {tipCategories.map(cat => {
                    const tipContent = tip[cat.key as keyof StructuredGrowTips];
                    if (!tipContent) return null;
                    return (
                        <div key={cat.key}>
                            <h5 className="font-semibold text-primary-400 text-sm flex items-center gap-2 mb-1">{cat.icon}{cat.label}</h5>
                            <Speakable elementId={`tip-${tip.id}-${cat.key}`}>
                                <p className="text-sm text-slate-300 pl-7">{tipContent}</p>
                            </Speakable>
                        </div>
                    )
                 })}
            </div>
        </Card>
    );
};


export const StrainTipsView: React.FC<{
    savedTips: SavedStrainTip[];
    deleteTip: (id: string) => void;
    updateTip: (updatedTip: SavedStrainTip) => void;
    allStrains: Strain[];
}> = ({ savedTips, deleteTip, updateTip, allStrains }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);

    const [editingTip, setEditingTip] = useState<SavedStrainTip | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState<'grouped' | 'date'>('grouped');
    const [categoryFilter, setCategoryFilter] = useState<TipCategory>('all');
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    const handleUpdateSave = (updatedTip: SavedStrainTip) => {
        updateTip(updatedTip);
        setEditingTip(null);
    };
    
    const filteredTips = useMemo(() => {
        let tips = [...savedTips];
        const lowerCaseSearch = searchTerm.toLowerCase();

        if (lowerCaseSearch) {
            tips = tips.filter(tip => {
                const fieldsToSearch: (keyof StructuredGrowTips | 'strainName' | 'title')[] = 
                    categoryFilter !== 'all' 
                        ? [categoryFilter, 'strainName', 'title'] 
                        : ['strainName', 'title', 'nutrientTip', 'trainingTip', 'environmentalTip', 'proTip'];
                
                return fieldsToSearch.some(field => (tip[field] || '').toLowerCase().includes(lowerCaseSearch));
            });
        }
        
        return tips;
    }, [savedTips, searchTerm, categoryFilter]);

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
        if (selectedIds.size === allVisibleIds.length && allVisibleIds.length > 0) {
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
    
    const handleExport = (source: 'selected' | 'all', format: ExportFormat) => {
        if (!window.confirm(t('common.exportConfirm'))) return;

        const dataToExport = source === 'selected' ? savedTips.filter(tip => selectedIds.has(tip.id)) : filteredTips;
        if (dataToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            setIsExportModalOpen(false);
            return;
        }
        exportService.exportStrainTips(dataToExport, format, `CannaGuide_Strain_Tips_${new Date().toISOString().slice(0, 10)}`);
        setIsExportModalOpen(false);
    };
    
    const tipCategoriesForFilter: {value: TipCategory, label: string}[] = [
        { value: 'all', label: t('common.all') },
        { value: 'nutrientTip', label: t('strainsView.tips.form.categories.nutrientTip') },
        { value: 'trainingTip', label: t('strainsView.tips.form.categories.trainingTip') },
        { value: 'environmentalTip', label: t('strainsView.tips.form.categories.environmentalTip') },
        { value: 'proTip', label: t('strainsView.tips.form.categories.proTip') },
    ];

    return (
        <div className="mt-4 animate-fade-in">
            {editingTip && <EditStrainTipModal tip={editingTip} onClose={() => setEditingTip(null)} onSave={handleUpdateSave} />}
            <DataExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} title={t('strainsView.tips.title')} selectionCount={selectedIds.size} totalCount={filteredTips.length} translationBasePath="strainsView.tips.exportModal" />

            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onDelete={handleBulkDelete}
                />
            )}
            
            <Card className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <h3 className="text-xl font-bold font-display text-primary-400">{t('strainsView.tips.title')}</h3>
                     <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-grow">
                            <SearchBar
                                placeholder={t('strainsView.tips.searchPlaceholder')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="!py-1.5"
                            />
                        </div>
                         <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} className="!p-2"><PhosphorIcons.DownloadSimple className="w-5 h-5"/></Button>
                         <SegmentedControl options={[{value: 'grouped', label: t('strainsView.tips.sortOptions.grouped')}, {value: 'date', label: t('strainsView.tips.sortOptions.date')}]} value={[sortMode]} onToggle={(val) => setSortMode(val as 'grouped' | 'date')} />
                    </div>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                    {tipCategoriesForFilter.map(cat => (
                        <button key={cat.value} onClick={() => setCategoryFilter(cat.value)} className={`px-2.5 py-1 text-xs rounded-full font-semibold transition-colors ${categoryFilter === cat.value ? 'bg-primary-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}>
                            {cat.label}
                        </button>
                    ))}
                 </div>
            </Card>

             {savedTips.length === 0 ? (
                <Card className="text-center py-10 text-slate-500 mt-4"><PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" /><h3 className="font-semibold">{t('strainsView.tips.noTips.title')}</h3><p className="text-sm">{t('strainsView.tips.noTips.subtitle')}</p></Card>
            ) : filteredTips.length === 0 ? (
                 <Card className="text-center py-10 text-slate-500 mt-4"><p>{t('strainsView.tips.noResults', { term: searchTerm })}</p></Card>
            ) : (
                <div className="space-y-4 mt-4">
                    <div className="px-3 flex items-center gap-3">
                        <input type="checkbox" checked={selectedIds.size === allVisibleIds.length && allVisibleIds.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                        <label className="text-sm text-slate-400">{t('strainsView.selectedCount', { count: selectedIds.size })}</label>
                    </div>
                    {sortMode === 'grouped' ? (
                        (sortedAndGrouped as [string, SavedStrainTip[]][]).map(([strainName, tips]) => {
                             const strain = allStrains.find(s => s.id === tips[0].strainId);
                             return (
                                <details key={strainName} open className="group ring-1 ring-inset ring-slate-700/50 rounded-lg overflow-hidden">
                                     <summary className="list-none"><div className="flex justify-between items-center p-3 bg-slate-800 hover:bg-slate-700/50 cursor-pointer"><h4 className="font-bold text-slate-100">{strainName} ({tips.length})</h4><div className="flex items-center gap-2">{strain && (<div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}><Button size="sm" variant="secondary" className="!p-1.5" onClick={(e) => { e.stopPropagation(); dispatch(initiateGrowFromStrainList(strain)); }} disabled={!hasAvailableSlots}><PhosphorIcons.Plant className="w-4 h-4" /></Button></div>)}<PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" /></div></div></summary>
                                    <div className="p-3 space-y-3 bg-slate-800/40">
                                        {tips.map(tip => (<div key={tip.id} className="flex gap-3 items-start"><input type="checkbox" checked={selectedIds.has(tip.id)} onChange={() => handleToggleSelection(tip.id)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 flex-shrink-0" /><div className="flex-1"><TipItem tip={tip} onEdit={setEditingTip} onDelete={deleteTip} /></div></div>))}
                                    </div>
                                </details>
                            )
                        })
                    ) : (
                        (sortedAndGrouped as SavedStrainTip[]).map(tip => (<div key={tip.id} className="flex gap-3 items-start"><input type="checkbox" checked={selectedIds.has(tip.id)} onChange={() => handleToggleSelection(tip.id)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 flex-shrink-0" /><div className="flex-1"><TipItem tip={tip} onEdit={setEditingTip} onDelete={deleteTip} showStrainName /></div></div>))
                    )}
                </div>
            )}
        </div>
    );
};