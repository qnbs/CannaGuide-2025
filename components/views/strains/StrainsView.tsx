import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, StrainViewTab, AppSettings, SavedStrainTip, SavedExport } from '@/types';
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
    clearStrainSelection,
    setSelectedStrainId
} from '@/stores/slices/strainsViewSlice';
import { closeAddModal, addNotification, closeExportModal } from '@/stores/slices/uiSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from '@/stores/slices/favoritesSlice';
import { addUserStrainWithValidation, updateUserStrainAndCloseModal, deleteUserStrain } from '@/stores/slices/userStrainsSlice';
import { StrainDetailView } from './StrainDetailView';
import { AddStrainModal } from './AddStrainModal';
import { updateStrainTip, deleteStrainTip, updateExport, deleteExport, exportAndSaveStrains } from '@/stores/slices/savedItemsSlice';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { FilterDrawer } from './FilterDrawer';
import { INITIAL_ADVANCED_FILTERS } from '@/constants';
import { StrainSubNav } from './StrainSubNav';
import { StrainsViewState } from '@/stores/slices/strainsViewSlice';
import { DataExportModal } from '@/components/common/DataExportModal';
import type { SimpleExportFormat } from '@/components/common/DataExportModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { compareText } from './compareText';

// --- Lazy Loaded Views for Performance ---
const StrainLibraryView = lazy(() => import('./StrainLibraryView').then(m => ({ default: m.StrainLibraryView })));
const StrainTipsView = lazy(() => import('./StrainTipsView'));
const GenealogyView = lazy(() => import('./GenealogyView').then(m => ({ default: m.GenealogyView })));
const ExportsManagerView = lazy(() => import('./ExportsManagerView'));
const BreedingLabView = lazy(() => import('./BreedingLab').then(m => ({ default: m.BreedingLab })));

const DEFAULT_AGRONOMIC = {
    difficulty: 'Medium',
    yield: 'Medium',
    height: 'Medium',
} as const

const getSafeText = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const getSafeStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
const getSafeNumericValue = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const getSafeStrainType = (value: unknown): string => (typeof value === 'string' ? value : 'Hybrid');

const getRangeValue = (range: [number, number] | undefined, fallback: [number, number]): [number, number] => {
    if (
        Array.isArray(range) &&
        range.length === 2 &&
        typeof range[0] === 'number' && Number.isFinite(range[0]) &&
        typeof range[1] === 'number' && Number.isFinite(range[1])
    ) {
        return range
    }

    return fallback
}

const getSafeAgronomic = (strain: Strain) => strain.agronomic ?? DEFAULT_AGRONOMIC


export const StrainsView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [_currentPage, setCurrentPage] = useState(1);

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
    }, [dispatch]);

    const viewIcons = useMemo(() => ({
        [StrainViewTab.All]: <PhosphorIcons.Leafy className="w-16 h-16 mx-auto text-green-400" />,
        [StrainViewTab.MyStrains]: <PhosphorIcons.Star className="w-16 h-16 mx-auto text-amber-400" />,
        [StrainViewTab.Favorites]: <PhosphorIcons.Heart weight="fill" className="w-16 h-16 mx-auto text-red-400" />,
        [StrainViewTab.Genealogy]: <PhosphorIcons.TreeStructure className="w-16 h-16 mx-auto text-purple-400" />,
        [StrainViewTab.BreedingLab]: <PhosphorIcons.Flask className="w-16 h-16 mx-auto text-teal-400" />,
        [StrainViewTab.Exports]: <PhosphorIcons.FileText className="w-16 h-16 mx-auto text-blue-400" />,
        [StrainViewTab.Tips]: <PhosphorIcons.LightbulbFilament className="w-16 h-16 mx-auto text-yellow-400" />,
    }), []);

    const viewTitles = useMemo(() => ({
        [StrainViewTab.All]: t('strainsView.tabs.allStrains'),
        [StrainViewTab.MyStrains]: t('strainsView.tabs.myStrains'),
        [StrainViewTab.Favorites]: t('strainsView.tabs.favorites'),
        [StrainViewTab.Genealogy]: t('strainsView.tabs.genealogy'),
        [StrainViewTab.BreedingLab]: t('strainsView.tabs.breedingLab'),
        [StrainViewTab.Exports]: t('strainsView.tabs.exports', { count: savedExportsCount }),
        [StrainViewTab.Tips]: t('strainsView.tabs.tips', { count: savedTips.length }),
    }), [t, savedTips.length, savedExportsCount]);


    const loadStrains = useCallback(() => {
        strainService.getAllStrains()
            .then(strains => {
                setAllStrains(strains);
                setLoadError(null);
                setIsLoading(false);
            })
            .catch((error: unknown) => {
                console.error('[StrainsView] Failed to load strains.', error);
                setLoadError(t('strainsView.loadError'));
                setIsLoading(false);
            });
    }, [t]);

    useEffect(() => {
        loadStrains();
    }, [loadStrains]);

    const { allAromas, allTerpenes } = useMemo(() => {
        const aromaSet = new Set<string>();
        const terpeneSet = new Set<string>();

        allStrains.filter((strain): strain is Strain => Boolean(strain)).forEach(strain => {
            getSafeStringArray(strain.aromas).forEach((aroma) => aromaSet.add(aroma));
            getSafeStringArray(strain.dominantTerpenes).forEach((terpene) => terpeneSet.add(terpene));
        });

        return {
            allAromas: Array.from(aromaSet).sort((a, b) => compareText(t(`common.aromas.${a}`, { defaultValue: a }), t(`common.aromas.${b}`, { defaultValue: b }))),
            allTerpenes: Array.from(terpeneSet).sort((a, b) => compareText(t(`common.terpenes.${a}`, { defaultValue: a }), t(`common.terpenes.${b}`, { defaultValue: b }))),
        };
    }, [allStrains, t]);

    const strainsForCurrentTab = useMemo(() => {
        const safeAllStrains = allStrains.filter((strain): strain is Strain => Boolean(strain));
        const safeUserStrains = userStrains.filter((strain): strain is Strain => Boolean(strain));
        switch (strainsViewTab) {
            case StrainViewTab.MyStrains: return safeUserStrains;
            case StrainViewTab.Favorites: return safeAllStrains.filter(s => favoriteIds.has(s.id));
            case StrainViewTab.All: default: return safeAllStrains;
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

    // --- Screen-reader live-region for filter/search result announcements ---
    const liveRegionRef = useRef<HTMLDivElement>(null);
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; return; }
        const timer = setTimeout(() => {
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = searchTerm
                    ? t('common.accessibility.searchResultsCount', { count: filteredStrains.length })
                    : t('common.accessibility.filterResultsCount', { count: filteredStrains.length });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filteredStrains.length, searchTerm, t]);

    const [tempFilterState, setTempFilterState] = useState(advancedFilters);
    useEffect(() => setTempFilterState(advancedFilters), [advancedFilters]);

    const countForDrawer = useMemo(() => {
        let strains = [...strainsForCurrentTab];
        const thcRange = getRangeValue(tempFilterState.thcRange, INITIAL_ADVANCED_FILTERS.thcRange)
        const cbdRange = getRangeValue(tempFilterState.cbdRange, INITIAL_ADVANCED_FILTERS.cbdRange)
        const floweringRange = getRangeValue(tempFilterState.floweringRange, INITIAL_ADVANCED_FILTERS.floweringRange)

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            strains = strains.filter(s =>
                getSafeText(s.name, 'Unknown Strain').toLowerCase().includes(lowerCaseSearch) ||
                getSafeStrainType(s.type).toLowerCase().includes(lowerCaseSearch) ||
                getSafeStringArray(s.aromas).some(a => a.toLowerCase().includes(lowerCaseSearch)) ||
                getSafeStringArray(s.dominantTerpenes).some(t => t.toLowerCase().includes(lowerCaseSearch)) ||
                getSafeText(s.genetics, '').toLowerCase().includes(lowerCaseSearch)
            );
        }
        if (showFavoritesOnly) {
            strains = strains.filter(s => favoriteIds.has(s.id));
        }
        if (typeFilter.length > 0) {
            strains = strains.filter(s => typeFilter.includes(s.type));
        }
        if (letterFilter) {
            if (letterFilter === '#') {
                strains = strains.filter(s => /^\d/.test(getSafeText(s.name, '')));
            } else {
                strains = strains.filter(s => getSafeText(s.name, '').toLowerCase().startsWith(letterFilter.toLowerCase()));
            }
        }

        const difficulties = new Set(tempFilterState.selectedDifficulties);
        const yields = new Set(tempFilterState.selectedYields);
        const heights = new Set(tempFilterState.selectedHeights);
        const aromas = new Set(tempFilterState.selectedAromas);
        const terpenes = new Set(tempFilterState.selectedTerpenes);

        strains = strains.filter(s =>
            (getSafeNumericValue(s.thc, 0) >= thcRange[0] && getSafeNumericValue(s.thc, 0) <= thcRange[1]) &&
            (getSafeNumericValue(s.cbd, 0) >= cbdRange[0] && getSafeNumericValue(s.cbd, 0) <= cbdRange[1]) &&
            (getSafeNumericValue(s.floweringTime, 0) >= floweringRange[0] && getSafeNumericValue(s.floweringTime, 0) <= floweringRange[1]) &&
            (difficulties.size === 0 || difficulties.has(getSafeAgronomic(s).difficulty)) &&
            (yields.size === 0 || yields.has(getSafeAgronomic(s).yield)) &&
            (heights.size === 0 || heights.has(getSafeAgronomic(s).height)) &&
            (aromas.size === 0 || getSafeStringArray(s.aromas).some(a => aromas.has(a))) &&
            (terpenes.size === 0 || getSafeStringArray(s.dominantTerpenes).some(t => terpenes.has(t)))
        );

        return strains.length;
    }, [strainsForCurrentTab, searchTerm, showFavoritesOnly, typeFilter, letterFilter, favoriteIds, tempFilterState]);


    const handleApplyFilters = () => {
        setAdvancedFilters(tempFilterState);
        setIsDrawerOpen(false);
    };

    const handleResetFilters = () => {
        resetAllFilters();
        setTempFilterState(INITIAL_ADVANCED_FILTERS);
        setIsDrawerOpen(false);
    };

    const handleOpenDrawer = useCallback(() => {
        setIsDrawerOpen(true);
    }, []);

    const handleClearSelection = useCallback(() => {
        dispatch(clearStrainSelection());
    }, [dispatch]);

    const handleAddSelectedToFavorites = useCallback(() => {
        dispatch(addMultipleToFavorites(selectedStrainIds));
    }, [dispatch, selectedStrainIds]);

    const handleRemoveSelectedFromFavorites = useCallback(() => {
        dispatch(removeMultipleFromFavorites(selectedStrainIds));
    }, [dispatch, selectedStrainIds]);

    const isUserStrain = useCallback((id: string) => userStrainIds.has(id), [userStrainIds]);

    const handleAddStrain = useCallback((strain: Strain) => dispatch(addUserStrainWithValidation(strain)), [dispatch]);
    const handleUpdateStrain = useCallback((strain: Strain) => dispatch(updateUserStrainAndCloseModal(strain)), [dispatch]);

    const handleDeleteUserStrain = useCallback((id: string) => {
        const strainToDelete = userStrains.find(s => s.id === id);
        if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
            dispatch(deleteUserStrain(id));
        }
    }, [dispatch, userStrains, t]);

    const handleBulkDelete = useCallback(() => {
        if (strainsViewTab === StrainViewTab.MyStrains && window.confirm(t('strainsView.exportsManager.deleteConfirmPlural_other', { count: selectedIdsSet.size }))) {
            selectedIdsSet.forEach(id => dispatch(deleteUserStrain(id)));
            dispatch(clearStrainSelection());
        }
    }, [strainsViewTab, selectedIdsSet, t, dispatch]);

    const handleToggleFavorite = useCallback((id: string) => {
        dispatch(toggleFavorite(id));
    }, [dispatch]);

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

        if (loadError) {
            return (
                <Card className="text-center py-10 text-slate-300">
                    <PhosphorIcons.WarningCircle className="w-14 h-14 mx-auto text-red-400 mb-3" />
                    <h3 className="font-semibold text-slate-100">{t('common.error')}</h3>
                    <p className="text-sm mb-4 text-slate-400">{loadError}</p>
                    <Button size="sm" variant="secondary" onClick={loadStrains}>
                        {t('common.errorBoundary.reload')}
                    </Button>
                </Card>
            );
        }

        switch (strainsViewTab) {
            case StrainViewTab.All:
            case StrainViewTab.MyStrains:
            case StrainViewTab.Favorites:
                return (
                    <ErrorBoundary>
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
                            onOpenDrawer={handleOpenDrawer}
                            activeFilterCount={activeFilterCount}
                            selectedIds={selectedIdsSet}
                            onToggleSelection={handleToggleSelection}
                            onSelect={handleSelect}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                            isUserStrain={isUserStrain}
                            onDeleteUserStrain={handleDeleteUserStrain}
                            onClearSelection={handleClearSelection}
                            onAddToFavorites={handleAddSelectedToFavorites}
                            onRemoveFromFavorites={handleRemoveSelectedFromFavorites}
                            onDelete={strainsViewTab === StrainViewTab.MyStrains ? handleBulkDelete : undefined}
                            strainsViewTab={strainsViewTab}
                        />
                    </Suspense>
                    </ErrorBoundary>
                );
            case StrainViewTab.Tips:
                return (
                    <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <StrainTipsView
                            savedTips={savedTips}
                            deleteTip={(id) => dispatch(deleteStrainTip(id))}
                            updateTip={(tip) => dispatch(updateStrainTip(tip))}
                            allStrains={allStrains}
                        />
                    </Suspense>
                    </ErrorBoundary>
                );
            case StrainViewTab.Genealogy:
                return (
                    // Lokale ErrorBoundary isoliert Genealogy-Fehler vom Rest der App
                    <ErrorBoundary>
                        <Suspense fallback={<SkeletonLoader count={3} />}>
                            {/* key erzwingt vollständiges Remount bei Strain-Wechsel –
                                verhindert stale d3-State nach 50+ Wechseln */}
                            <GenealogyView allStrains={allStrains} onNodeClick={handleSelect} />
                        </Suspense>
                    </ErrorBoundary>
                );
            case StrainViewTab.BreedingLab:
                return (
                    <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <BreedingLabView allStrains={allStrains} />
                    </Suspense>
                    </ErrorBoundary>
                );
            case StrainViewTab.Exports:
                return (
                    <ErrorBoundary>
                     <Suspense fallback={<SkeletonLoader count={3} />}>
                        <ExportsManagerView
                            savedExports={savedExports}
                            allStrains={allStrains}
                            onDelete={(id) => dispatch(deleteExport(id))}
                            onUpdate={(exp) => dispatch(updateExport(exp))}
                        />
                    </Suspense>
                    </ErrorBoundary>
                );
            default:
                return null;
        }
    };




    return (
        <div className="space-y-6 animate-fade-in">
            <div ref={liveRegionRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
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
                count={countForDrawer}
                showFavorites={showFavoritesOnly}
                onToggleFavorites={(val) => setShowFavoritesOnly(val)}
                typeFilter={typeFilter}
                // FIX: Pass the correct function prop. The hook provides `handleToggleTypeFilter`, not `onToggleTypeFilter`.
                onToggleTypeFilter={handleToggleTypeFilter}
                isAnyFilterActive={isAnyFilterActive}
            />

            {renderContent()}
        </div>
    );
};
