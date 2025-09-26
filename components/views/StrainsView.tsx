import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { strainService } from '@/services/strainService';
import { Strain, StrainType, StrainViewTab, SavedExport, SavedStrainTip, AIResponse } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { StrainToolbar } from './strains/StrainToolbar';
import { StrainList } from './strains/StrainList';
import { StrainGrid } from './strains/StrainGrid';
import { AddStrainModal } from './strains/AddStrainModal';
import { StrainDetailView } from './strains/StrainDetailView';
import { DataExportModal } from '../common/DataExportModal';
import { FilterDrawer } from './strains/FilterDrawer';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useStrainFilters } from '@/hooks/useStrainFilters';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { ExportsManagerView } from './strains/ExportsManagerView';
import { StrainTipsView } from './strains/StrainTipsView';
import { exportService } from '@/services/exportService';
import { Button } from '@/components/common/Button';
import { BulkActionsBar } from './strains/BulkActionsBar';

const ITEMS_PER_PAGE = 30;

export const StrainsView: React.FC = () => {
    const { t } = useTranslations();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);

    // State selection
    const { 
        activeTab, setStrainsViewTab, setStrainsViewMode, viewMode,
        selectedIds, toggleStrainSelection, toggleAllStrainSelection, clearStrainSelection,
        isAddModalOpen, openAddModal, closeAddModal, isExportModalOpen, openExportModal, closeExportModal,
        userStrains, addUserStrain, updateUserStrain, deleteUserStrain, isUserStrain,
        favorites, savedExports, deleteExport, updateExport, addExport,
        savedTips, deleteTip, addTip, updateTip,
        settings, addNotification, addMultipleToFavorites, removeMultipleFromFavorites,
        selectStrain
    } = useAppStore(state => ({
        activeTab: state.strainsViewTab, setStrainsViewTab: state.setStrainsViewTab,
        setStrainsViewMode: state.setStrainsViewMode, viewMode: state.strainsViewMode,
        selectedIds: state.selectedStrainIds,
        toggleStrainSelection: state.toggleStrainSelection,
        toggleAllStrainSelection: state.toggleAllStrainSelection,
        clearStrainSelection: state.clearStrainSelection,
        isAddModalOpen: state.isAddModalOpen, openAddModal: state.openAddModal,
        closeAddModal: state.closeAddModal, isExportModalOpen: state.isExportModalOpen,
        openExportModal: state.openExportModal, closeExportModal: state.closeExportModal,
        userStrains: state.userStrains, addUserStrain: state.addUserStrain,
        updateUserStrain: state.updateUserStrain, deleteUserStrain: state.deleteUserStrain,
        isUserStrain: (id: string) => state.userStrains.some(s => s.id === id),
        favorites: state.favoriteIds, savedExports: state.savedExports,
        deleteExport: state.deleteExport, updateExport: state.updateExport, addExport: state.addExport,
        savedTips: state.savedStrainTips, deleteTip: state.deleteStrainTip,
        addTip: state.addStrainTip, updateTip: state.updateStrainTip,
        settings: state.settings, addNotification: state.addNotification,
        addMultipleToFavorites: state.addMultipleToFavorites,
        removeMultipleFromFavorites: state.removeMultipleFromFavorites,
        selectStrain: (strain: Strain) => setSelectedStrain(strain)
    }));
    
    const handleStrainSelect = (strain: Strain) => {
        setSelectedStrain(strain);
    };

    useEffect(() => {
        setIsLoading(true);
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            setIsLoading(false);
        });
    }, [t]);

    const strainsForCurrentTab = useMemo(() => {
        switch(activeTab) {
            case 'my-strains': return userStrains;
            case 'favorites': return allStrains.filter(s => favorites.has(s.id));
            default: return allStrains;
        }
    }, [activeTab, allStrains, userStrains, favorites]);

    const { filteredStrains, isSearching, ...filterProps } = useStrainFilters(strainsForCurrentTab, settings.strainsViewSettings);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const { allAromas, allTerpenes } = useMemo(() => {
        const aromaSet = new Set<string>();
        const terpeneSet = new Set<string>();
        allStrains.forEach(strain => {
            strain.aromas?.forEach(a => aromaSet.add(a));
            strain.dominantTerpenes?.forEach(t => terpeneSet.add(t));
        });
        return {
            allAromas: Array.from(aromaSet).sort(),
            allTerpenes: Array.from(terpeneSet).sort(),
        };
    }, [allStrains]);

    const strainsToShow = useMemo(() => filteredStrains.slice(0, visibleCount), [filteredStrains, visibleCount]);
    
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
        clearStrainSelection();
    }, [filterProps.searchTerm, filterProps.typeFilter, filterProps.advancedFilters, activeTab, clearStrainSelection]);
    
    const handleAddStrain = useCallback((strain: Strain) => {
        const success = addUserStrain(strain);
        if (success) {
            addNotification(t('strainsView.addStrainModal.validation.addSuccess', { name: strain.name }), 'success');
            closeAddModal();
        } else {
            addNotification(t('strainsView.addStrainModal.validation.duplicate', { name: strain.name }), 'error');
        }
    }, [addUserStrain, closeAddModal, addNotification, t]);

    const handleUpdateStrain = useCallback((strain: Strain) => {
        updateUserStrain(strain);
        addNotification(t('strainsView.addStrainModal.validation.updateSuccess', { name: strain.name }), 'success');
        closeAddModal();
    }, [updateUserStrain, closeAddModal, addNotification, t]);
    
    const handleDeleteStrain = useCallback((id: string) => {
        const strainToDelete = userStrains.find(s => s.id === id);
        if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
            deleteUserStrain(id);
        }
    }, [userStrains, deleteUserStrain, t]);

    const handleExport = useCallback((source: 'selected' | 'all', format: 'pdf' | 'csv' | 'json' | 'txt' | 'xml') => {
        const strainsToExport = source === 'selected' 
            ? filteredStrains.filter(s => selectedIds.has(s.id))
            : filteredStrains;
        
        if (strainsToExport.length === 0) {
            addNotification(t('common.noDataToExport'), 'error');
            return;
        }

        const fileName = `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`;
        exportService.exportStrains(strainsToExport, format, fileName, t);
        
        addExport({ name: fileName, source, format, notes: '' }, strainsToExport.map(s => s.id));
    }, [filteredStrains, selectedIds, addExport, addNotification, t]);

    const handleBulkAddToFavorites = useCallback(() => {
        addMultipleToFavorites(Array.from(selectedIds));
        addNotification(t('strainsView.bulkActions.addedToFavorites', { count: selectedIds.size }), 'success');
    }, [selectedIds, addMultipleToFavorites, addNotification, t]);

    const handleBulkRemoveFromFavorites = useCallback(() => {
        removeMultipleFromFavorites(Array.from(selectedIds));
        addNotification(t('strainsView.bulkActions.removedFromFavorites', { count: selectedIds.size }), 'info');
    }, [selectedIds, removeMultipleFromFavorites, addNotification, t]);
    
    const areAllVisibleSelected = useMemo(() => {
        return strainsToShow.length > 0 && strainsToShow.every(s => selectedIds.has(s.id));
    }, [strainsToShow, selectedIds]);

    const handleToggleAll = useCallback(() => {
        toggleAllStrainSelection(strainsToShow.map(s => s.id), areAllVisibleSelected);
    }, [strainsToShow, areAllVisibleSelected, toggleAllStrainSelection]);

    const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
        startTransition(() => { setStrainsViewMode(mode); });
    }, [setStrainsViewMode]);

    const handleSetTabView = useCallback((id: string) => {
        startTransition(() => { setStrainsViewTab(id as StrainViewTab); });
    }, [setStrainsViewTab]);
    
    const handleSaveTip = useCallback((strain: Strain, tip: AIResponse) => {
        addTip(strain, tip);
        addNotification(t('strainsView.tips.saveSuccess', {name: strain.name}), 'success');
    }, [addTip, t, addNotification]);

    if (selectedStrain) {
        return <StrainDetailView 
            strain={selectedStrain} 
            onBack={() => setSelectedStrain(null)} 
            allStrains={allStrains}
            onSaveTip={handleSaveTip}
        />;
    }

    const tabs = [
        { id: 'all', label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        { id: 'my-strains', label: t('strainsView.tabs.myStrains'), icon: <PhosphorIcons.Star /> },
        { id: 'favorites', label: t('strainsView.tabs.favorites'), icon: <PhosphorIcons.Heart /> },
        { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.DownloadSimple /> },
        { id: 'tips', label: t('strainsView.tabs.tips', { count: savedTips.length }), icon: <PhosphorIcons.LightbulbFilament /> },
    ];

    const renderContent = () => {
        if (isLoading || isSearching) {
            return viewMode === 'list' ? <SkeletonLoader variant="list" count={10} columns={settings.strainsViewSettings.visibleColumns}/> : <SkeletonLoader variant="grid" count={10}/>;
        }
        
        if (filteredStrains.length === 0) {
            if (filterProps.isAnyFilterActive) {
                 return (
                    <Card className="text-center py-10 text-slate-500">
                        <PhosphorIcons.MagnifyingGlass className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="font-semibold">{t('strainsView.emptyStates.noResults.title')}</h3>
                        <p className="text-sm">{t('strainsView.emptyStates.noResults.text')}</p>
                        <Button onClick={filterProps.resetAllFilters} className="mt-4">
                            {t('strainsView.resetFilters')}
                        </Button>
                    </Card>
                );
            }

            if (activeTab === 'my-strains' || activeTab === 'favorites') {
                const emptyStateKey = activeTab === 'my-strains' ? 'myStrains' : 'favorites';
                return <Card className="text-center py-10 text-slate-500"><p>{t(`strainsView.emptyStates.${emptyStateKey}.text`)}</p></Card>;
            }
        }
        
        const content = viewMode === 'list' ? (
            <StrainList 
                strains={strainsToShow} 
                selectedIds={selectedIds}
                onToggleSelection={toggleStrainSelection}
                onSelect={handleStrainSelect}
                onToggleAll={handleToggleAll}
                sort={filterProps.sort}
                handleSort={filterProps.handleSort}
                visibleColumns={settings.strainsViewSettings.visibleColumns}
                isUserStrain={isUserStrain}
                onDelete={handleDeleteStrain}
                isPending={isPending}
            />
        ) : (
            <StrainGrid 
                strains={strainsToShow} 
                onSelect={handleStrainSelect}
                selectedIds={selectedIds}
                onToggleSelection={toggleStrainSelection}
                isUserStrain={isUserStrain} 
                onDelete={handleDeleteStrain}
                isPending={isPending}
            />
        );
        
        return (
            <>
                {content}
                {visibleCount < filteredStrains.length && (
                    <div className="mt-6 text-center">
                        <Button onClick={() => setVisibleCount(v => v + ITEMS_PER_PAGE)} variant="secondary">
                            {t('common.loadMore')} ({t('strainsView.matchingStrains', { count: filteredStrains.length - visibleCount })})
                        </Button>
                    </div>
                )}
            </>
        );
    };

    const showToolbar = activeTab === 'all' || activeTab === 'my-strains' || activeTab === 'favorites';

    return (
        <div className="space-y-4 animate-fade-in">
            <AddStrainModal isOpen={isAddModalOpen} onClose={closeAddModal} onAddStrain={handleAddStrain} onUpdateStrain={handleUpdateStrain} strainToEdit={useAppStore.getState().strainToEdit} />
            <DataExportModal isOpen={isExportModalOpen} onClose={closeExportModal} onExport={handleExport} title={t('strainsView.exportModal.title')} selectionCount={selectedIds.size} totalCount={filteredStrains.length} />
            <FilterDrawer isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onApply={() => setIsFilterDrawerOpen(false)} onReset={filterProps.resetAllFilters} tempFilterState={filterProps.advancedFilters} setTempFilterState={filterProps.setAdvancedFilters} allAromas={allAromas} allTerpenes={allTerpenes} count={filteredStrains.length} />
            
            <Card>
                <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={handleSetTabView} />
            </Card>

            {showToolbar && (
                <Card>
                    <StrainToolbar 
                        searchTerm={filterProps.searchTerm}
                        onSearchTermChange={filterProps.setSearchTerm}
                        viewMode={viewMode}
                        onViewModeChange={handleViewModeChange}
                        onExport={openExportModal}
                        onAdd={() => openAddModal(null)}
                        showFavorites={filterProps.showFavoritesOnly}
                        onToggleFavorites={() => filterProps.setShowFavoritesOnly(!filterProps.showFavoritesOnly)}
                        typeFilter={filterProps.typeFilter}
                        onToggleTypeFilter={filterProps.handleToggleTypeFilter}
                        onOpenDrawer={() => setIsFilterDrawerOpen(true)}
                        activeFilterCount={filterProps.activeFilterCount}
                        isAnyFilterActive={filterProps.isAnyFilterActive}
                        onClearAllFilters={filterProps.resetAllFilters}
                    />
                </Card>
            )}

            {selectedIds.size > 0 && showToolbar && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={clearStrainSelection}
                    onExport={openExportModal}
                    onAddToFavorites={handleBulkAddToFavorites}
                    onRemoveFromFavorites={handleBulkRemoveFromFavorites}
                />
            )}

            {activeTab === 'exports' && <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} updateExport={updateExport} allStrains={allStrains} onOpenExportModal={openExportModal} />}
            {activeTab === 'tips' && <StrainTipsView savedTips={savedTips} deleteTip={deleteTip} updateTip={updateTip} allStrains={allStrains} />}
            {showToolbar && renderContent()}
        </div>
    );
};
