import React, { memo } from 'react';
import { Strain, SortKey, SortDirection } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainListItem } from './StrainListItem';
import { LIST_GRID_CLASS } from './constants';

interface StrainListProps {
    strains: Strain[];
    onSelect: (strain: Strain) => void;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onToggleAll: () => void;
    isUserStrain: (id: string) => boolean;
    onDelete: (id: string) => void;
    visibleColumns: Record<string, boolean>;
    sort: { key: SortKey; direction: SortDirection };
    handleSort: (key: SortKey) => void;
    isPending?: boolean;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
}

const SortableHeader: React.FC<{
    sortKey: SortKey;
    label: string;
    currentSort: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    className?: string;
}> = ({ sortKey, label, currentSort, onSort, className = '' }) => (
    <button onClick={() => onSort(sortKey)} className={`flex items-center gap-1 ${className}`}>
        {label}
        {currentSort.key === sortKey && (
            currentSort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3" /> : <PhosphorIcons.ArrowDown className="w-3 h-3" />
        )}
    </button>
);

export const StrainList: React.FC<StrainListProps> = memo(({
    strains, onSelect, selectedIds, onToggleSelection, onToggleAll, isUserStrain, onDelete,
    visibleColumns, sort, handleSort, isPending, favorites, onToggleFavorite
}) => {
    const { t } = useTranslation();
    const areAllSelected = selectedIds.size > 0 && strains.length > 0 && strains.every(s => selectedIds.has(s.id));

    return (
        <div className={`space-y-2 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {/* Header */}
            <div className={`${LIST_GRID_CLASS} px-3 py-2 text-xs font-semibold text-slate-400 uppercase hidden sm:grid`}>
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={areAllSelected}
                        onChange={onToggleAll}
                        className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                        aria-label="Select all"
                    />
                </div>
                <SortableHeader sortKey="name" label={t('strainsView.table.strain')} currentSort={sort} onSort={handleSort} />
                {visibleColumns.type && <SortableHeader sortKey="type" label={t('strainsView.table.type')} currentSort={sort} onSort={handleSort} className="justify-center" />}
                {visibleColumns.thc && <SortableHeader sortKey="thc" label={t('strainsView.table.thc')} currentSort={sort} onSort={handleSort} />}
                {visibleColumns.cbd && <SortableHeader sortKey="cbd" label={t('strainsView.table.cbd')} currentSort={sort} onSort={handleSort} />}
                {visibleColumns.floweringTime && <SortableHeader sortKey="floweringTime" label={t('strainsView.table.flowering')} currentSort={sort} onSort={handleSort} />}
                {visibleColumns.yield && <SortableHeader sortKey="yield" label={t('strainsView.table.yield')} currentSort={sort} onSort={handleSort} className="hidden md:flex" />}
                {visibleColumns.difficulty && <SortableHeader sortKey="difficulty" label={t('strainsView.table.difficulty')} currentSort={sort} onSort={handleSort} />}
                <span className="text-right">{t('common.actions')}</span>
            </div>

            {/* Body */}
            {strains.map((strain, index) => (
                <StrainListItem
                    key={strain.id}
                    strain={strain}
                    onSelect={onSelect}
                    isSelected={selectedIds.has(strain.id)}
                    onToggleSelection={onToggleSelection}
                    isUserStrain={isUserStrain(strain.id)}
                    onDelete={onDelete}
                    visibleColumns={visibleColumns}
                    style={{ animationDelay: `${index * 15}ms` }}
                    isFavorite={favorites.has(strain.id)}
                    onToggleFavorite={() => onToggleFavorite(strain.id)}
                />
            ))}
        </div>
    );
});
