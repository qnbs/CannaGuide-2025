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
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary-600/10 via-accent-600/5 to-transparent border border-white/[0.06] px-5 py-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <PhosphorIcons.ArchiveBox className="h-5 w-5 text-primary-400" />
                        {t('strainsView.seedVault.title')}
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {t('strainsView.seedVault.totalSeeds', { count: totalSeeds })}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddForm}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] text-white text-sm font-semibold shadow-[0_8px_24px_rgba(var(--color-primary-500),0.25)] hover:shadow-[0_12px_32px_rgba(var(--color-primary-500),0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
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
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm animate-fade-in">
                    <PhosphorIcons.Warning className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="text-sm text-red-300 flex-1">
                        {t('strainsView.seedVault.confirmDeleteBulkMsg', {
                            count: selectedIds.size,
                        })}
                    </span>
                    <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                        {t('strainsView.seedVault.confirmDelete')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmBulkDelete(false)}
                        className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-white/[0.06] transition-colors"
                    >
                        {t('strainsView.seedVault.cancel')}
                    </button>
                </div>
            )}

            {/* Inventory */}
            {processedInventory.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                        <PhosphorIcons.ArchiveBox className="h-8 w-8 text-primary-400" />
                    </div>
                    <p className="text-sm text-slate-400">{t('strainsView.seedVault.empty')}</p>
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
                                <div className="flex items-center gap-2 ml-4 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm text-xs animate-fade-in">
                                    <span className="text-red-300 flex-1">
                                        {t('strainsView.seedVault.confirmDeleteMsg')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(entry.id)}
                                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/20 hover:bg-red-500/30 transition-colors"
                                    >
                                        {t('strainsView.seedVault.confirmDelete')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2.5 py-1 rounded-lg text-slate-400 hover:bg-white/[0.06] transition-colors"
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
