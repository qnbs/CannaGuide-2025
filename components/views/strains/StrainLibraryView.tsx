import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, SortKey, SortDirection, StrainType } from '@/types';
import { StrainToolbar } from './StrainToolbar';
import { AlphabeticalFilter } from './AlphabeticalFilter';
import { StrainListHeader } from './StrainListHeader';
import { StrainList } from './StrainList';
import { StrainGrid } from './StrainGrid';
import { Card } from '@/components/common/Card';
import { BulkActionsBar } from './BulkActionsBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { LoadMoreButton } from '@/components/common/LoadMoreButton';

const ITEMS_PER_PAGE = 25;

interface StrainLibraryViewProps {
    strains: Strain[];
    totalStrainCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
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
    isAnyFilterActive: boolean;
    onResetFilters: () => void;
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
    onExport: () => void;
    onAddToFavorites: () => void;
    onRemoveFromFavorites: () => void;
    onDelete?: () => void;
}

export const StrainLibraryView: React.FC<StrainLibraryViewProps> = (props) => {
    const {
        strains, totalStrainCount, viewMode, isSearching, searchTerm,
        onSearchTermChange, sort, handleSort, letterFilter, handleSetLetterFilter, typeFilter, onToggleTypeFilter,
        isAnyFilterActive, onResetFilters, onOpenDrawer, activeFilterCount, selectedIds, onToggleSelection, onSelect,
        favoriteIds, onToggleFavorite, isUserStrain, onDeleteUserStrain, onClearSelection, onExport,
        onAddToFavorites, onRemoveFromFavorites, onDelete
    } = props;

    const { t } = useTranslation();
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

    useEffect(() => {
        setDisplayCount(ITEMS_PER_PAGE);
    }, [strains]);


    const currentStrains = useMemo(() => {
        return strains.slice(0, displayCount);
    }, [strains, displayCount]);
    
    const areAllOnPageSelected = useMemo(() => 
        currentStrains.length > 0 && currentStrains.every(s => selectedIds.has(s.id)),
        [currentStrains, selectedIds]
    );

    const handleToggleAll = () => {
        const pageIds = currentStrains.map(s => s.id);
        const allSelected = areAllOnPageSelected;

        pageIds.forEach(id => {
            if ((allSelected && selectedIds.has(id)) || (!allSelected && !selectedIds.has(id))) {
                 onToggleSelection(id);
            }
        });
    };
    
    const handleLoadMore = () => {
        setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, totalStrainCount));
    };


    return (
        <>
            <Card className="!p-0">
                 <div className="sticky top-[var(--header-height,64px)] z-20 bg-[rgba(var(--color-bg-primary),0.95)] backdrop-blur-sm mt-[-1rem] sm:mt-[-1.5rem] pt-4 sm:pt-6">
                    <div className="px-4 space-y-4">
                        <StrainToolbar
                            searchTerm={searchTerm}
                            onSearchTermChange={onSearchTermChange}
                            onOpenDrawer={onOpenDrawer}
                            activeFilterCount={activeFilterCount}
                            viewMode={viewMode}
                            typeFilter={typeFilter}
                            onToggleTypeFilter={onToggleTypeFilter}
                            isAnyFilterActive={isAnyFilterActive}
                            onResetFilters={onResetFilters}
                        />
                        <AlphabeticalFilter activeLetter={letterFilter} onLetterClick={handleSetLetterFilter} />
                    </div>
                    {viewMode === 'list' && (
                        <div className="mt-4 border-b border-t border-slate-700/50">
                            <StrainListHeader
                                sort={sort}
                                handleSort={handleSort}
                                areAllOnPageSelected={areAllOnPageSelected}
                                onToggleAll={handleToggleAll}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 pb-0">
                    {isSearching ? (
                        <SkeletonLoader variant={viewMode} count={10} />
                    ) : totalStrainCount === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <h3 className="font-semibold">{t('strainsView.emptyStates.noResults.title')}</h3>
                            <p className="text-sm">{t('strainsView.emptyStates.noResults.text')}</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        <StrainList
                            strains={currentStrains}
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
                            strains={currentStrains}
                            selectedIds={selectedIds}
                            onToggleSelection={onToggleSelection}
                            onSelect={onSelect}
                            isUserStrain={isUserStrain}
                            onDelete={onDeleteUserStrain}
                            favorites={favoriteIds}
                            onToggleFavorite={onToggleFavorite}
                        />
                    )}
                </div>
            </Card>
            
            <LoadMoreButton 
                onClick={handleLoadMore}
                visibleCount={currentStrains.length}
                totalCount={totalStrainCount}
            />

            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={onClearSelection}
                    onExport={onExport}
                    onAddToFavorites={onAddToFavorites}
                    onRemoveFromFavorites={onRemoveFromFavorites}
                    onDelete={onDelete}
                />
            )}
        </>
    );
};

export default StrainLibraryView;