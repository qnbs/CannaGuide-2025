import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, SortKey, SortDirection, StrainType } from '@/types';
import { StrainToolbar } from './StrainToolbar';
import { AlphabeticalFilter } from './AlphabeticalFilter';
import { StrainListHeader } from './StrainListHeader';
import { StrainList } from './StrainList';
import { StrainGrid } from './StrainGrid';
import { Pagination } from '@/components/common/Pagination';
import { Card } from '@/components/common/Card';
import { BulkActionsBar } from './BulkActionsBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

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
        strains, totalStrainCount, currentPage, onPageChange, viewMode, isSearching, searchTerm,
        onSearchTermChange, sort, handleSort, letterFilter, handleSetLetterFilter, typeFilter, onToggleTypeFilter,
        isAnyFilterActive, onResetFilters, onOpenDrawer, activeFilterCount, selectedIds, onToggleSelection, onSelect,
        favoriteIds, onToggleFavorite, isUserStrain, onDeleteUserStrain, onClearSelection, onExport,
        onAddToFavorites, onRemoveFromFavorites, onDelete
    } = props;

    const { t } = useTranslation();

    const currentStrains = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return strains.slice(startIndex, endIndex);
    }, [strains, currentPage]);

    const totalPages = Math.ceil(totalStrainCount / ITEMS_PER_PAGE);
    
    const areAllOnPageSelected = useMemo(() => 
        currentStrains.length > 0 && currentStrains.every(s => selectedIds.has(s.id)),
        [currentStrains, selectedIds]
    );

    const handleToggleAll = () => {
        const pageIds = currentStrains.map(s => s.id);
        const currentSelectionOnPage = new Set(Array.from(selectedIds).filter(id => pageIds.includes(id)));
        
        if (currentSelectionOnPage.size === pageIds.length) {
            // Deselect all on page
            pageIds.forEach(id => onToggleSelection(id));
        } else {
            // Select all on page
            pageIds.forEach(id => {
                if (!selectedIds.has(id)) {
                    onToggleSelection(id);
                }
            });
        }
    };


    return (
        <>
            <Card>
                <div className="space-y-4">
                    <StrainToolbar
                        searchTerm={searchTerm}
                        onSearchTermChange={onSearchTermChange}
                        onExport={onExport}
                        onAdd={() => {}} // This is handled by parent
                        onOpenDrawer={onOpenDrawer}
                        activeFilterCount={activeFilterCount}
                        viewMode={viewMode}
                        typeFilter={typeFilter}
                        onToggleTypeFilter={onToggleTypeFilter}
                        isAnyFilterActive={isAnyFilterActive}
                        onResetFilters={onResetFilters}
                    />
                    <AlphabeticalFilter activeLetter={letterFilter} onLetterClick={handleSetLetterFilter} />
                    {viewMode === 'list' && (
                        <StrainListHeader
                            sort={sort}
                            handleSort={handleSort}
                            areAllOnPageSelected={areAllOnPageSelected}
                            onToggleAll={handleToggleAll}
                        />
                    )}
                </div>

                <div className="mt-4">
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

                    {totalStrainCount > 0 && (
                        <div className="mt-6 text-center space-y-4">
                            <p className="text-sm text-slate-400">
                                {t('strainsView.showingCount', { count: currentStrains.length, total: totalStrainCount })}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
                            </div>
                        </div>
                    )}
                </div>
            </Card>

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
