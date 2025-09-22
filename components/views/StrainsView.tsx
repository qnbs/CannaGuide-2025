import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Strain, View, SortDirection, AIResponse, GrowSetup } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useStrainFilters } from '@/hooks/useStrainFilters';
// FIX: Replaced multiple hook/context imports with the central Zustand store.
import { useAppStore } from '@/stores/useAppStore';
import { strainService } from '@/services/strainService';
import { exportService } from '@/services/exportService';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainDetailModal } from '@/components/views/strains/StrainDetailModal';
import { AddStrainModal } from '@/components/views/strains/AddStrainModal';
import { ExportModal } from '@/components/views/strains/ExportModal';
import { ExportsManagerView } from '@/components/views/strains/ExportsManagerView';
import StrainGridItem from '@/components/views/strains/StrainGridItem';
import StrainListItem from '@/components/views/strains/StrainListItem';
import { LIST_GRID_CLASS } from '@/components/views/strains/constants';
import AdvancedFilterModal from '@/components/views/strains/AdvancedFilterModal';
import { StrainTipsView } from '@/components/views/strains/StrainTipsView';
import { GrowSetupModal } from '@/components/views/plants/GrowSetupModal';
// FIX: Removed context import as it's being replaced by the Zustand store.
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';

const StrainsViewContent: React.FC = () => {
    const { t } = useTranslations();
    // FIX: Get state and actions from the central Zustand store.
    const { 
        settings,
        userStrains, addUserStrain, updateUserStrain, deleteUserStrain, isUserStrain,
        savedExports, addExport, deleteExport, updateExport,
        savedStrainTips, addStrainTip, updateStrainTip, deleteStrainTip,
        addNotification,
        selectedStrain, strainToEdit, strainForSetup, isAddModalOpen, isExportModalOpen, isSetupModalOpen, favoriteIds,
        actions
    } = useAppStore(state => ({
        settings: state.settings,
        userStrains: state.userStrains,
        addUserStrain: state.addUserStrain,
        updateUserStrain: state.updateUserStrain,
        deleteUserStrain: state.deleteUserStrain,
        isUserStrain: state.isUserStrain,
        savedExports: state.savedExports,
        addExport: state.addExport,
        deleteExport: state.deleteExport,
        updateExport: state.updateExport,
        savedStrainTips: state.savedStrainTips,
        addStrainTip: state.addStrainTip,
        updateStrainTip: state.updateStrainTip,
        deleteStrainTip: state.deleteStrainTip,
        addNotification: state.addNotification,
        selectedStrain: state.selectedStrain,
        strainToEdit: state.strainToEdit,
        strainForSetup: state.strainForSetup,
        isAddModalOpen: state.isAddModalOpen,
        isExportModalOpen: state.isExportModalOpen,
        isSetupModalOpen: state.isSetupModalOpen,
        favoriteIds: state.favoriteIds,
        actions: {
            closeAddModal: () => state.closeAddModal(),
            openAddModal: (strain?: Strain) => state.openAddModal(strain),
            closeExportModal: () => state.closeExportModal(),
            openExportModal: () => state.openExportModal(),
            closeGrowModal: () => state.closeGrowModal(),
            confirmGrow: (setup: GrowSetup, strain: Strain) => {
                // This logic seems more appropriate to live in the store, but for minimal changes:
                const success = useAppStore.getState().startNewPlant(strain, setup);
                if(success) {
                    state.closeGrowModal();
                    state.setActiveView(View.Plants);
                }
            }
        }
    }));
    
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [activeTab, setActiveTab] = useState<StrainViewTab>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(settings.strainsViewSettings.defaultViewMode);
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) setIsMoreMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            if (activeTab === 'my-strains' && userStrains.length === 0) setActiveTab('all');
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load strains:", err);
            addNotification(t('strainsView.loadError'), 'error');
            setIsLoading(false);
        });
    }, [t, userStrains.length, activeTab, addNotification]);

    const strainsToDisplay = useMemo(() => {
        const combinedStrains = [...allStrains, ...userStrains];
        const uniqueStrains = Array.from(new Map(combinedStrains.map(s => [s.id, s])).values());
        
        switch (activeTab) {
            case 'all': return uniqueStrains;
            case 'my-strains': return userStrains;
            case 'favorites': return uniqueStrains.filter(s => favoriteIds.has(s.id));
            default: return uniqueStrains;
        }
    }, [activeTab, allStrains, userStrains, favoriteIds]);

    const {
        sortedAndFilteredStrains, filterControls, filterState, isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen,
        tempFilterState, setTempFilterState, previewFilteredStrains, openAdvancedFilterModal, handleApplyAdvancedFilters,
    } = useStrainFilters(strainsToDisplay, favoriteIds, {
        key: settings.strainsViewSettings.defaultSortKey as any, direction: settings.strainsViewSettings.defaultSortDirection as SortDirection,
    });
    
    const handleToggleAll = () => setSelectedIds(prev => prev.size === sortedAndFilteredStrains.length ? new Set() : new Set(sortedAndFilteredStrains.map(s => s.id)));
    const handleToggleSelection = useCallback((id: string) => setSelectedIds(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; }), []);

    const handleExport = (source: 'selected' | 'favorites' | 'filtered' | 'all', format: 'pdf' | 'txt' | 'csv' | 'json') => {
        let strainsToExport: Strain[] = [];
        const sourceStrains = [...allStrains, ...userStrains];
        switch(source) {
            case 'selected': strainsToExport = sourceStrains.filter(s => selectedIds.has(s.id)); break;
            case 'favorites': strainsToExport = sourceStrains.filter(s => favoriteIds.has(s.id)); break;
            case 'filtered': strainsToExport = sortedAndFilteredStrains; break;
            case 'all': strainsToExport = strainsToDisplay; break;
        }
        if (strainsToExport.length === 0) { addNotification(t('common.noDataToExport'), 'error'); return; }
        const exportName = `${t('strainsView.exportModal.sources.' + source)}-${strainsToExport.length}`;
        const savedExport = addExport({ name: exportName, source, format }, strainsToExport.map(s => s.id));
        const fileName = `${savedExport.name}-${savedExport.id.slice(-4)}`;
        switch (format) {
            case 'pdf': exportService.exportAsPDF(strainsToExport, fileName, t); break;
            case 'txt': exportService.exportAsTXT(strainsToExport, fileName, t); break;
            case 'csv': exportService.exportAsCSV(strainsToExport, fileName, t); break;
            case 'json': exportService.exportAsJSON(strainsToExport, fileName); break;
        }
        addNotification(t('common.successfullyExported', { count: strainsToExport.length, format: format.toUpperCase() }), 'success');
    };
    
    const handleSaveTip = (strain: Strain, tip: AIResponse) => addStrainTip(strain, tip);

    // FIX: Using `reduce` with a type assertion on the initial value to fix type inference issues.
    const allAromas = useMemo(() => Array.from(new Set(strainsToDisplay.reduce((acc, s) => acc.concat(s.aromas || []), [] as string[]))).sort(), [strainsToDisplay]);
    const allTerpenes = useMemo(() => Array.from(new Set(strainsToDisplay.reduce((acc, s) => acc.concat(s.dominantTerpenes || []), [] as string[]))).sort(), [strainsToDisplay]);

    const tabs = [
        { id: 'all', label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        { id: 'my-strains', label: t('strainsView.tabs.myStrains'), icon: <PhosphorIcons.Star weight="fill" /> },
        { id: 'favorites', label: t('strainsView.tabs.favorites'), icon: <PhosphorIcons.Heart /> },
        { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.ArchiveBox /> },
        { id: 'tips', label: t('strainsView.tabs.tips', { count: savedStrainTips.length }), icon: <PhosphorIcons.LightbulbFilament /> },
    ];
    
    return (
        <div className="space-y-4">
            {selectedStrain && <StrainDetailModal strain={selectedStrain} onSaveTip={handleSaveTip} />}
            {isAddModalOpen && <AddStrainModal isOpen={isAddModalOpen} onClose={actions.closeAddModal} onAddStrain={(s) => { addUserStrain(s); actions.closeAddModal(); }} onUpdateStrain={(s) => { updateUserStrain(s); actions.closeAddModal(); }} strainToEdit={strainToEdit} />}
            {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onClose={actions.closeExportModal} onExport={handleExport} selectionCount={selectedIds.size} favoritesCount={favoriteIds.size} filteredCount={sortedAndFilteredStrains.length} totalCount={strainsToDisplay.length} />}
            {isAdvancedFilterModalOpen && <AdvancedFilterModal isOpen={isAdvancedFilterModalOpen} onClose={() => setIsAdvancedFilterModalOpen(false)} onApply={handleApplyAdvancedFilters} tempFilterState={tempFilterState} setTempFilterState={setTempFilterState} allAromas={allAromas} allTerpenes={allTerpenes} count={previewFilteredStrains.length}/>}
            {isSetupModalOpen && strainForSetup && <GrowSetupModal strain={strainForSetup} onClose={actions.closeGrowModal} onConfirm={(setup) => actions.confirmGrow(setup, strainForSetup)} />}

            <Card><Tabs tabs={tabs} activeTab={activeTab} setActiveTab={id => setActiveTab(id as StrainViewTab)} /></Card>

            {['all', 'my-strains', 'favorites'].includes(activeTab) && (
                 <Card>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                         <div className="relative flex-grow">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder={t('strainsView.searchPlaceholder')} value={filterState.searchTerm} onChange={e => filterControls.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button onClick={openAdvancedFilterModal} variant="secondary" className="!p-2.5 sm:!px-4 sm:!py-2" title={t('strainsView.advancedFilters')}><PhosphorIcons.FunnelSimple className="w-5 h-5" /><span className="hidden sm:inline ml-1.5">{t('strainsView.advancedFilters')}</span></Button>
                             <Button onClick={() => filterControls.setShowFavorites(!filterState.showFavorites)} variant={filterState.showFavorites ? 'primary' : 'secondary'} className="!p-2.5 sm:!px-4 sm:!py-2" title={t('strainsView.favoritesOnly')}><PhosphorIcons.Heart weight={filterState.showFavorites ? 'fill' : 'regular'} className="w-5 h-5" /><span className="hidden sm:inline ml-1.5">{t('strainsView.favoritesOnly')}</span></Button>
                            <Button onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')} variant="secondary" title={t('strainsView.toggleView')} className="!p-2.5"><span className="sr-only">{t('strainsView.toggleView')}</span>{viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}</Button>
                             <div className="hidden sm:flex items-center gap-2">
                                <Button onClick={actions.openExportModal}><PhosphorIcons.DownloadSimple className="w-4 h-4 mr-1"/> {t('common.export')}</Button>
                                <Button onClick={() => actions.openAddModal()}><PhosphorIcons.PlusCircle className="w-4 h-4 mr-1"/> {t('strainsView.addStrain')}</Button>
                            </div>
                            <div ref={moreMenuRef} className="relative sm:hidden">
                                <Button variant="secondary" onClick={() => setIsMoreMenuOpen(prev => !prev)} title={t('common.moreActions')} className="!p-2.5"><span className="sr-only">{t('common.moreActions')}</span><PhosphorIcons.DotsThreeVertical className="w-5 h-5" /></Button>
                                {isMoreMenuOpen && (<Card className="absolute right-0 mt-2 w-48 z-10 p-2 animate-fade-in"><ul className="space-y-1"><li><button onClick={() => { actions.openExportModal(); setIsMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 p-2 rounded-md text-slate-200 hover:bg-slate-700 transition-colors"><PhosphorIcons.DownloadSimple className="w-5 h-5" /><span>{t('common.export')}</span></button></li><li><button onClick={() => { actions.openAddModal(); setIsMoreMenuOpen(false); }} className="w-full text-left flex items-center gap-3 p-2 rounded-md text-slate-200 hover:bg-slate-700 transition-colors"><PhosphorIcons.PlusCircle className="w-5 h-5" /><span>{t('strainsView.addStrain')}</span></button></li></ul></Card>)}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
           
            {activeTab === 'exports' && <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} updateExport={updateExport} allStrains={strainsToDisplay} onOpenExportModal={actions.openExportModal} />}
            {activeTab === 'tips' && <StrainTipsView savedTips={savedStrainTips} deleteTip={deleteStrainTip} updateTip={updateStrainTip} allStrains={strainsToDisplay} />}

            {['all', 'my-strains', 'favorites'].includes(activeTab) && (
                 isLoading ? (
                    viewMode === 'list' 
                        ? <SkeletonLoader count={10} variant="list" columns={settings.strainsViewSettings.visibleColumns} />
                        : <SkeletonLoader count={10} variant="grid" />
                 ) : viewMode === 'list' ? (
                     <div className="space-y-2">
                        <div className={`${LIST_GRID_CLASS} text-xs uppercase font-semibold text-slate-400 px-3 py-2`}>
                             <input type="checkbox" checked={selectedIds.size === sortedAndFilteredStrains.length && sortedAndFilteredStrains.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <div /><button className="text-left" onClick={() => filterControls.handleSort('name')}>{t('strainsView.table.strain')}</button>
                            {settings.strainsViewSettings.visibleColumns.type && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('type')}>{t('strainsView.table.type')}</button>}
                            {settings.strainsViewSettings.visibleColumns.thc && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('thc')}>{t('strainsView.table.thc')}</button>}
                            {settings.strainsViewSettings.visibleColumns.cbd && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('cbd')}>{t('strainsView.table.cbd')}</button>}
                            {settings.strainsViewSettings.visibleColumns.floweringTime && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('floweringTime')}>{t('strainsView.table.flowering')}</button>}
                            {settings.strainsViewSettings.visibleColumns.yield && <button className="hidden md:inline" onClick={() => filterControls.handleSort('yield')}>{t('strainsView.table.yield')}</button>}
                            <button onClick={() => filterControls.handleSort('difficulty')}>{t('strainsView.table.level')}</button><div>{t('common.actions')}</div>
                        </div>
                        {sortedAndFilteredStrains.map((strain, index) => <StrainListItem key={strain.id} strain={strain} isSelected={selectedIds.has(strain.id)} onToggleSelection={handleToggleSelection} visibleColumns={settings.strainsViewSettings.visibleColumns} isUserStrain={isUserStrain(strain.id)} onDelete={deleteUserStrain} index={index}/>)}
                     </div>
                 ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sortedAndFilteredStrains.map((strain, index) => <StrainGridItem key={strain.id} strain={strain} isUserStrain={isUserStrain(strain.id)} onDelete={deleteUserStrain} index={index}/>)}
                     </div>
                 )
            )}
        </div>
    );
};

// FIX: Remove the Provider wrapper and `setActiveView` prop.
export const StrainsView: React.FC = () => (
    <StrainsViewContent />
);