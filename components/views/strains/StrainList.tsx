import React, { memo } from 'react';
import { Strain, SortKey, SortDirection } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainListItem } from './StrainListItem';

interface StrainListProps {
    strains: Strain[];
    onSelect: (strain: Strain) => void;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onToggleAll: () => void;
    areAllOnPageSelected: boolean;
    isUserStrain: (id: string) => boolean;
    onDelete: (id: string) => void;
    sort: { key: SortKey; direction: SortDirection };
    handleSort: (key: SortKey) => void;
    isPending?: boolean;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
}

const SortButton: React.FC<{
    sortKey: SortKey;
    label: string;
    currentSort: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    className?: string;
}> = ({ sortKey, label, currentSort, onSort, className = '' }) => (
    <button onClick={() => onSort(sortKey)} className={`flex items-center justify-center gap-1 text-xs font-semibold transition-colors ${className} ${currentSort.key === sortKey ? 'text-primary-300' : 'text-slate-400 hover:text-slate-100'}`}>
        {label}
        {currentSort.key === sortKey && (
            currentSort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3" /> : <PhosphorIcons.ArrowDown className="w-3 h-3" />
        )}
    </button>
);

export const StrainList: React.FC<StrainListProps> = memo(({
    strains, onSelect, selectedIds, onToggleSelection, onToggleAll, areAllOnPageSelected, isUserStrain, onDelete,
    sort, handleSort, isPending, favorites, onToggleFavorite
}) => {
    const { t } = useTranslation();
    
    const gridLayout = "grid items-center gap-x-4 px-4 grid-cols-[auto_minmax(0,1.5fr)_repeat(2,minmax(0,0.8fr))_auto] sm:grid-cols-[auto_minmax(0,3fr)_minmax(0,1fr)_repeat(5,minmax(0,1fr))_auto]";

    return (
        <div className={`space-y-2 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            {/* Header / Sort Controls */}
            <div className={`grid ${gridLayout} py-2 bg-slate-800/50 rounded-lg`}>
                 <input
                    type="checkbox"
                    checked={areAllOnPageSelected}
                    onChange={onToggleAll}
                    className="h-5 w-5 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                    aria-label="Select all on page"
                />
                <SortButton sortKey="name" label={t('strainsView.table.strain')} currentSort={sort} onSort={handleSort} className="!justify-start pl-14" />
                <SortButton sortKey="type" label={t('strainsView.table.type')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
                <SortButton sortKey="thc" label={t('strainsView.table.thc')} currentSort={sort} onSort={handleSort} />
                <SortButton sortKey="cbd" label={t('strainsView.table.cbd')} currentSort={sort} onSort={handleSort} />
                <SortButton sortKey="floweringTime" label={t('strainsView.table.flowering')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
                <SortButton sortKey="yield" label={t('strainsView.table.yield')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
                <SortButton sortKey="difficulty" label={t('strainsView.table.difficulty')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
                <div className="text-xs font-semibold text-slate-400 text-center">{t('common.actions')}</div>
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
                    style={{ animationDelay: `${index * 15}ms` }}
                    isFavorite={favorites.has(strain.id)}
                    onToggleFavorite={() => onToggleFavorite(strain.id)}
                />
            ))}
        </div>
    );
});