import React from 'react';
import { Strain, SortKey, AppSettings } from '@/types';
import StrainListItem from './StrainListItem';
import { useTranslation } from 'react-i18next';
import { LIST_GRID_CLASS } from './constants';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface StrainListProps {
    strains: Strain[];
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onSelect: (strain: Strain) => void;
    onToggleAll: () => void;
    visibleColumns: AppSettings['strainsViewSettings']['visibleColumns'];
    isUserStrain: (id: string) => boolean;
    onDelete: (id: string) => void;
    sort: { key: SortKey; direction: string; };
    handleSort: (key: SortKey) => void;
    isPending?: boolean;
    favorites: Set<string>;
    onToggleFavorite: (id: string) => void;
}

export const StrainList: React.FC<StrainListProps> = ({ 
    strains, 
    selectedIds, 
    onToggleAll, 
    sort, 
    handleSort, 
    onToggleSelection,
    onSelect,
    visibleColumns, 
    isUserStrain, 
    onDelete,
    isPending,
    favorites,
    onToggleFavorite
}) => {
    const { t } = useTranslation();

    const SortIndicator: React.FC<{ sortKey: SortKey }> = ({ sortKey }) => {
        if (sort.key !== sortKey) return <div className="w-4 h-4 opacity-30"><PhosphorIcons.ArrowUp /></div>;
        return sort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-4 h-4" /> : <PhosphorIcons.ArrowDown className="w-4 h-4" />;
    };

    return (
        <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
            <div className={`${LIST_GRID_CLASS} sticky top-16 z-10 bg-slate-900/70 backdrop-blur-md border-b border-slate-700/50 text-xs uppercase font-semibold text-slate-400 px-3 py-2 rounded-lg`}>
                <input type="checkbox" checked={selectedIds.size === strains.length && strains.length > 0} onChange={onToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                <button className="flex items-center gap-1 text-left hover:text-slate-100" onClick={() => handleSort('name')}>{t('strainsView.table.strain')}<SortIndicator sortKey="name" /></button>
                {visibleColumns.type && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('type')}>{t('strainsView.table.type')}<SortIndicator sortKey="type" /></button>}
                {visibleColumns.thc && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('thc')}>{t('strainsView.table.thc')}<SortIndicator sortKey="thc" /></button>}
                {visibleColumns.cbd && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('cbd')}>{t('strainsView.table.cbd')}<SortIndicator sortKey="cbd" /></button>}
                {visibleColumns.floweringTime && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('floweringTime')}>{t('strainsView.table.flowering')}<SortIndicator sortKey="floweringTime" /></button>}
                {visibleColumns.yield && <button className="hidden sm:flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('yield')}>{t('strainsView.table.yield')}<SortIndicator sortKey="yield" /></button>}
                <button className="flex items-center gap-1 hover:text-slate-100" onClick={() => handleSort('difficulty')}>{t('strainsView.table.level')}<SortIndicator sortKey="difficulty" /></button>
                <div className="text-right">{t('common.actions')}</div>
            </div>
            <div className="space-y-2">
                {strains.map((strain, index) => <StrainListItem
                    key={strain.id}
                    strain={strain}
                    isSelected={selectedIds.has(strain.id)}
                    onToggleSelection={onToggleSelection}
                    onSelect={onSelect}
                    visibleColumns={visibleColumns}
                    isUserStrain={isUserStrain(strain.id)}
                    onDelete={onDelete}
                    index={index}
                    isFavorite={favorites.has(strain.id)}
                    onToggleFavorite={() => onToggleFavorite(strain.id)}
                />)}
            </div>
        </div>
    );
};