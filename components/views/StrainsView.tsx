import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Strain, View, SortDirection, AIResponse, GrowSetup, StrainType, StrainViewTab } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useStrainFilters, SortKey } from '@/hooks/useStrainFilters';
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
import { FilterDrawer } from '@/components/views/strains/FilterDrawer';
import { StrainTipsView } from '@/components/views/strains/StrainTipsView';
import { GrowSetupModal } from '@/components/views/plants/GrowSetupModal';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

const EmptyState: React.FC<{ tab: StrainViewTab; onAdd: () => void; onSwitchTab: (tab: StrainViewTab) => void, isFiltered: boolean, onResetFilters: () => void }> = ({ tab, onAdd, onSwitchTab, isFiltered, onResetFilters }) => {
    const { t } = useTranslations();
    const content = useMemo(() => {
        if (isFiltered) {
             return {
                icon: <PhosphorIcons.MagnifyingGlass className="w-16 h-16 text-slate-400 mb-4" weight="regular" />,
                title: t('strainsView.emptyStates.noResults.title'),
                text: t('strainsView.emptyStates.noResults.text'),
                buttonText: t('strainsView.resetFilters'),
                buttonAction: onResetFilters
            };
        }
        if (tab === 'my-strains') {
            return {
                icon: <PhosphorIcons.Star className="w-16 h-16 text-slate-400 mb-4" weight="regular" />,
                title: t('strainsView.emptyStates.myStrains.title'),
                text: t('strainsView.emptyStates.myStrains.text'),
                buttonText: t('strainsView.addStrain'),
                buttonAction: onAdd
            };
        }
        if (tab === 'favorites') {
            return {
                icon: <PhosphorIcons.Heart className="w-16 h-16 text-slate-400 mb-4" weight="regular" />,
                title: t('strainsView.emptyStates.favorites.title'),
                text: t('strainsView.emptyStates.favorites.text'),
                buttonText: t('strainsView.emptyStates.favorites.button'),
                buttonAction: () => onSwitchTab('all')
            };
        }
        return null;
    }, [tab, t, onAdd, onSwitchTab, isFiltered, onResetFilters]);

    if (!content) return null;

    return (
        <Card className="text-center py-10 text-slate-500">
            {content.icon}
            <h3 className="font-semibold text-lg text-slate-300">{content.title}</h3>
            <p className="text-sm mb-4">{content.text}</p>
            <Button onClick={content.buttonAction}>{content.buttonText}</Button>
        </Card>
    );
};


const StrainsViewContent: React.FC = () => {
    const { t } = useTranslations();
    const { 
        settings, userStrains, addUserStrain, updateUserStrain, deleteUserStrain, isUserStrain,
        savedExports, addExport, deleteExport, updateExport, savedStrainTips, addStrainTip, updateStrainTip, deleteStrainTip,
        addNotification, selectedStrain, strainToEdit, strainForSetup, isAddModalOpen, isExportModalOpen, isSetupModalOpen, favoriteIds,
        activeTab, viewMode, selectedIds,
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
        activeTab: state.strainsViewTab,
        viewMode: state.strainsViewMode,
        selectedIds: state.selectedStrainIds,
        actions: {
            setStrainsViewTab: state.setStrainsViewTab,
            setStrainsViewMode: state.setStrainsViewMode,
            toggleStrainSelection: state.toggleStrainSelection,
            toggleAllStrainSelection: state.toggleAllStrainSelection,
            clearStrainSelection: state.clearStrainSelection,
            closeAddModal: () => state.closeAddModal(),
            openAddModal: (strain?: Strain) => state.openAddModal(strain),
            closeExportModal: () => state.closeExportModal(),
            openExportModal: () => state.openExportModal(),
            closeGrowModal: () => state.closeGrowModal(),
            confirmGrow: (setup: GrowSetup, strain: Strain) => {
                const success = useAppStore.getState().startNewPlant(strain, setup);
                if(success) {
                    state.closeGrowModal();
                    state.setActiveView(View.Plants);
                }
            },
            closeDetailModal: () => state.closeDetailModal()
        }
    }));
    
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);
    const [typeFilter, setTypeFilter] = useState<Set<StrainType>>(new Set());

    useEffect(() => {
        setIsLoading(true);
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load strains:", err);
            addNotification(t('strainsView.loadError'), 'error');
            setIsLoading(false);
        });
    }, [t, addNotification]);

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
        sort, handleSort, isDrawerOpen, openDrawer, closeAndApply, closeAndDiscard,
        draftFilters, setDraftFilters, strainsForDisplay, previewCount,
        resetAllFilters, activeFilterCount
    } = useStrainFilters(strainsToDisplay, favoriteIds, {
        key: settings.strainsViewSettings.defaultSortKey, direction: settings.strainsViewSettings.defaultSortDirection,
    }, { searchTerm, showFavorites, typeFilter });

    const handleClearAllFilters = () => {
        resetAllFilters();
        setShowFavorites(false);
        setSearchTerm('');
        setTypeFilter(new Set());
    };
    
    const handleToggleTypeFilter = (type: StrainType) => {
        setTypeFilter(prev => {
            const newSet = new Set(prev);
            newSet.has(type) ? newSet.delete(type) : newSet.add(type);
            return newSet;
        });
    };

    const isAnyFilterActive = searchTerm || showFavorites || typeFilter.size > 0 || activeFilterCount > 0;

    const handleToggleAll = () => actions.toggleAllStrainSelection(strainsForDisplay.map(s => s.id), selectedIds.size === strainsForDisplay.length);

    const handleExport = (source: 'selected' | 'favorites' | 'filtered' | 'all', format: 'pdf' | 'txt' | 'csv' | 'json') => {
        let strainsToExport: Strain[] = [];
        const sourceStrains = [...allStrains, ...userStrains];
        switch(source) {
            case 'selected': strainsToExport = sourceStrains.filter(s => selectedIds.has(s.id)); break;
            case 'favorites': strainsToExport = sourceStrains.filter(s => favoriteIds.has(s.id)); break;
            case 'filtered': strainsToExport = strainsForDisplay; break;
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
    
    const handleSaveTip = (strain: Strain, tip: AIResponse) => {
        addStrainTip(strain, tip);
        actions.setStrainsViewTab('tips');
        actions.closeDetailModal();
    };

    // FIX: Using flatMap for a cleaner and more efficient way to flatten and collect arrays.
    const allAromas: string[] = useMemo(() => [...new Set(strainsToDisplay.flatMap(s => s.aromas || []))].sort(), [strainsToDisplay]);
    // FIX: Using flatMap for a cleaner and more efficient way to flatten and collect arrays.
    const allTerpenes: string[] = useMemo(() => [...new Set(strainsToDisplay.flatMap(s => s.dominantTerpenes || []))].sort(), [strainsToDisplay]);

    const tabs = [
        { id: 'all', label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        { id: 'my-strains', label: t('strainsView.tabs.myStrains'), icon: <PhosphorIcons.Star weight="fill" /> },
        { id: 'favorites', label: t('strainsView.tabs.favorites'), icon: <PhosphorIcons.Heart /> },
        { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.ArchiveBox /> },
        { id: 'tips', label: t('strainsView.tabs.tips', { count: savedStrainTips.length }), icon: <PhosphorIcons.LightbulbFilament /> },
    ];
    
    const SortIndicator: React.FC<{ sortKey: SortKey }> = ({ sortKey }) => {
        if (sort.key !== sortKey) return <div className="w-4 h-4 opacity-20"><PhosphorIcons.ArrowUp /></div>;
        return sort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-4 h-4" /> : <PhosphorIcons.ArrowDown className="w-4 h-4" />;
    };

    return (
        <div className="space-y-4">
            {selectedStrain && <StrainDetailModal strain={selectedStrain} onSaveTip={handleSaveTip} />}
            {isAddModalOpen && <AddStrainModal isOpen={isAddModalOpen} onClose={actions.closeAddModal} onAddStrain={(s) => { addUserStrain(s); actions.closeAddModal(); }} onUpdateStrain={(s) => { updateUserStrain(s); actions.closeAddModal(); }} strainToEdit={strainToEdit} />}
            {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onClose={actions.closeExportModal} onExport={handleExport} selectionCount={selectedIds.size} favoritesCount={favoriteIds.size} filteredCount={strainsForDisplay.length} totalCount={strainsToDisplay.length} />}
            {isDrawerOpen && <FilterDrawer isOpen={isDrawerOpen} onClose={closeAndDiscard} onApply={closeAndApply} onReset={resetAllFilters} tempFilterState={draftFilters} setTempFilterState={setDraftFilters} allAromas={allAromas} allTerpenes={allTerpenes} count={previewCount}/>}
            {isSetupModalOpen && strainForSetup && <GrowSetupModal strain={strainForSetup} onClose={actions.closeGrowModal} onConfirm={(setup) => actions.confirmGrow(setup, strainForSetup)} />}

            <Card><Tabs tabs={tabs} activeTab={activeTab} setActiveTab={id => actions.setStrainsViewTab(id as StrainViewTab)} /></Card>

            {['all', 'my-strains', 'favorites'].includes(activeTab) && (
                 <Card>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                         <div className="relative flex-grow">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder={t('strainsView.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                             <div className="flex items-center bg-slate-800/60 border border-slate-700/80 rounded-lg p-1 gap-1">
                                <button onClick={() => actions.setStrainsViewMode(viewMode === 'list' ? 'grid' : 'list')} title={t('strainsView.toggleView')} className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                                    {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}
                                </button>
                            </div>
                            <Button onClick={actions.openExportModal} variant="secondary" className="!py-2 !px-3">
                                <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-1.5" />
                                <span>{t('common.export')}</span>
                            </Button>
                            <Button onClick={() => actions.openAddModal()} variant="primary" className="!py-2 !px-3">
                                <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />
                                <span>{t('strainsView.addStrain')}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2 items-center overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                        <button onClick={() => setShowFavorites(!showFavorites)} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 ${showFavorites ? 'bg-primary-500/80 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                            <PhosphorIcons.Heart weight={showFavorites ? 'fill' : 'regular'} />
                            <span>{t('strainsView.favorites')}</span>
                        </button>
                        <div className="w-px h-5 bg-slate-700 mx-1"></div>
                        {(['Sativa', 'Indica', 'Hybrid'] as StrainType[]).map(type => (
                            <button key={type} onClick={() => handleToggleTypeFilter(type)} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 ${typeFilter.has(type) ? 'bg-primary-500/80 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                                {t(`strainsView.${type.toLowerCase()}`)}
                            </button>
                        ))}
                        <div className="w-px h-5 bg-slate-700 mx-1"></div>
                        <button onClick={openDrawer} className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 bg-slate-800 text-slate-200 hover:bg-slate-700">
                            <PhosphorIcons.FunnelSimple />
                            <span>{t('strainsView.advancedFilters')}</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {isAnyFilterActive && (
                            <Button onClick={handleClearAllFilters} variant="secondary" size="sm" className="ml-2 flex-shrink-0 !py-1 !px-2.5">
                                <PhosphorIcons.X className="w-4 h-4 mr-1" />
                                {t('common.all')}
                            </Button>
                        )}
                    </div>

                    <div className="sm:hidden mt-4 flex items-center gap-2">
                        <Button onClick={() => actions.openAddModal()} variant="primary" className="flex-1">
                            <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />
                            <span>{t('strainsView.addStrain')}</span>
                        </Button>
                        <Button onClick={actions.openExportModal} variant="secondary" className="flex-1">
                            <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-1.5" />
                            <span>{t('common.export')}</span>
                        </Button>
                         <Button onClick={() => actions.setStrainsViewMode(viewMode === 'list' ? 'grid' : 'list')} title={t('strainsView.toggleView')} variant="secondary" className="p-2.5">
                             <span className="sr-only">{t('strainsView.toggleView')}</span>
                            {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}
                        </Button>
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
                        <div className={`${LIST_GRID_CLASS} sticky top-16 z-10 bg-slate-900/70 backdrop-blur-md border-b border-slate-700/50 text-xs uppercase font-semibold text-slate-400 px-3 py-2 rounded-lg`}>
                             <input type="checkbox" checked={selectedIds.size === strainsForDisplay.length && strainsForDisplay.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <button className="flex items-center gap-1 text-left hover:text-slate-100" onClick={() => handleSort('name')}>{t('strainsView.table.strain')}<SortIndicator sortKey="name" /></button>
                            {/* FIX: Explicitly cast to boolean for conditional rendering to avoid type errors and ensure correct behavior. */}
                            {Boolean(settings.strainsViewSettings.visibleColumns.type) && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('type')}>{t('strainsView.table.type')}<SortIndicator sortKey="type" /></button>}
                            {/* FIX: Explicitly cast to boolean for conditional rendering to avoid type errors and ensure correct behavior. */}
                            {Boolean(settings.strainsViewSettings.visibleColumns.thc) && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('thc')}>{t('strainsView.table.thc')}<SortIndicator sortKey="thc" /></button>}
                            {/* FIX: Explicitly cast to boolean for conditional rendering to avoid type errors and ensure correct behavior. */}
                            {Boolean(settings.strainsViewSettings.visibleColumns.cbd) && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('cbd')}>{t('strainsView.table.cbd')}<SortIndicator sortKey="cbd" /></button>}
                            {/* FIX: Explicitly cast to boolean for conditional rendering to avoid type errors and ensure correct behavior. */}
                            {Boolean(settings.strainsViewSettings.visibleColumns.floweringTime) && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('floweringTime')}>{t('strainsView.table.flowering')}<SortIndicator sortKey="floweringTime" /></button>}
                            {/* FIX: Explicitly cast to boolean for conditional rendering to avoid type errors and ensure correct behavior. */}
                            {Boolean(settings.strainsViewSettings.visibleColumns['yield']) && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('yield')}>{t('strainsView.table.yield')}<SortIndicator sortKey="yield" /></button>}
                            <button className="flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('difficulty')}>{t('strainsView.table.level')}<SortIndicator sortKey="difficulty" /></button>
                            <div className="text-right">{t('common.actions')}</div>
                        </div>
                        {selectedIds.size > 0 && 
                            <div className="text-sm text-slate-300 px-3 py-1 flex items-center gap-2">
                               <span>{t('strainsView.selectedCount', {count: selectedIds.size})}</span>
                               <button onClick={() => actions.clearStrainSelection()} className="text-primary-400 hover:underline text-xs">{t('strainsView.clearSelection')}</button>
                            </div>
                        }
                        {strainsForDisplay.length > 0 ? (
                            strainsForDisplay.map((strain, index) => <StrainListItem key={strain.id} strain={strain} isSelected={selectedIds.has(strain.id)} onToggleSelection={actions.toggleStrainSelection} visibleColumns={settings.strainsViewSettings.visibleColumns} isUserStrain={isUserStrain(strain.id)} onDelete={deleteUserStrain} index={index}/>)
                        ) : (
                            <EmptyState tab={activeTab as StrainViewTab} onAdd={() => actions.openAddModal()} onSwitchTab={actions.setStrainsViewTab} isFiltered={isAnyFilterActive} onResetFilters={handleClearAllFilters} />
                        )}
                     </div>
                 ) : (
                     strainsForDisplay.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {strainsForDisplay.map((strain, index) => <StrainGridItem key={strain.id} strain={strain} isUserStrain={isUserStrain(strain.id)} onDelete={deleteUserStrain} index={index}/>)}
                        </div>
                     ) : (
                         <EmptyState tab={activeTab as StrainViewTab} onAdd={() => actions.openAddModal()} onSwitchTab={actions.setStrainsViewTab} isFiltered={isAnyFilterActive} onResetFilters={handleClearAllFilters} />
                     )
                 )
            )}
        </div>
    );
};

export const StrainsView: React.FC = () => (
    <StrainsViewContent />
);