// ---------------------------------------------------------------------------
// SeedVaultToolbar -- Search, filter, sort, view-toggle, bulk-actions bar
// ---------------------------------------------------------------------------

import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SeedSortKey = 'name' | 'quantity' | 'acquiredAt' | 'seedType' | 'breeder' | 'quality'
export type SeedSortDir = 'asc' | 'desc'
export type StockFilter = 'all' | 'inStock' | 'lowStock' | 'outOfStock'
export type VaultViewMode = 'list' | 'grid'

const SEED_TYPES: SeedType[] = ['Regular', 'Feminized', 'Autoflowering', 'Clone']

export interface SeedVaultToolbarProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    filterType: SeedType | 'all'
    onFilterTypeChange: (value: SeedType | 'all') => void
    filterStock: StockFilter
    onFilterStockChange: (value: StockFilter) => void
    sortKey: SeedSortKey
    onSortKeyChange: (value: SeedSortKey) => void
    sortDir: SeedSortDir
    onSortDirChange: (value: SeedSortDir) => void
    viewMode: VaultViewMode
    onViewModeChange: (value: VaultViewMode) => void
    bulkMode: boolean
    onBulkModeToggle: () => void
    selectedCount: number
    onBulkDelete: () => void
    onSelectAll: () => void
    onDeselectAll: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedVaultToolbar: React.FC<SeedVaultToolbarProps> = memo(
    ({
        searchTerm,
        onSearchChange,
        filterType,
        onFilterTypeChange,
        filterStock,
        onFilterStockChange,
        sortKey,
        onSortKeyChange,
        sortDir,
        onSortDirChange,
        viewMode,
        onViewModeChange,
        bulkMode,
        onBulkModeToggle,
        selectedCount,
        onBulkDelete,
        onSelectAll,
        onDeselectAll,
    }) => {
        const { t } = useTranslation()

        const handleSortDirToggle = useCallback(() => {
            onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')
        }, [sortDir, onSortDirChange])

        return (
            <div className="space-y-3">
                {/* Row 1: Search + View toggle */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={t('strainsView.seedVault.searchPlaceholder')}
                            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 backdrop-blur-sm transition-colors"
                        />
                    </div>
                    <div className="flex rounded-xl border border-white/[0.1] overflow-hidden bg-white/[0.03]">
                        <button
                            type="button"
                            onClick={() => onViewModeChange('list')}
                            className={`h-9 w-9 flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-primary-500/20 text-primary-300 shadow-[inset_0_0_12px_rgba(var(--color-primary-400),0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'}`}
                            aria-label={t('strainsView.seedVault.listView')}
                        >
                            <PhosphorIcons.ListBullets className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange('grid')}
                            className={`h-9 w-9 flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-300 shadow-[inset_0_0_12px_rgba(var(--color-primary-400),0.15)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'}`}
                            aria-label={t('strainsView.seedVault.gridView')}
                        >
                            <PhosphorIcons.GridFour className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Row 2: Filters + Sort */}
                <div className="flex flex-wrap gap-2">
                    {/* Type filter */}
                    <select
                        value={filterType}
                        onChange={(e) =>
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            onFilterTypeChange(e.target.value as SeedType | 'all')
                        }
                        className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors"
                    >
                        <option value="all">{t('strainsView.seedVault.allTypes')}</option>
                        {SEED_TYPES.map((st) => (
                            <option key={st} value={st}>
                                {t(`strainsView.seedVault.types.${st}`)}
                            </option>
                        ))}
                    </select>

                    {/* Stock filter */}
                    <select
                        value={filterStock}
                        onChange={(e) =>
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            onFilterStockChange(e.target.value as StockFilter)
                        }
                        className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors"
                    >
                        <option value="all">{t('strainsView.seedVault.stockAll')}</option>
                        <option value="inStock">{t('strainsView.seedVault.stockInStock')}</option>
                        <option value="lowStock">{t('strainsView.seedVault.stockLow')}</option>
                        <option value="outOfStock">{t('strainsView.seedVault.stockOut')}</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={sortKey}
                        onChange={(e) =>
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            onSortKeyChange(e.target.value as SeedSortKey)
                        }
                        className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-colors"
                    >
                        <option value="name">{t('strainsView.seedVault.sort.name')}</option>
                        <option value="quantity">{t('strainsView.seedVault.sort.quantity')}</option>
                        <option value="acquiredAt">
                            {t('strainsView.seedVault.sort.acquiredDate')}
                        </option>
                        <option value="seedType">{t('strainsView.seedVault.sort.seedType')}</option>
                        <option value="breeder">{t('strainsView.seedVault.sort.breeder')}</option>
                        <option value="quality">{t('strainsView.seedVault.sort.quality')}</option>
                    </select>

                    <button
                        type="button"
                        onClick={handleSortDirToggle}
                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200 transition-all"
                        aria-label={
                            sortDir === 'asc'
                                ? t('strainsView.seedVault.sortDirection.asc')
                                : t('strainsView.seedVault.sortDirection.desc')
                        }
                    >
                        {sortDir === 'asc' ? (
                            <PhosphorIcons.ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                            <PhosphorIcons.ArrowDown className="h-3.5 w-3.5" />
                        )}
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bulk mode toggle */}
                    <button
                        type="button"
                        onClick={onBulkModeToggle}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${bulkMode ? 'bg-primary-500/20 text-primary-300 ring-1 ring-inset ring-primary-400/30' : 'border border-white/[0.1] bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200'}`}
                    >
                        {t('strainsView.seedVault.bulkActions')}
                    </button>
                </div>

                {/* Bulk actions bar */}
                {bulkMode && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500/10 border border-primary-400/20 backdrop-blur-sm">
                        <span className="text-xs font-medium text-slate-200">
                            {t('strainsView.seedVault.selectedCount', { count: selectedCount })}
                        </span>
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onSelectAll}
                            className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
                        >
                            {t('strainsView.seedVault.selectAll')}
                        </button>
                        <button
                            type="button"
                            onClick={onDeselectAll}
                            className="text-xs text-slate-400 hover:text-slate-300 hover:underline"
                        >
                            {t('strainsView.seedVault.deselectAll')}
                        </button>
                        {selectedCount > 0 && (
                            <button
                                type="button"
                                onClick={onBulkDelete}
                                className="px-3 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-medium hover:bg-red-500/30 transition-colors"
                            >
                                {t('strainsView.seedVault.bulkDelete')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        )
    },
)

SeedVaultToolbar.displayName = 'SeedVaultToolbar'
