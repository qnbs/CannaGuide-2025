import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
    useTransition,
    memo,
} from 'react';
// FIX: Corrected import path for types to use the '@/' alias.
import { Strain, StrainViewTab, AIResponse } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { StrainToolbar } from './strains/StrainToolbar';
import { StrainList } from './strains/StrainList';
import { StrainGrid } from './strains/StrainGrid';
import { AddStrainModal } from './strains/AddStrainModal';
import { StrainDetailView } from './strains/StrainDetailView';
import { DataExportModal } from '@/components/common/DataExportModal';
import { FilterDrawer } from './strains/FilterDrawer';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
// FIX: Corrected import path for hook to use the '@/' alias.
import { useStrainFilters } from '@/hooks/useStrainFilters';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { ExportsManagerView } from './strains/ExportsManagerView';
import { StrainTipsView } from './strains/StrainTipsView';
import { Button } from '@/components/common/Button';
import { BulkActionsBar } from './strains/BulkActionsBar';
import { GenealogyView } from './strains/GenealogyView';

// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
    selectStrainsView,
    selectUserStrains,
    selectFavoriteIds,
    selectSavedExports,
    selectSavedStrainTips,
    selectSettings,
    selectUserStrainIds,
} from '@/stores/selectors';
import {
    setStrainsViewTab,
    setStrainsViewMode,
    toggleStrainSelection,
    toggleAllStrainSelection,
    clearStrainSelection,
} from '@/stores/slices/strainsViewSlice';
import {
    openAddModal,
    closeAddModal,
    openExportModal,
    closeExportModal,
    addNotification,
    initiateGrowFromStrainList,
} from '@/stores/slices/uiSlice';
import {
    addUserStrain,
    updateUserStrain,
    deleteUserStrain,
} from '@/stores/slices/userStrainsSlice';
import {
    addExport,
    deleteExport,
    updateExport,
    addStrainTip,
    deleteStrainTip,
    updateStrainTip,
} from '@/stores/slices/savedItemsSlice';
import {
    addMultipleToFavorites,
    removeMultipleFromFavorites,
} from '@/stores/slices/favoritesSlice';
import { strainService } from '@/services/strainService';
import { exportService } from '@/services/exportService';

const ITEMS_PER_PAGE = 30;

const processAndTranslateStrains = (
    strains: Strain[],
    t: (key: string, options?: any) => any
): Strain[] => {
    const getTranslatedString = (
        key: string,
        fallback: string | undefined
    ): string | undefined => {
        const result = t(key);
        return typeof result === 'string' && result !== key ? result : fallback;
    };
    const getTranslatedObject = (key: string, fallback: object | undefined): object | undefined => {
        const result = t(key, { returnObjects: true });
        return typeof result === 'object' && result !== null ? result : fallback;
    };
    return strains.map((strain) => ({
        ...strain,
        description: getTranslatedString(
            `strainsData.${strain.id}.description`,
            strain.description
        ),
        typeDetails: getTranslatedString(
            `strainsData.${strain.id}.typeDetails`,
            strain.typeDetails
        ),
        genetics: getTranslatedString(`strainsData.${strain.id}.genetics`, strain.genetics),
        agronomic: {
            ...strain.agronomic,
            yieldDetails: getTranslatedObject(
                `strainsData.${strain.id}.yieldDetails`,
                strain.agronomic.yieldDetails
            ) as { indoor: string; outdoor: string } | undefined,
            heightDetails: getTranslatedObject(
                `strainsData.${strain.id}.heightDetails`,
                strain.agronomic.heightDetails
            ) as { indoor: string; outdoor: string } | undefined,
        },
    }));
};

const StrainsViewComponent: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const [baseStrains, setBaseStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);

    const {
        strainsViewTab: activeTab,
        strainsViewMode: viewMode,
        selectedStrainIds: selectedIdsSet,
    } = useAppSelector(selectStrainsView);
    // FIX: Explicitly type the Set to avoid inference issues.
    const selectedIds = useMemo(() => new Set<string>(selectedIdsSet), [selectedIdsSet]);

    const isAddModalOpen = useAppSelector((state) => state.ui.isAddModalOpen);
    const isExportModalOpen = useAppSelector((state) => state.ui.isExportModalOpen);
    const strainToEdit = useAppSelector((state) => state.ui.strainToEdit);

    const userStrains = useAppSelector(selectUserStrains);
    const userStrainIds = useAppSelector(selectUserStrainIds);
    const favorites = useAppSelector(selectFavoriteIds);
    const savedExports = useAppSelector(selectSavedExports);
    const savedTips = useAppSelector(selectSavedStrainTips);
    const settings = useAppSelector(selectSettings);

    useEffect(() => {
        setIsLoading(true);
        strainService.getAllStrains().then((strains) => {
            setBaseStrains(strains);
            setIsLoading(false);
        });
    }, []);

    const translatedStrains = useMemo(
        () => processAndTranslateStrains(baseStrains, t),
        [baseStrains, t]
    );
    const allStrains = translatedStrains;

    const isUserStrain = useCallback((id: string) => userStrainIds.has(id), [userStrainIds]);

    const handleStrainSelect = useCallback((strain: Strain) => setSelectedStrain(strain), []);

    const strainsForCurrentTab = useMemo(() => {
        // FIX: Changed case statements to use enum members for type safety.
        switch (activeTab) {
            case StrainViewTab.MyStrains:
                return userStrains;
            case StrainViewTab.Favorites:
                return allStrains.filter((s) => favorites.has(s.id));
            default:
                return allStrains;
        }
    }, [activeTab, allStrains, userStrains, favorites]);

    const { filteredStrains, isSearching, ...filterProps } = useStrainFilters(
        strainsForCurrentTab,
        settings.strainsViewSettings
    );
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    const { allAromas, allTerpenes } = useMemo(() => {
        const aromaSet = new Set<string>();
        const terpeneSet = new Set<string>();
        baseStrains.forEach((strain) => {
            strain.aromas?.forEach((a) => aromaSet.add(a));
            strain.dominantTerpenes?.forEach((t) => terpeneSet.add(t));
        });
        return {
            allAromas: Array.from(aromaSet).sort(),
            allTerpenes: Array.from(terpeneSet).sort(),
        };
    }, [baseStrains]);

    const strainsToShow = useMemo(
        () => filteredStrains.slice(0, visibleCount),
        [filteredStrains, visibleCount]
    );

    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
        dispatch(clearStrainSelection());
    }, [
        filterProps.searchTerm,
        filterProps.typeFilter,
        filterProps.advancedFilters,
        activeTab,
        dispatch,
        filterProps.letterFilter,
    ]);

    // FIX: Corrected the logic for adding a new strain to prevent duplicates.
    const handleAddStrain = useCallback(
        (strain: Strain) => {
            if (userStrains.some((s) => s.name.toLowerCase() === strain.name.toLowerCase())) {
                dispatch(
                    addNotification({
                        message: t('strainsView.addStrainModal.validation.duplicate', {
                            name: strain.name,
                        }),
                        type: 'error',
                    })
                );
                return;
            }
            dispatch(addUserStrain(strain));
            dispatch(closeAddModal());
        },
        [dispatch, t, userStrains]
    );

    const handleUpdateStrain = useCallback(
        (strain: Strain) => {
            dispatch(updateUserStrain(strain));
            dispatch(closeAddModal());
        },
        [dispatch]
    );

    const handleDeleteStrain = useCallback(
        (id: string) => {
            const strainToDelete = userStrains.find((s) => s.id === id);
            if (
                strainToDelete &&
                window.confirm(
                    t('strainsView.addStrainModal.validation.deleteConfirm', {
                        name: strainToDelete.name,
                    })
                )
            ) {
                dispatch(deleteUserStrain(id));
            }
        },
        [userStrains, dispatch, t]
    );

    const handleExport = useCallback(
        (
            source: 'selected' | 'all',
            format: 'pdf' | 'csv' | 'json' | 'txt' | 'xml'
        ) => {
            const strainsToExport =
                source === 'selected'
                    ? filteredStrains.filter((s) => selectedIds.has(s.id))
                    : filteredStrains;

            if (strainsToExport.length === 0) {
                dispatch(
                    addNotification({ message: t('common.noDataToExport'), type: 'error' })
                );
                return;
            }

            const fileName = `CannaGuide_Strains_${new Date().toISOString().slice(0, 10)}`;
            exportService.exportStrains(strainsToExport, format, fileName);

            dispatch(
                addExport({
                    data: { name: fileName, source, format, notes: '' },
                    strainIds: strainsToExport.map((s) => s.id),
                })
            );
        },
        [filteredStrains, selectedIds, dispatch, t]
    );

    const handleBulkAddToFavorites = useCallback(() => {
        dispatch(addMultipleToFavorites(Array.from(selectedIds)));
    }, [selectedIds, dispatch]);

    const handleBulkRemoveFromFavorites = useCallback(() => {
        dispatch(removeMultipleFromFavorites(Array.from(selectedIds)));
    }, [selectedIds, dispatch]);

    const areAllVisibleSelected = useMemo(() => {
        return strainsToShow.length > 0 && strainsToShow.every((s) => selectedIds.has(s.id));
    }, [strainsToShow, selectedIds]);

    const handleToggleAll = useCallback(() => {
        dispatch(
            toggleAllStrainSelection({
                ids: strainsToShow.map((s) => s.id),
                areAllCurrentlySelected: areAllVisibleSelected,
            })
        );
    }, [strainsToShow, areAllVisibleSelected, dispatch]);

    const handleViewModeChange = useCallback(
        (mode: 'list' | 'grid') => {
            startTransition(() => {
                dispatch(setStrainsViewMode(mode));
            });
        },
        [dispatch]
    );

    const handleSetTabView = useCallback(
        (id: string) => {
            startTransition(() => {
                dispatch(setStrainsViewTab(id as StrainViewTab));
            });
        },
        [dispatch]
    );

    const handleSaveTip = useCallback(
        (strain: Strain, tip: AIResponse, imageUrl?: string) => {
            dispatch(addStrainTip({ strain, tip, imageUrl }));
        },
        [dispatch]
    );

    if (selectedStrain) {
        return (
            <StrainDetailView
                strain={selectedStrain}
                onBack={() => setSelectedStrain(null)}
                allStrains={allStrains}
                onSaveTip={handleSaveTip}
            />
        );
    }

    const tabs = [
        { id: StrainViewTab.All, label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        {
            id: StrainViewTab.MyStrains,
            label: t('strainsView.tabs.myStrains'),
            icon: <PhosphorIcons.Star />,
        },
        {
            id: StrainViewTab.Favorites,
            label: t('strainsView.tabs.favorites'),
            icon: <PhosphorIcons.Heart />,
        },
        {
            id: StrainViewTab.Exports,
            label: t('strainsView.tabs.exports', { count: savedExports.length }),
            icon: <PhosphorIcons.DownloadSimple />,
        },
        {
            id: StrainViewTab.Tips,
            label: t('strainsView.tabs.tips', { count: savedTips.length }),
            icon: <PhosphorIcons.LightbulbFilament />,
        },
        { id: StrainViewTab.Genealogy, label: t('strainsView.tabs.genealogy'), icon: <PhosphorIcons.TreeStructure /> },
    ];

    const showToolbar =
        activeTab === StrainViewTab.All ||
        activeTab === StrainViewTab.MyStrains ||
        activeTab === StrainViewTab.Favorites;

    return (
        <div className='space-y-4 animate-fade-in'>
            <AddStrainModal
                isOpen={isAddModalOpen}
                onClose={() => dispatch(closeAddModal())}
                onAddStrain={handleAddStrain}
                onUpdateStrain={handleUpdateStrain}
                strainToEdit={strainToEdit}
            />
            <DataExportModal
                isOpen={isExportModalOpen}
                onClose={() => dispatch(closeExportModal())}
                onExport={handleExport}
                title={t('strainsView.exportModal.title')}
                selectionCount={selectedIds.size}
                totalCount={filteredStrains.length}
            />
            <FilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onApply={() => setIsFilterDrawerOpen(false)}
                onReset={filterProps.resetAllFilters}
                tempFilterState={filterProps.advancedFilters}
                setTempFilterState={filterProps.setAdvancedFilters}
                allAromas={allAromas}
                allTerpenes={allTerpenes}
                count={filteredStrains.length}
            />

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
                        onExport={() => dispatch(openExportModal())}
                        onAdd={() => dispatch(openAddModal())}
                        showFavorites={filterProps.showFavoritesOnly}
                        onToggleFavorites={() =>
                            filterProps.setShowFavoritesOnly(!filterProps.showFavoritesOnly)
                        }
                        typeFilter={filterProps.typeFilter}
                        onToggleTypeFilter={filterProps.handleToggleTypeFilter}
                        onOpenDrawer={() => setIsFilterDrawerOpen(true)}
                        activeFilterCount={filterProps.activeFilterCount}
                        isAnyFilterActive={filterProps.isAnyFilterActive}
                        onClearAllFilters={filterProps.resetAllFilters}
                        letterFilter={filterProps.letterFilter}
                        onLetterFilterChange={filterProps.handleSetLetterFilter}
                    />
                </Card>
            )}

            {selectedIds.size > 0 && showToolbar && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => dispatch(clearStrainSelection())}
                    onExport={() => dispatch(openExportModal())}
                    onAddToFavorites={handleBulkAddToFavorites}
                    onRemoveFromFavorites={handleBulkRemoveFromFavorites}
                />
            )}
            
            {activeTab === StrainViewTab.Genealogy && <GenealogyView />}
            {activeTab === StrainViewTab.Exports && (
                <ExportsManagerView
                    savedExports={savedExports}
                    deleteExport={(id) => dispatch(deleteExport(id))}
                    updateExport={(exp) => dispatch(updateExport(exp))}
                    allStrains={allStrains}
                    onOpenExportModal={() => dispatch(openExportModal())}
                />
            )}
            {activeTab === StrainViewTab.Tips && (
                <StrainTipsView
                    savedTips={savedTips}
                    deleteTip={(id) => dispatch(deleteStrainTip(id))}
                    updateTip={(tip) => dispatch(updateStrainTip(tip))}
                    allStrains={allStrains}
                />
            )}

            {showToolbar &&
                (isLoading || isSearching ? (
                    viewMode === 'list' ? (
                        <SkeletonLoader
                            variant='list'
                            count={10}
                            columns={settings.strainsViewSettings.visibleColumns}
                        />
                    ) : (
                        <SkeletonLoader variant='grid' count={10} />
                    )
                ) : filteredStrains.length === 0 ? (
                    filterProps.isAnyFilterActive ? (
                        <Card className='text-center py-10 text-slate-500'>
                            <PhosphorIcons.MagnifyingGlass className='w-12 h-12 mx-auto text-slate-400 mb-4' />
                            <h3 className='font-semibold'>
                                {t('strainsView.emptyStates.noResults.title')}
                            </h3>
                            <p className='text-sm'>{t('strainsView.emptyStates.noResults.text')}</p>
                            <Button onClick={filterProps.resetAllFilters} className='mt-4'>
                                {t('strainsView.resetFilters')}
                            </Button>
                        </Card>
                    ) : (
                        <Card className='text-center py-10 text-slate-500'>
                            <p>
                                {t(
                                    `strainsView.emptyStates.${
                                        activeTab === StrainViewTab.MyStrains
                                            ? 'myStrains'
                                            : 'favorites'
                                    }.text`
                                )}
                            </p>
                        </Card>
                    )
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <StrainList
                                strains={strainsToShow}
                                selectedIds={selectedIds}
                                onToggleSelection={(id) => dispatch(toggleStrainSelection(id))}
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
                                onToggleSelection={(id) => dispatch(toggleStrainSelection(id))}
                                isUserStrain={isUserStrain}
                                onDelete={handleDeleteStrain}
                                isPending={isPending}
                            />
                        )}
                        {visibleCount < filteredStrains.length && (
                            <div className='mt-6 text-center'>
                                <Button
                                    onClick={() => setVisibleCount((v) => v + ITEMS_PER_PAGE)}
                                    variant='secondary'
                                >
                                    {t('common.loadMore')} (
                                    {t('strainsView.matchingStrains', {
                                        count: filteredStrains.length - visibleCount,
                                    })}
                                    )
                                </Button>
                            </div>
                        )}
                    </>
                ))}
        </div>
    );
};

export const StrainsView = memo(StrainsViewComponent);