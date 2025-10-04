import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SortKey, SortDirection } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface StrainListHeaderProps {
    sort: { key: SortKey; direction: SortDirection };
    handleSort: (key: SortKey) => void;
    onToggleAll: () => void;
    areAllOnPageSelected: boolean;
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

const gridLayout = "grid items-center gap-x-2 pl-4 pr-2 grid-cols-[auto_minmax(0,2fr)_minmax(0,0.8fr)_auto] sm:grid-cols-[auto_minmax(0,4fr)_minmax(0,1fr)_repeat(4,minmax(0,80px))_auto]";

export const StrainListHeader: React.FC<StrainListHeaderProps> = memo(({ sort, handleSort, onToggleAll, areAllOnPageSelected }) => {
    const { t } = useTranslation();

    return (
        <div className={`grid ${gridLayout} py-2`}>
            <input
                type="checkbox"
                checked={areAllOnPageSelected}
                onChange={onToggleAll}
                className="h-5 w-5 rounded border-slate-500 bg-slate-700/50 text-primary-500 focus:ring-primary-500"
                aria-label="Select all on page"
            />
            <SortButton sortKey="name" label={t('strainsView.table.strain')} currentSort={sort} onSort={handleSort} className="!justify-start" />
            <SortButton sortKey="type" label={t('strainsView.table.type')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
            <SortButton sortKey="thc" label={t('strainsView.table.thc')} currentSort={sort} onSort={handleSort} />
            <SortButton sortKey="floweringTime" label={t('strainsView.table.flowering')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
            <SortButton sortKey="yield" label={t('strainsView.table.yield')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
            <SortButton sortKey="difficulty" label={t('strainsView.table.difficulty')} currentSort={sort} onSort={handleSort} className="hidden sm:flex" />
            <div className="text-xs font-semibold text-slate-400 text-right pr-2">{t('common.actions')}</div>
        </div>
    );
});
