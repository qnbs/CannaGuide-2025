import React, { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { StrainViewTab } from '@/types'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { deleteStrainTip, updateStrainTip, deleteExport, updateExport } from '@/stores/slices/savedItemsSlice'
import type { StrainsViewController } from '@/hooks/useStrainsViewController'

const StrainLibraryView = lazy(() =>
    import('./StrainLibraryView').then((m) => ({ default: m.StrainLibraryView })),
)
const StrainTipsView = lazy(() => import('./StrainTipsView'))
const GenealogyView = lazy(() =>
    import('./GenealogyView').then((m) => ({ default: m.GenealogyView })),
)
const ExportsManagerView = lazy(() => import('./ExportsManagerView'))
const BreedingLabView = lazy(() =>
    import('./BreedingLab').then((m) => ({ default: m.BreedingLab })),
)
const SeedVaultView = lazy(() =>
    import('./SeedVaultTab').then((m) => ({ default: m.SeedVaultTab })),
)
const GeneticTrendsView = lazy(() =>
    import('./GeneticTrendsView').then((m) => ({ default: m.GeneticTrendsView })),
)
const DailyStrains = lazy(() => import('./DailyStrains').then((m) => ({ default: m.DailyStrains })))
const StrainComparisonView = lazy(() =>
    import('./StrainComparisonView').then((m) => ({ default: m.StrainComparisonView })),
)

type StrainsViewContentProps = Pick<
    StrainsViewController,
    | 'isLoading'
    | 'loadError'
    | 'loadStrains'
    | 'strainsViewTab'
    | 'strainsViewMode'
    | 'filteredStrains'
    | 'isSearching'
    | 'searchTerm'
    | 'setSearchTerm'
    | 'sort'
    | 'handleSort'
    | 'letterFilter'
    | 'handleSetLetterFilter'
    | 'typeFilter'
    | 'handleToggleTypeFilter'
    | 'handleOpenDrawer'
    | 'activeFilterCount'
    | 'selectedIdsSet'
    | 'handleToggleSelection'
    | 'handleSelect'
    | 'favoriteIds'
    | 'handleToggleFavorite'
    | 'isUserStrain'
    | 'handleDeleteUserStrain'
    | 'handleClearSelection'
    | 'handleAddSelectedToFavorites'
    | 'handleRemoveSelectedFromFavorites'
    | 'handleBulkDelete'
    | 'savedTips'
    | 'savedExports'
    | 'allStrains'
    | 'dispatch'
>

export const StrainsViewContent: React.FC<StrainsViewContentProps> = ({
    isLoading,
    loadError,
    loadStrains,
    strainsViewTab,
    strainsViewMode,
    filteredStrains,
    isSearching,
    searchTerm,
    setSearchTerm,
    sort,
    handleSort,
    letterFilter,
    handleSetLetterFilter,
    typeFilter,
    handleToggleTypeFilter,
    handleOpenDrawer,
    activeFilterCount,
    selectedIdsSet,
    handleToggleSelection,
    handleSelect,
    favoriteIds,
    handleToggleFavorite,
    isUserStrain,
    handleDeleteUserStrain,
    handleClearSelection,
    handleAddSelectedToFavorites,
    handleRemoveSelectedFromFavorites,
    handleBulkDelete,
    savedTips,
    savedExports,
    allStrains,
    dispatch,
}) => {
    const { t } = useTranslation()

    if (isLoading) return <SkeletonLoader variant="list" count={5} />

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
        )
    }

    switch (strainsViewTab) {
        case StrainViewTab.All:
        case StrainViewTab.MyStrains:
        case StrainViewTab.Favorites: {
            let bulkDeleteHandler: (() => void) | undefined
            if (strainsViewTab === StrainViewTab.MyStrains) {
                bulkDeleteHandler = handleBulkDelete
            }
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
                            onDelete={bulkDeleteHandler}
                            strainsViewTab={strainsViewTab}
                        />
                    </Suspense>
                </ErrorBoundary>
            )
        }
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
            )
        case StrainViewTab.Genealogy:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <GenealogyView allStrains={allStrains} onNodeClick={handleSelect} />
                    </Suspense>
                </ErrorBoundary>
            )
        case StrainViewTab.DailyStrains:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <DailyStrains />
                    </Suspense>
                </ErrorBoundary>
            )
        case StrainViewTab.Comparison:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <StrainComparisonView allStrains={allStrains} />
                    </Suspense>
                </ErrorBoundary>
            )
        case StrainViewTab.BreedingLab:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <BreedingLabView allStrains={allStrains} />
                    </Suspense>
                </ErrorBoundary>
            )
        case StrainViewTab.SeedVault:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <SeedVaultView />
                    </Suspense>
                </ErrorBoundary>
            )
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
            )
        case StrainViewTab.Trends:
            return (
                <ErrorBoundary>
                    <Suspense fallback={<SkeletonLoader count={3} />}>
                        <GeneticTrendsView />
                    </Suspense>
                </ErrorBoundary>
            )
        default:
            return null
    }
}
