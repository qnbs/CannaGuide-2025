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
    <button onClick={() => onSort(sortKey)} className={`flex items-center gap-1 transition-colors ${className} ${currentSort.key === sortKey ? 'text-primary-300' : 'text-slate-400 hover:text-slate-100'}`}>
        <span>{label}</span>
        {currentSort.key === sortKey && (
            currentSort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3" /> : <PhosphorIcons.ArrowDown className="w-3 h-3" />
        )}
    </button>
);

const gridLayout = "grid-cols-[auto_auto_1fr_auto_auto] items-center gap-x-4";

export const StrainListHeader: React.FC<StrainListHeaderProps> = memo(({ sort, handleSort, onToggleAll, areAllOnPageSelected }) => {
    const { t } = useTranslation();

    return (
        <div className={`hidden sm:grid p-3 text-slate-400 text-xs font-semibold uppercase tracking-wider ${gridLayout}`}>
            <input
                type="checkbox"
                checked={areAllOnPageSelected}
                onChange={onToggleAll}
                className="custom-checkbox"
                aria-label="Select all on page"
            />
            {/* This invisible div helps align the Sorte header correctly with the content below it */}
            <div className="w-8"></div> {/* Spacer for icon column */}
            <SortButton sortKey="name" label={t('strainsView.table.strain')} currentSort={sort} onSort={handleSort} className="!justify-start" />
            
            <SortButton sortKey="thc" label={t('strainsView.table.thc')} currentSort={sort} onSort={handleSort} />
            
            <div className="text-right">{t('common.actions')}</div>
        </div>
    );
});