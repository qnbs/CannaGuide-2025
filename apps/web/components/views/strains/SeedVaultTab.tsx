// ---------------------------------------------------------------------------
// SeedVaultTab -- Seed Inventory Manager (Orchestrator)
//
// Integrates: Stats, Toolbar, Form, Card/GridCard, PollenLog
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectSeedInventory,
    selectTotalSeedCount,
    addSeedInventoryEntry,
    updateSeedInventoryEntry,
    removeSeedInventoryEntry,
    adjustSeedQuantity,
    batchRemoveSeedEntries,
    consumeSeedForGrow,
    LOW_STOCK_THRESHOLD,
} from '@/stores/slices/breedingSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SeedVaultStats } from '@/components/views/strains/SeedVaultStats'
import {
    SeedVaultToolbar,
    type SeedSortKey,
    type SeedSortDir,
    type StockFilter,
    type VaultViewMode,
} from '@/components/views/strains/SeedVaultToolbar'
import { SeedEntryForm } from '@/components/views/strains/SeedEntryForm'
import { SeedEntryCard, SeedGridCard } from '@/components/views/strains/SeedEntryCard'
import { SeedVaultPollenLog } from '@/components/views/strains/SeedVaultPollenLog'
import type { SeedInventoryEntry, SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Sorting helper
// ---------------------------------------------------------------------------

function compareSeedEntries(
    a: SeedInventoryEntry,
    b: SeedInventoryEntry,
    key: SeedSortKey,
    dir: SeedSortDir,
): number {
    const m = dir === 'asc' ? 1 : -1
    switch (key) {
        case 'name':
            return m * a.strainName.localeCompare(b.strainName)
        case 'quantity':
            return m * (a.quantity - b.quantity)
        case 'acquiredAt':
            return m * (a.acquiredAt - b.acquiredAt)
        case 'seedType':
            return m * a.seedType.localeCompare(b.seedType)
        case 'breeder':
            return m * (a.breeder ?? '').localeCompare(b.breeder ?? '')
        case 'quality':
            return m * ((a.quality ?? 0) - (b.quality ?? 0))
        default:
            return 0
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedVaultTab: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const inventory = useAppSelector(selectSeedInventory)
    const totalSeeds = useAppSelector(selectTotalSeedCount)

    // -- UI state --
    const [showForm, setShowForm] = useState(false)
    const [editEntry, setEditEntry] = useState<SeedInventoryEntry | undefined>(undefined)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

    // -- Toolbar state --
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<SeedType | 'all'>('all')
    const [filterStock, setFilterStock] = useState<StockFilter>('all')
    const [sortKey, setSortKey] = useState<SeedSortKey>('acquiredAt')
    const [sortDir, setSortDir] = useState<SeedSortDir>('desc')
    const [viewMode, setViewMode] = useState<VaultViewMode>('list')
    const [bulkMode, setBulkMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState(new Set<string>())

    // -- Form handlers --
    const openAddForm = useCallback(() => {
        setEditEntry(undefined)
        setShowForm(true)
    }, [])

    const openEditForm = useCallback((entry: SeedInventoryEntry) => {
        setEditEntry(entry)
        setShowForm(true)
    }, [])

    const handleSave = useCallback(
        (entry: SeedInventoryEntry) => {
            if (editEntry) {
                const { id, ...changes } = entry
                dispatch(updateSeedInventoryEntry({ entryId: id, changes }))
            } else {
                dispatch(addSeedInventoryEntry(entry))
            }
            setShowForm(false)
            setEditEntry(undefined)
        },
        [dispatch, editEntry],
    )

    const handleCancel = useCallback(() => {
        setShowForm(false)
        setEditEntry(undefined)
    }, [])

    // -- Entry actions --
    const handleAdjust = useCallback(
        (id: string, delta: number) => {
            dispatch(adjustSeedQuantity({ entryId: id, delta }))
        },
        [dispatch],
    )

    const handleRemove = useCallback(
        (id: string) => {
            dispatch(removeSeedInventoryEntry(id))
            setConfirmDeleteId(null)
        },
        [dispatch],
    )

    const handleConsume = useCallback(
        (id: string) => {
            dispatch(consumeSeedForGrow({ entryId: id, quantity: 1 }))
        },
        [dispatch],
    )

    // -- Bulk actions --
    const toggleBulkMode = useCallback(() => {
        setBulkMode((prev) => {
            if (prev) setSelectedIds(new Set())
            return !prev
        })
    }, [])

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const handleBulkDelete = useCallback(() => {
        if (selectedIds.size === 0) return
        if (!confirmBulkDelete) {
            setConfirmBulkDelete(true)
            return
        }
        dispatch(batchRemoveSeedEntries(Array.from(selectedIds)))
        setSelectedIds(new Set())
        setBulkMode(false)
        setConfirmBulkDelete(false)
    }, [dispatch, selectedIds, confirmBulkDelete])

    // -- Filtering + Sorting --
    const processedInventory = useMemo(() => {
        let items = inventory

        // Type filter
        if (filterType !== 'all') {
            items = items.filter((e) => e.seedType === filterType)
        }

        // Stock filter
        if (filterStock === 'inStock') {
            items = items.filter((e) => e.quantity > LOW_STOCK_THRESHOLD)
        } else if (filterStock === 'lowStock') {
            items = items.filter((e) => e.quantity > 0 && e.quantity <= LOW_STOCK_THRESHOLD)
        } else if (filterStock === 'outOfStock') {
            items = items.filter((e) => e.quantity === 0)
        }

        // Search
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            items = items.filter(
                (e) =>
                    e.strainName.toLowerCase().includes(term) ||
                    (e.breeder && e.breeder.toLowerCase().includes(term)) ||
                    (e.tags && e.tags.some((tg) => tg.toLowerCase().includes(term))),
            )
        }

        // Sort
        return [...items].sort((a, b) => compareSeedEntries(a, b, sortKey, sortDir))
    }, [inventory, filterType, filterStock, searchTerm, sortKey, sortDir])

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(processedInventory.map((e) => e.id)))
    }, [processedInventory])

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set())
        setConfirmBulkDelete(false)
    }, [])

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                        {t('strainsView.seedVault.title')}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {t('strainsView.seedVault.totalSeeds', { count: totalSeeds })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddForm}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                    <PhosphorIcons.Plus className="h-4 w-4" />
                    {t('strainsView.seedVault.addEntry')}
                </button>
            </div>

            {/* Statistics */}
            <SeedVaultStats />

            {/* Add / Edit Form */}
            {showForm && (
                <SeedEntryForm
                    mode={editEntry ? 'edit' : 'add'}
                    entry={editEntry}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}

            {/* Toolbar */}
            <SeedVaultToolbar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                filterStock={filterStock}
                onFilterStockChange={setFilterStock}
                sortKey={sortKey}
                onSortKeyChange={setSortKey}
                sortDir={sortDir}
                onSortDirChange={setSortDir}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                bulkMode={bulkMode}
                onBulkModeToggle={toggleBulkMode}
                selectedCount={selectedIds.size}
                onBulkDelete={handleBulkDelete}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
            />

            {/* Bulk delete confirmation */}
            {confirmBulkDelete && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                    <PhosphorIcons.Warning className="h-4 w-4 text-red-500 shrink-0" />
                    <span className="text-sm text-red-700 dark:text-red-300 flex-1">
                        {t('strainsView.seedVault.confirmDeleteBulkMsg', {
                            count: selectedIds.size,
                        })}
                    </span>
                    <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="px-2.5 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        {t('strainsView.seedVault.confirmDelete')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmBulkDelete(false)}
                        className="px-2.5 py-1 rounded text-xs text-text-secondary hover:bg-surface-hover transition-colors"
                    >
                        {t('strainsView.seedVault.cancel')}
                    </button>
                </div>
            )}

            {/* Inventory */}
            {processedInventory.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                    <PhosphorIcons.ArchiveBox className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t('strainsView.seedVault.empty')}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {processedInventory.map((entry) => (
                        <SeedGridCard
                            key={entry.id}
                            entry={entry}
                            onClick={openEditForm}
                            bulkMode={bulkMode}
                            selected={selectedIds.has(entry.id)}
                            onToggleSelect={toggleSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {processedInventory.map((entry) => (
                        <React.Fragment key={entry.id}>
                            <SeedEntryCard
                                entry={entry}
                                onAdjust={handleAdjust}
                                onRemove={
                                    confirmDeleteId === entry.id
                                        ? () => handleRemove(entry.id)
                                        : () => setConfirmDeleteId(entry.id)
                                }
                                onEdit={openEditForm}
                                onConsume={handleConsume}
                                bulkMode={bulkMode}
                                selected={selectedIds.has(entry.id)}
                                onToggleSelect={toggleSelect}
                            />
                            {confirmDeleteId === entry.id && (
                                <div className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 text-xs">
                                    <span className="text-red-700 dark:text-red-300 flex-1">
                                        {t('strainsView.seedVault.confirmDeleteMsg')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(entry.id)}
                                        className="px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                                    >
                                        {t('strainsView.seedVault.confirmDelete')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-0.5 rounded text-text-secondary hover:bg-surface-hover"
                                    >
                                        {t('strainsView.seedVault.cancel')}
                                    </button>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Pollen Log */}
            <SeedVaultPollenLog />
        </div>
    )
})

SeedVaultTab.displayName = 'SeedVaultTab'
