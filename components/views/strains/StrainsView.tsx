import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, StrainViewTab, AppSettings, SavedExport, SavedStrainTip, StrainType } from '@/types';
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
    StrainsViewState,
    setSelectedStrainId
} from '@/stores/slices/strainsViewSlice';
import { openAddModal, closeAddModal, openExportModal, closeExportModal, addNotification } from '@/stores/slices/uiSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from '@/stores/slices/favoritesSlice';
import { addUserStrainWithValidation, updateUserStrainAndCloseModal, deleteUserStrain } from '@/stores/slices/userStrainsSlice';
import { StrainDetailView } from './strains/StrainDetailView';
import { AddStrainModal } from './strains/AddStrainModal';
import { DataExportModal } from '@/components/common/DataExportModal';
import { addExport, updateExport, deleteExport, addStrainTip, updateStrainTip, deleteStrainTip } from '@/stores/slices/savedItemsSlice';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { FilterDrawer } from './strains/FilterDrawer';
import { initialAdvancedFilters } from '@/stores/slices/filtersSlice';
import { exportService } from '@/services/exportService';
import { StrainSubNav } from './strains/StrainSubNav';

// --- Lazy Loaded Views for Performance ---
const StrainLibraryView = lazy(() => import('./strains/StrainLibraryView').then(m => ({ default: m.StrainLibraryView })));
const ExportsManagerView = lazy(() => import('./strains/ExportsManagerView').then(m => ({ default: m.ExportsManagerView })));
const StrainTipsView = lazy(() => import('./strains/StrainTipsView').then(m => ({ default: m.StrainTipsView })));
const GenealogyView = lazy(() => import('./strains/GenealogyView').then(m => ({ default: m.GenealogyView })));


export const StrainsView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const settings = useAppSelector(selectSettings) as AppSettings;
    const { strainsViewTab, strainsViewMode, selectedStrainIds, selectedStrainId } = useAppSelector(selectStrainsView) as StrainsViewState;
    const selectedStrainForDetail = useMemo(() => allStrains.find(s => s.id === selectedStrainId) || null, [allStrains, selectedStrainId]);
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
    }, [filteredStrains, strainsViewTab]);
    
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
    
    const handleAddStrain = (strain: Strain) => dispatch(addUserStrainWithValidation(strain));
    const handleUpdateStrain = (strain: Strain) => dispatch(updateUserStrainAndCloseModal(strain));
    
    const handleDeleteUserStrain = useCallback((id: string) => {
        const strainToDelete = userStrains.find(s => s.id === id);
        if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
            dispatch(deleteUserStrain(id));
        }
    }, [dispatch, userStrains, t]);

    const handleBulkDelete = useCallback(() => {
        if (strainsViewTab === StrainViewTab.MyStrains && window.confirm(t('strainsView.exportsManager.deleteConfirmPlural', { count: selectedIdsSet.size }))) {
            selectedIdsSet.forEach(id => dispatch(deleteUserStrain(id)));
            dispatch(clearStrainSelection());
        }
    }, [strainsViewTab, selectedIdsSet, t, dispatch]);

     const handleExport = (source: 'selected' | 'all', format: 'pdf' | 'csv' | 'json' | 'txt' | 'xml') => {
        if (!window.confirm(t('common.exportConfirm'))) return;

        const strainsToExport = source === 'selected' ? allStrains.filter(s => selectedIdsSet.has(s.id)) : filteredStrains;
        if (strainsToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            return;
        }
        
        const exportName = `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`;
        
        exportService.exportStrains(strainsToExport, format, exportName);

        if (['csv', 'json', 'xml'].includes(format)) {
             dispatch(addExport({ data: { name: exportName, source, format, notes: '' }, strainIds: strainsToExport.map(s => s.id) }));
        }
        
        dispatch(addNotification({ message: t('common.successfullyExported_other', { count: strainsToExport.length, format: format.toUpperCase() }), type: 'success' }));
        dispatch(closeExportModal());
    };

    const handleToggleFavorite = useCallback((id: string) => {
        dispatch(toggleFavorite(id));
    }, [dispatch]);
    
    const allAromas = useMemo(() => [...new Set(allStrains.flatMap(s => s.aromas || []))].sort(), [allStrains]);
    const allTerpenes = useMemo(() => [...new Set(allStrains.flatMap(s => s.dominantTerpenes || []))].sort(), [allStrains]);

    if (selectedStrainForDetail) {
        return (
            <div className="animate-fade-in">
                <StrainDetailView 
                    strain={selectedStrainForDetail}
                    onBack={() => dispatch(setSelectedStrainId(null))} 
                />
            </div>
        );
    }
    
    const renderContent = () => {
        if (isLoading) return <SkeletonLoader variant="list" count={5} />;

        switch (strainsViewTab) {
            case StrainViewTab.All:
            case StrainViewTab.MyStrains:
            case StrainViewTab.Favorites:
                return (
                    <Suspense fallback={<SkeletonLoader variant={strainsViewMode} count={10} />}>
                        <StrainLibraryView
                            strains={filteredStrains}
                            totalStrainCount={filteredStrains.length}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                            viewMode={strainsViewMode}
                            isSearching={isSearching}
                            searchTerm={searchTerm}
                            onSearchTermChange={setSearchTerm}
                            sort={sort}
                            handleSort={handleSort}
                            letterFilter={letterFilter}
                            handleSetLetterFilter={handleSetLetterFilter}
                            typeFilter={typeFilter}
                            onToggleTypeFilter={handleToggleTypeFilter}
                            isAnyFilterActive={isAnyFilterActive}
                            onResetFilters={resetAllFilters}
                            onOpenDrawer={() => setIsDrawerOpen(true)}
                            activeFilterCount={activeFilterCount}
                            selectedIds={selectedIdsSet}
                            onToggleSelection={(id) => dispatch(toggleStrainSelection(id))}
                            onSelect={(strain) => dispatch(setSelectedStrainId(strain.id))}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                            isUserStrain={(id) => userStrainIds.has(id)}
                            onDeleteUserStrain={handleDeleteUserStrain}
                            onClearSelection={() => dispatch(clearStrainSelection())}
                            onExport={() => dispatch(openExportModal())}
                            onAddToFavorites={() => dispatch(addMultipleToFavorites(selectedStrainIds))}
                            onRemoveFromFavorites={() => dispatch(removeMultipleFromFavorites(selectedStrainIds))}
                            onDelete={strainsViewTab === StrainViewTab.MyStrains ? handleBulkDelete : undefined}
                        />
                    </Suspense>
                );
            case StrainViewTab.Exports:
                return (
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <ExportsManagerView 
                            savedExports={savedExports} 
                            deleteExport={(id) => dispatch(deleteExport(id))} 
                            updateExport={(exp) => dispatch(updateExport(exp))}
                            allStrains={allStrains}
                            onOpenExportModal={() => dispatch(openExportModal())}
                        />
                    </Suspense>
                );
            case StrainViewTab.Tips:
                return (
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <StrainTipsView 
                            savedTips={savedTips}
                            deleteTip={(id) => dispatch(deleteStrainTip(id))}
                            updateTip={(tip) => dispatch(updateStrainTip(tip))}
                            allStrains={allStrains}
                        />
                    </Suspense>
                );
            case StrainViewTab.Genealogy:
                return (
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <GenealogyView allStrains={allStrains} onNodeClick={(strain) => dispatch(setSelectedStrainId(strain.id))} />
                    </Suspense>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center mb-6">
                <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{t('nav.strains')}</h2>
            </div>
            
            <StrainSubNav 
                activeTab={strainsViewTab} 
                onTabChange={(id) => dispatch(setStrainsViewTab(id))} 
                counts={{ exports: savedExports.length, tips: savedTips.length }}
            />
            
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
            
            {renderContent()}
        </div>
    );
};
