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
    title?: string;
}> = ({ sortKey, label, currentSort, onSort, className = '', title }) => (
    <button onClick={() => onSort(sortKey)} className={`flex items-center gap-1 transition-colors ${className} ${currentSort.key === sortKey ? 'text-primary-300' : 'text-slate-400 hover:text-slate-100'}`} title={title}>
        <span>{label}</span>
        {currentSort.key === sortKey && (
            currentSort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3" /> : <PhosphorIcons.ArrowDown className="w-3 h-3" />
        )}
    </button>
);

const gridLayout = "grid-cols-[auto_28px_1fr_55px_55px_55px_auto] items-center gap-x-3";

export const StrainListHeader: React.FC<StrainListHeaderProps> = memo(({ sort, handleSort, onToggleAll, areAllOnPageSelected }) => {
    const { t } = useTranslation();

    return (
        <div className={`hidden sm:grid p-2 text-slate-400 text-xs font-semibold uppercase tracking-wider ${gridLayout}`}>
            <input
                type="checkbox"
                checked={areAllOnPageSelected}
                onChange={onToggleAll}
                className="custom-checkbox"
                aria-label={t('strainsView.bulkActions.selectAll')}
            />
            {/* Spacer for icon column */}
            <div></div>
            <SortButton sortKey="name" label={t('strainsView.table.strain')} currentSort={sort} onSort={handleSort} className="!justify-start" />
            
            <SortButton sortKey="thc" label={t('strainsView.table.thc')} currentSort={sort} onSort={handleSort} className="justify-center" />
            <SortButton sortKey="cbd" label={t('strainsView.table.cbd')} currentSort={sort} onSort={handleSort} className="justify-center" />
            <SortButton sortKey="floweringTime" label="WKS" currentSort={sort} onSort={handleSort} className="justify-center" title={t('strainsView.table.flowering')} />
            
            <div className="text-center">{t('common.actions')}</div>
        </div>
    );
});
