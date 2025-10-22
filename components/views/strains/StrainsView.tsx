import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, StrainViewTab, AppSettings, SavedStrainTip, StrainType, SavedExport } from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { strainService } from '@/services/strainService';
import { useStrainFilters } from '@/hooks/useStrainFilters';
import { urlService } from '@/services/urlService';
import { hydrateFilters } from '@/stores/slices/filtersSlice';
import { 
  selectUserStrains, 
  selectUserStrainIds, 
  selectFavoriteIds, 
  selectSettings, 
  selectStrainsView,
  selectSavedStrainTips,
  selectSavedExports,
  selectSavedExportsCount
} from '@/stores/selectors';
import { 
    setStrainsViewTab, 
    toggleStrainSelection, 
    toggleAllStrainSelection, 
    clearStrainSelection, 
    setSelectedStrainId
} from '@/stores/slices/strainsViewSlice';
import { openAddModal, closeAddModal, addNotification, initiateGrowFromStrainList, openExportModal, closeExportModal } from '@/stores/slices/uiSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from '@/stores/slices/favoritesSlice';
import { addUserStrainWithValidation, updateUserStrainAndCloseModal, deleteUserStrain } from '@/stores/slices/userStrainsSlice';
import { StrainDetailView } from './StrainDetailView';
import { AddStrainModal } from './AddStrainModal';
import { addStrainTip, updateStrainTip, deleteStrainTip, addExport, updateExport, deleteExport, exportAndSaveStrains } from '@/stores/slices/savedItemsSlice';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { FilterDrawer } from './FilterDrawer';
import { INITIAL_ADVANCED_FILTERS } from '@/constants';
import { StrainSubNav } from './StrainSubNav';
import { StrainsViewState } from '@/stores/slices/strainsViewSlice';
import { DataExportModal } from '@/components/common/DataExportModal';
import type { SimpleExportFormat } from '@/components/common/DataExportModal';

// --- Lazy Loaded Views for Performance ---
const StrainLibraryView = lazy(() => import('./StrainLibraryView').then(m => ({ default: m.StrainLibraryView })));
const StrainTipsView = lazy(() => import('./StrainTipsView'));
const GenealogyView = lazy(() => import('./GenealogyView').then(m => ({ default: m.GenealogyView })));
const ExportsManagerView = lazy(() => import('./ExportsManagerView'));


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
    const savedTips = useAppSelector(selectSavedStrainTips) as SavedStrainTip[];
    const savedExports = useAppSelector(selectSavedExports) as SavedExport[];
    const savedExportsCount = useAppSelector(selectSavedExportsCount);
    const isAddModalOpen = useAppSelector(state => state.ui.isAddModalOpen);
    const isExportModalOpen = useAppSelector(state => state.ui.isExportModalOpen);
    const strainToEdit = useAppSelector(state => state.ui.strainToEdit);

    const selectedIdsSet = useMemo(() => new Set<string>(selectedStrainIds), [selectedStrainIds]);
    
    // This effect runs only once when the component mounts to hydrate state from URL
    useEffect(() => {
        const queryString = window.location.search;
        if (queryString) {
            const parsedState = urlService.parseQueryStringToFilterState(queryString);
            if (Object.keys(parsedState).length > 0) {
                dispatch(hydrateFilters(parsedState));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const viewIcons = useMemo(() => ({
        [StrainViewTab.All]: <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />,
        [StrainViewTab.MyStrains]: <PhosphorIcons.Star className="w-16 h-16 mx-auto text-amber-400" />,
        [StrainViewTab.Favorites]: <PhosphorIcons.Heart weight="fill" className="w-16 h-16 mx-auto text-red-400" />,
        [StrainViewTab.Genealogy]: <PhosphorIcons.TreeStructure className="w-16 h-16 mx-auto text-purple-400" />,
        [StrainViewTab.Exports]: <PhosphorIcons.FileText className="w-16 h-16 mx-auto text-blue-400" />,
        [StrainViewTab.Tips]: <PhosphorIcons.LightbulbFilament className="w-16 h-16 mx-auto text-yellow-400" />,
    }), []);
    
    const viewTitles = useMemo(() => ({
        [StrainViewTab.All]: t('strainsView.tabs.allStrains'),
        [StrainViewTab.MyStrains]: t('strainsView.tabs.myStrains'),
        [StrainViewTab.Favorites]: t('strainsView.tabs.favorites'),
        [StrainViewTab.Genealogy]: t('strainsView.tabs.genealogy'),
        [StrainViewTab.Exports]: t('strainsView.tabs.exports', { count: savedExportsCount }),
        [StrainViewTab.Tips]: t('strainsView.tabs.tips', { count: savedTips.length }),
    }), [t, savedTips.length, savedExportsCount]);


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
    } = useStrainFilters(strainsForCurrentTab, settings.strainsView);
    
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
        setTempFilterState(INITIAL_ADVANCED_FILTERS);
        setIsDrawerOpen(false);
    };
    
    const handleAddStrain = useCallback((strain: Strain) => dispatch(addUserStrainWithValidation(strain)), [dispatch]);
    const handleUpdateStrain = useCallback((strain: Strain) => dispatch(updateUserStrainAndCloseModal(strain)), [dispatch]);
    
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

    const handleToggleFavorite = useCallback((id: string) => {
        dispatch(toggleFavorite(id));
    }, [dispatch]);
    
    const allAromas = useMemo(() => [...new Set(allStrains.flatMap(s => s.aromas || []))].sort(), [allStrains]);
    const allTerpenes = useMemo(() => [...new Set(allStrains.flatMap(s => s.dominantTerpenes || []))].sort(), [allStrains]);
    
    const handleExport = useCallback((format: SimpleExportFormat) => {
        const source = selectedIdsSet.size > 0 ? 'selected' : 'all';
        const dataToExport = source === 'selected'
            ? allStrains.filter(strain => selectedIdsSet.has(strain.id))
            : filteredStrains;

        if (dataToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }));
            dispatch(closeExportModal());
            return;
        }

        const sourceDescription = t(source === 'selected' 
            ? (dataToExport.length === 1 ? 'strainsView.exportModal.sources.selected_one' : 'strainsView.exportModal.sources.selected_other')
            : (dataToExport.length === 1 ? 'strainsView.exportModal.sources.all_one' : 'strainsView.exportModal.sources.all_other'), 
            { count: dataToExport.length });
        
        const fileName = `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`;

        dispatch(exportAndSaveStrains({
            strains: dataToExport,
            format,
            fileName,
            sourceDescription
        }));
    }, [dispatch, t, selectedIdsSet, allStrains, filteredStrains]);

    const handleSelect = useCallback((strain: Strain) => {
        dispatch(setSelectedStrainId(strain.id));
    }, [dispatch]);

    const handleToggleSelection = useCallback((id: string) => {
        dispatch(toggleStrainSelection(id));
    }, [dispatch]);

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
                            onOpenDrawer={() => setIsDrawerOpen(true)}
                            activeFilterCount={activeFilterCount}
                            selectedIds={selectedIdsSet}
                            onToggleSelection={handleToggleSelection}
                            onSelect={handleSelect}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                            isUserStrain={(id) => userStrainIds.has(id)}
                            onDeleteUserStrain={handleDeleteUserStrain}
                            onClearSelection={() => dispatch(clearStrainSelection())}
                            onAddToFavorites={() => dispatch(addMultipleToFavorites(selectedStrainIds))}
                            onRemoveFromFavorites={() => dispatch(removeMultipleFromFavorites(selectedStrainIds))}
                            onDelete={strainsViewTab === StrainViewTab.MyStrains ? handleBulkDelete : undefined}
                            strainsViewTab={strainsViewTab}
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
                        <GenealogyView allStrains={allStrains} onNodeClick={handleSelect} />
                    </Suspense>
                );
            case StrainViewTab.Exports:
                return (
                     <Suspense fallback={<SkeletonLoader count={3} />}>
                        <ExportsManagerView
                            savedExports={savedExports}
                            allStrains={allStrains}
                            onDelete={(id) => dispatch(deleteExport(id))}
                            onUpdate={(exp) => dispatch(updateExport(exp))}
                        />
                    </Suspense>
                );
            default:
                return null;
        }
    };
    
    


    return (
        <div className="space-y-6 animate-fade-in">
             <div className="text-center mb-6">
                {viewIcons[strainsViewTab]}
                <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{viewTitles[strainsViewTab]}</h2>
            </div>
            
            <StrainSubNav 
                activeTab={strainsViewTab} 
                onTabChange={(id) => dispatch(setStrainsViewTab(id))} 
                counts={{ tips: savedTips.length, exports: savedExportsCount }}
            />
            
            {isAddModalOpen && <AddStrainModal isOpen={true} onClose={() => dispatch(closeAddModal())} onAddStrain={handleAddStrain} onUpdateStrain={handleUpdateStrain} strainToEdit={strainToEdit} />}
             {isExportModalOpen && <DataExportModal 
                isOpen={true} 
                onClose={() => dispatch(closeExportModal())} 
                onExport={handleExport} 
                title={t('strainsView.exportModal.title')} 
                selectionCount={selectedIdsSet.size} 
                totalCount={filteredStrains.length} 
                translationBasePath="strainsView.exportModal" 
             />}
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
                isAnyFilterActive={isAnyFilterActive}
            />
            
            {renderContent()}
        </div>
    );
};