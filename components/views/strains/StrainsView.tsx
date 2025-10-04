import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, StrainViewTab, AIResponse, AppSettings, SavedExport, SavedStrainTip, StrainType } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { strainService } from '@/services/strainService';
import { useStrainFilters } from '@/hooks/useStrainFilters';
import { 
  selectUserStrains, 
  selectUserStrainIds, 
  selectFavoriteIds, 
  selectSettings, 
  selectStrainsView,
  selectSavedExports,
  selectSavedStrainTips
} from '@/stores/selectors';
import { 
    setStrainsViewTab, 
    toggleStrainSelection, 
    toggleAllStrainSelection, 
    clearStrainSelection, 
    StrainsViewState
} from '@/stores/slices/strainsViewSlice';
import { openAddModal, closeAddModal, openExportModal, closeExportModal, addNotification, initiateGrowFromStrainList } from '@/stores/slices/uiSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from '@/stores/slices/favoritesSlice';
import { addUserStrainWithValidation, updateUserStrainAndCloseModal, deleteUserStrain } from '@/stores/slices/userStrainsSlice';
import { StrainToolbar } from './strains/StrainToolbar';
import { StrainList } from './strains/StrainList';
import { StrainGrid } from './strains/StrainGrid';
import { StrainDetailView } from './strains/StrainDetailView';
import { AddStrainModal } from './strains/AddStrainModal';
import { DataExportModal } from '@/components/common/DataExportModal';
import { ExportsManagerView } from './strains/ExportsManagerView';
import { StrainTipsView } from './strains/StrainTipsView';
import { addExport, updateExport, deleteExport, addStrainTip, updateStrainTip, deleteStrainTip } from '@/stores/slices/savedItemsSlice';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { BulkActionsBar } from './strains/BulkActionsBar';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { FilterDrawer } from './strains/FilterDrawer';
import { initialAdvancedFilters } from '@/stores/slices/filtersSlice';
import { exportService } from '@/services/exportService';
import { GenealogyView } from './strains/GenealogyView';
import { AlphabeticalFilter } from './strains/AlphabeticalFilter';
import { SegmentedControl } from '../common/SegmentedControl';
import { Button } from '@/components/common/Button';
import { Pagination } from '@/components/common/Pagination';
import { StrainListHeader } from './strains/StrainListHeader';

const ITEMS_PER_PAGE = 25;

export const StrainsView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStrainForDetail, setSelectedStrainForDetail] = useState<Strain | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const settings = useAppSelector(selectSettings) as AppSettings;
    const { strainsViewTab, strainsViewMode, selectedStrainIds } = useAppSelector(selectStrainsView) as StrainsViewState;
    const userStrains = useAppSelector(selectUserStrains) as Strain[];
    const userStrainIds = useAppSelector(selectUserStrainIds) as Set<string>;
    const favoriteIds = useAppSelector(selectFavoriteIds) as Set<string>;
    const savedExports = useAppSelector(selectSavedExports) as SavedExport[];
    const savedTips = useAppSelector(selectSavedStrainTips) as SavedStrainTip[];
    const isAddModalOpen = useAppSelector(state => state.ui.isAddModalOpen);
    const strainToEdit = useAppSelector(state => state.ui.strainToEdit);
    const isExportModalOpen = useAppSelector(state => state.ui.isExportModalOpen);

    const selectedIdsSet = useMemo(() => new Set<string>(selectedStrainIds), [selectedStrainIds]);

    useEffect(() => {
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            setIsLoading(false);
        });
    }, []);

    const strainsForCurrentTab = useMemo(() => {
        switch (strainsViewTab) {
            case StrainViewTab.MyStrains: return userStrains;
            case StrainViewTab.Favorites: return allStrains.filter(s => favoriteIds.has(s.id));
            case StrainViewTab.All: default: return allStrains;
        }
    }, [strainsViewTab, allStrains, userStrains, favoriteIds]);

    const {
        filteredStrains, isSearching, searchTerm, setSearchTerm, typeFilter, handleToggleTypeFilter,
        showFavoritesOnly, setShowFavoritesOnly, advancedFilters, setAdvancedFilters,
        letterFilter, handleSetLetterFilter, resetAllFilters, sort, handleSort, isAnyFilterActive, activeFilterCount
    } = useStrainFilters(strainsForCurrentTab, settings.strainsViewSettings);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredStrains.length, strainsViewTab]);

    const totalPages = Math.ceil(filteredStrains.length / ITEMS_PER_PAGE);
    const currentStrains = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredStrains.slice(start, end);
    }, [filteredStrains, currentPage]);
    
    const [tempFilterState, setTempFilterState] = useState(advancedFilters);
    useEffect(() => setTempFilterState(advancedFilters), [advancedFilters]);

    const handleApplyFilters = () => {
        setAdvancedFilters(tempFilterState);
        setIsDrawerOpen(false);
    };

    const handleResetFilters = () => {
        resetAllFilters();
        setTempFilterState(initialAdvancedFilters);
        setIsDrawerOpen(false);
    };
    
    const areAllOnPageSelected = useMemo(() => 
        currentStrains.length > 0 && currentStrains.every(s => selectedIdsSet.has(s.id)),
        [currentStrains, selectedIdsSet]
    );

    const handleToggleAll = () => {
        dispatch(toggleAllStrainSelection({ 
            ids: currentStrains.map(s => s.id)
        }));
    };
    
    const handleAddStrain = (strain: Strain) => dispatch(addUserStrainWithValidation(strain));
    const handleUpdateStrain = (strain: Strain) => {
        dispatch(updateUserStrainAndCloseModal(strain));
    };
    const handleDeleteUserStrain = (id: string) => {
        const strainToDelete = userStrains.find(s => s.id === id);
        if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
            dispatch(deleteUserStrain(id));
        }
    };
    const handleBulkDelete = () => {
        if (strainsViewTab === StrainViewTab.MyStrains && window.confirm(t('strainsView.exportsManager.deleteConfirmPlural', { count: selectedIdsSet.size }))) {
            selectedIdsSet.forEach(id => dispatch(deleteUserStrain(id)));
            dispatch(clearStrainSelection());
        }
    };

     const handleExport = (source: 'selected' | 'all', format: 'pdf' | 'csv' | 'json' | 'txt' | 'xml') => {
        const strainsToExport = source === 'selected' ? allStrains.filter(s => selectedIdsSet.has(s.id)) : filteredStrains;
        if (strainsToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            return;
        }
        
        const exportName = `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`;
        if(format === 'pdf' || format === 'txt') {
             exportService.exportStrains(strainsToExport, format, exportName);
        } else {
             dispatch(addExport({ data: { name: exportName, source, format, notes: '' }, strainIds: strainsToExport.map(s => s.id) }));
        }
        dispatch(addNotification({ message: t('common.successfullyExported_other', { count: strainsToExport.length, format: format.toUpperCase() }), type: 'success' }));
    };

    const tabs = [
        { id: StrainViewTab.All, label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        { id: StrainViewTab.MyStrains, label: t('strainsView.tabs.myStrains'), icon: <PhosphorIcons.Star /> },
        { id: StrainViewTab.Favorites, label: t('strainsView.tabs.favorites'), icon: <PhosphorIcons.Heart /> },
        { id: StrainViewTab.Genealogy, label: t('strainsView.tabs.genealogy'), icon: <PhosphorIcons.TreeStructure /> },
        { id: StrainViewTab.Exports, label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.DownloadSimple /> },
        { id: StrainViewTab.Tips, label: t('strainsView.tabs.tips', { count: savedTips.length }), icon: <PhosphorIcons.LightbulbFilament /> },
    ];
    
    const allAromas = useMemo(() => [...new Set(allStrains.flatMap(s => s.aromas || []))].sort(), [allStrains]);
    const allTerpenes = useMemo(() => [...new Set(allStrains.flatMap(s => s.dominantTerpenes || []))].sort(), [allStrains]);

    if (selectedStrainForDetail) {
        return <StrainDetailView 
                    strain={selectedStrainForDetail}
                    onBack={() => setSelectedStrainForDetail(null)} 
                    onSaveTip={(strain, tip, imageUrl) => dispatch(addStrainTip({ strain, tip, imageUrl }))} 
                />;
    }

    const renderContent = () => {
        if (isLoading) {
            return <SkeletonLoader variant={strainsViewMode} count={10} />;
        }
        if ([StrainViewTab.All, StrainViewTab.MyStrains, StrainViewTab.Favorites].includes(strainsViewTab)) {
             return (
                <>
                    {/* Sticky Header Block */}
                    <div className="sticky top-[-1rem] sm:top-[-1.5rem] z-20 bg-slate-900 pt-2 sm:pt-4 pb-1 sm:pb-2 space-y-2 sm:space-y-4">
                        <StrainToolbar
                            searchTerm={searchTerm}
                            onSearchTermChange={setSearchTerm}
                            onExport={() => dispatch(openExportModal())}
                            onAdd={() => dispatch(openAddModal(null))}
                            onOpenDrawer={() => setIsDrawerOpen(true)}
                            activeFilterCount={activeFilterCount}
                        />

                        <AlphabeticalFilter activeLetter={letterFilter} onLetterClick={handleSetLetterFilter} />

                        <div className="hidden sm:flex items-center gap-4">
                            <SegmentedControl 
                                options={[
                                    { value: 'Sativa', label: t('strainsView.sativa') },
                                    { value: 'Indica', label: t('strainsView.indica') },
                                    { value: 'Hybrid', label: t('strainsView.hybrid') },
                                ]}
                                value={typeFilter}
                                onToggle={handleToggleTypeFilter}
                            />
                            <Button onClick={() => setIsDrawerOpen(true)} variant="secondary" className="relative !py-2">
                                 <PhosphorIcons.FunnelSimple className="w-5 h-5 mr-1.5"/>
                                 <span>{t('strainsView.advancedFilters')}</span>
                                 {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{activeFilterCount}</span>}
                            </Button>
                            {isAnyFilterActive && <Button variant="ghost" onClick={resetAllFilters}>{t('strainsView.resetFilters')}</Button>}
                        </div>

                        {/* Mobile type filter */}
                         <div className="sm:hidden">
                            <SegmentedControl 
                                options={[
                                    { value: 'Sativa' as StrainType, label: t('strainsView.sativa') },
                                    { value: 'Indica' as StrainType, label: t('strainsView.indica') },
                                    { value: 'Hybrid' as StrainType, label: t('strainsView.hybrid') },
                                ]}
                                value={typeFilter}
                                onToggle={handleToggleTypeFilter}
                            />
                        </div>
                        
                        {strainsViewMode === 'list' && (
                            <StrainListHeader
                                sort={sort}
                                handleSort={handleSort}
                                areAllOnPageSelected={areAllOnPageSelected}
                                onToggleAll={handleToggleAll}
                            />
                        )}
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="space-y-4">
                        {filteredStrains.length === 0 && !isSearching ? (
                            <Card className="text-center py-10 text-slate-500">
                                 <h3 className="font-semibold">{t('strainsView.emptyStates.noResults.title')}</h3>
                                 <p className="text-sm">{t('strainsView.emptyStates.noResults.text')}</p>
                            </Card>
                        ) : strainsViewMode === 'list' ? (
                            <StrainList
                                strains={currentStrains}
                                selectedIds={selectedIdsSet}
                                onToggleSelection={(id) => dispatch(toggleStrainSelection(id))}
                                onSelect={setSelectedStrainForDetail}
                                isUserStrain={(id) => userStrainIds.has(id)}
                                onDelete={handleDeleteUserStrain}
                                isPending={isSearching}
                                favorites={favoriteIds}
                                onToggleFavorite={(id) => dispatch(toggleFavorite(id))}
                            />
                        ) : (
                            <StrainGrid
                                strains={currentStrains}
                                selectedIds={selectedIdsSet}
                                onToggleSelection={(id) => dispatch(toggleStrainSelection(id))}
                                onSelect={setSelectedStrainForDetail}
                                isUserStrain={(id) => userStrainIds.has(id)}
                                onDelete={handleDeleteUserStrain}
                                isPending={isSearching}
                                favorites={favoriteIds}
                                onToggleFavorite={(id) => dispatch(toggleFavorite(id))}
                            />
                        )}
                        
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                    
                    {selectedIdsSet.size > 0 && (
                        <BulkActionsBar
                            selectedCount={selectedIdsSet.size}
                            onClearSelection={() => dispatch(clearStrainSelection())}
                            onExport={() => dispatch(openExportModal())}
                            onAddToFavorites={() => dispatch(addMultipleToFavorites(selectedStrainIds))}
                            onRemoveFromFavorites={() => dispatch(removeMultipleFromFavorites(selectedStrainIds))}
                            onDelete={strainsViewTab === StrainViewTab.MyStrains ? handleBulkDelete : undefined}
                        />
                    )}
                </>
            );
        }
        if (strainsViewTab === StrainViewTab.Exports) {
            return <ExportsManagerView 
                        savedExports={savedExports} 
                        deleteExport={(id) => dispatch(deleteExport(id))} 
                        updateExport={(exp) => dispatch(updateExport(exp))}
                        allStrains={allStrains}
                        onOpenExportModal={() => dispatch(openExportModal())}
                   />;
        }
        if (strainsViewTab === StrainViewTab.Tips) {
            return <StrainTipsView 
                        savedTips={savedTips}
                        deleteTip={(id) => dispatch(deleteStrainTip(id))}
                        updateTip={(tip) => dispatch(updateStrainTip(tip))}
                        allStrains={allStrains}
                    />;
        }
        if (strainsViewTab === StrainViewTab.Genealogy) {
            return <GenealogyView allStrains={allStrains} onNodeClick={setSelectedStrainForDetail} />;
        }
        return null;
    };

    return (
        <div className="space-y-4">
            {isAddModalOpen && <AddStrainModal isOpen={true} onClose={() => dispatch(closeAddModal())} onAddStrain={handleAddStrain} onUpdateStrain={handleUpdateStrain} strainToEdit={strainToEdit} />}
            <DataExportModal isOpen={isExportModalOpen} onClose={() => dispatch(closeExportModal())} onExport={handleExport} title={t('strainsView.exportModal.title')} selectionCount={selectedIdsSet.size} totalCount={filteredStrains.length} />
            <FilterDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                onApply={handleApplyFilters} 
                onReset={handleResetFilters} 
                tempFilterState={tempFilterState} 
                setTempFilterState={(f) => setTempFilterState(s => ({...s, ...f}))} 
                allAromas={allAromas} 
                allTerpenes={allTerpenes} 
                count={filteredStrains.length}
                showFavorites={showFavoritesOnly}
                onToggleFavorites={(val) => setShowFavoritesOnly(val)}
                typeFilter={typeFilter}
                onToggleTypeFilter={handleToggleTypeFilter}
                letterFilter={letterFilter}
                onLetterFilterChange={handleSetLetterFilter}
                isAnyFilterActive={isAnyFilterActive}
            />
            
            <Card><Tabs tabs={tabs} activeTab={strainsViewTab} setActiveTab={(id) => dispatch(setStrainsViewTab(id as StrainViewTab))} /></Card>
            
            {renderContent()}
        </div>
    );
};