import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Strain, SortKey, SortDirection, StrainType, StrainViewTab } from '@/types';
import { StrainToolbar } from './StrainToolbar';
import { StrainList } from './StrainList';
import { StrainGrid } from './StrainGrid';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/ui/button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { BulkActionsBar } from './BulkActionsBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

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
        onAddToFavorites, onRemoveFromFavorites, onDelete, strainsViewTab: _strainsViewTab
    } = props;

    const { t } = useTranslation();

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
                        <PhosphorIcons.MagnifyingGlass className="w-14 h-14 mx-auto text-slate-400 mb-3" />
                        <h3 className="font-semibold text-slate-300">{t('strainsView.emptyStates.noResults.title')}</h3>
                        <p className="text-sm mb-4">{t('strainsView.emptyStates.noResults.text')}</p>
                        {searchTerm && (
                            <Button size="sm" variant="secondary" onClick={() => onSearchTermChange('')}>
                                {t('common.clear')}
                            </Button>
                        )}
                    </Card>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <StrainList
                                strains={strains}
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
                                strains={strains}
                                selectedIds={selectedIds}
                                onToggleSelection={onToggleSelection}
                                onSelect={onSelect}
                                isUserStrain={isUserStrain}
                                favorites={favoriteIds}
                                onToggleFavorite={onToggleFavorite}
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

StrainLibraryView.displayName = 'StrainLibraryView';

export default StrainLibraryView;
