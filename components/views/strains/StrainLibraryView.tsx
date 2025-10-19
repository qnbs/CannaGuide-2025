import React, { useMemo, useState, useEffect, useCallback, lazy, Suspense, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, SortKey, SortDirection, StrainType, StrainViewTab } from '@/types';
import { StrainToolbar } from './StrainToolbar';
import { StrainList } from './StrainList';
import { StrainGrid } from './StrainGrid';
import { Card } from '@/components/common/Card';
import { BulkActionsBar } from './BulkActionsBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';
import { ITEMS_PER_PAGE } from '@/constants';

interface StrainLibraryViewProps {
    strains: Strain[];
    totalStrainCount: number;
    viewMode: 'list' | 'grid';
    isSearching: boolean;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    sort: { key: SortKey; direction: SortDirection };
    handleSort: (key: SortKey) => void;
    letterFilter: string | null;
    handleSetLetterFilter: (letter: string | null) => void;
    typeFilter: StrainType[];
    onToggleTypeFilter: (type: StrainType) => void;
    onOpenDrawer: () => void;
    activeFilterCount: number;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onSelect: (strain: Strain) => void;
    favoriteIds: Set<string>;
    onToggleFavorite: (id: string) => void;
    isUserStrain: (id: string) => boolean;
    onDeleteUserStrain: (id: string) => void;
    onClearSelection: () => void;
    onAddToFavorites: () => void;
    onRemoveFromFavorites: () => void;
    onDelete?: () => void;
    strainsViewTab: StrainViewTab;
}

export const StrainLibraryView: React.FC<StrainLibraryViewProps> = memo((props) => {
    const {
        strains, totalStrainCount, viewMode, isSearching, searchTerm,
        onSearchTermChange, sort, handleSort, letterFilter, handleSetLetterFilter, typeFilter, onToggleTypeFilter,
        onOpenDrawer, activeFilterCount, selectedIds, onToggleSelection, onSelect,
        favoriteIds, onToggleFavorite, isUserStrain, onDeleteUserStrain, onClearSelection,
        onAddToFavorites, onRemoveFromFavorites, onDelete, strainsViewTab
    } = props;

    const { t } = useTranslation();
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

    useEffect(() => {
        // Reset display count when the source data changes
        setDisplayCount(ITEMS_PER_PAGE);
    }, [strains]);

    const paginatedStrains = useMemo(() => {
        return strains.slice(0, displayCount);
    }, [strains, displayCount]);
    
    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, totalStrainCount));
    };

    return (
        <>
            <div className="sticky top-0 z-20 bg-[rgb(var(--color-bg-primary))] -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 shadow-lg border-b border-slate-800">
                <StrainToolbar
                    searchTerm={searchTerm}
                    onSearchTermChange={onSearchTermChange}
                    onOpenDrawer={onOpenDrawer}
                    activeFilterCount={activeFilterCount}
                    viewMode={viewMode}
                    typeFilter={typeFilter}
                    onToggleTypeFilter={onToggleTypeFilter}
                    sort={sort}
                    handleSort={handleSort}
                    letterFilter={letterFilter}
                    handleSetLetterFilter={handleSetLetterFilter}
                />
            </div>

            <div className="mt-6">
                {isSearching ? (
                    <SkeletonLoader variant={viewMode} count={10} />
                ) : totalStrainCount === 0 ? (
                    <Card className="text-center py-10 text-slate-500">
                        <h3 className="font-semibold">{t('strainsView.emptyStates.noResults.title')}</h3>
                        <p className="text-sm">{t('strainsView.emptyStates.noResults.text')}</p>
                    </Card>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <StrainList
                                strains={paginatedStrains}
                                selectedIds={selectedIds}
                                onToggleSelection={onToggleSelection}
                                onSelect={onSelect}
                                isUserStrain={isUserStrain}
                                onDelete={onDeleteUserStrain}
                                favorites={favoriteIds}
                                onToggleFavorite={onToggleFavorite}
                            />
                        ) : (
                            <StrainGrid
                                strains={paginatedStrains}
                                selectedIds={selectedIds}
                                onToggleSelection={onToggleSelection}
                                onSelect={onSelect}
                                isUserStrain={isUserStrain}
                                onDelete={onDeleteUserStrain}
                                favorites={favoriteIds}
                                onToggleFavorite={onToggleFavorite}
                            />
                        )}
                        {paginatedStrains.length < totalStrainCount && (
                            <LoadMoreButton 
                                onClick={handleLoadMore}
                                visibleCount={paginatedStrains.length}
                                totalCount={totalStrainCount}
                            />
                        )}
                    </>
                )}
            </div>
            
            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={onClearSelection}
                    onAddToFavorites={onAddToFavorites}
                    onRemoveFromFavorites={onRemoveFromFavorites}
                    onDelete={onDelete}
                />
            )}
        </>
    );
});

export default StrainLibraryView;
