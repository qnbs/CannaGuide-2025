// ---------------------------------------------------------------------------
// SeedVaultTab -- Seed Inventory Manager for CannaGuide 2025
//
// Displays a list of seed inventory entries with add/edit/delete and
// quantity adjustment. Part of the Strains view.
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectSeedInventory,
    selectTotalSeedCount,
    addSeedInventoryEntry,
    removeSeedInventoryEntry,
    adjustSeedQuantity,
} from '@/stores/slices/breedingSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { SeedInventoryEntry, SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEED_TYPES: SeedType[] = ['Regular', 'Feminized', 'Autoflowering', 'Clone']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedVaultTab: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const inventory = useAppSelector(selectSeedInventory)
    const totalSeeds = useAppSelector(selectTotalSeedCount)

    const [showAddForm, setShowAddForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<SeedType | 'all'>('all')

    // -- Form state --
    const [formStrainName, setFormStrainName] = useState('')
    const [formQuantity, setFormQuantity] = useState(1)
    const [formSeedType, setFormSeedType] = useState<SeedType>('Feminized')
    const [formBreeder, setFormBreeder] = useState('')
    const [formNotes, setFormNotes] = useState('')

    const resetForm = useCallback(() => {
        setFormStrainName('')
        setFormQuantity(1)
        setFormSeedType('Feminized')
        setFormBreeder('')
        setFormNotes('')
    }, [])

    const handleAdd = useCallback(() => {
        if (!formStrainName.trim()) return

        const entry: SeedInventoryEntry = {
            id: `seed-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            strainId: '',
            strainName: formStrainName.trim(),
            quantity: Math.max(1, formQuantity),
            seedType: formSeedType,
            breeder: formBreeder.trim() || '',
            quality: 5,
            acquiredAt: Date.now(),
            notes: formNotes.trim() || undefined,
        }

        dispatch(addSeedInventoryEntry(entry))
        resetForm()
        setShowAddForm(false)
    }, [dispatch, formStrainName, formQuantity, formSeedType, formBreeder, formNotes, resetForm])

    const handleRemove = useCallback(
        (id: string) => {
            dispatch(removeSeedInventoryEntry(id))
        },
        [dispatch],
    )

    const handleAdjust = useCallback(
        (id: string, delta: number) => {
            dispatch(adjustSeedQuantity({ entryId: id, delta }))
        },
        [dispatch],
    )

    // -- Filtering --
    const filteredInventory = useMemo(() => {
        let items = inventory
        if (filterType !== 'all') {
            items = items.filter((e) => e.seedType === filterType)
        }
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            items = items.filter(
                (e) =>
                    e.strainName.toLowerCase().includes(term) ||
                    (e.breeder && e.breeder.toLowerCase().includes(term)),
            )
        }
        return items
    }, [inventory, filterType, searchTerm])

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
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
                >
                    <PhosphorIcons.Plus className="h-4 w-4" />
                    {t('strainsView.seedVault.addEntry')}
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('strainsView.seedVault.strainName')}
                            </label>
                            <input
                                type="text"
                                value={formStrainName}
                                onChange={(e) => setFormStrainName(e.target.value)}
                                maxLength={100}
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                                placeholder={t('strainsView.seedVault.strainNamePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('strainsView.seedVault.quantity')}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={9999}
                                value={formQuantity}
                                onChange={(e) =>
                                    setFormQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('strainsView.seedVault.seedType')}
                            </label>
                            <select
                                value={formSeedType}
                                onChange={(e) =>
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                    setFormSeedType(e.target.value as SeedType)
                                }
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            >
                                {SEED_TYPES.map((st) => (
                                    <option key={st} value={st}>
                                        {t(`strainsView.seedVault.types.${st}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                                {t('strainsView.seedVault.breeder')}
                            </label>
                            <input
                                type="text"
                                value={formBreeder}
                                onChange={(e) => setFormBreeder(e.target.value)}
                                maxLength={100}
                                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.notes')}
                        </label>
                        <textarea
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            maxLength={500}
                            rows={2}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary resize-none"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm()
                                setShowAddForm(false)
                            }}
                            className="px-3 py-1.5 rounded-md text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                        >
                            {t('strainsView.seedVault.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!formStrainName.trim()}
                            className="px-3 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                        >
                            {t('strainsView.seedVault.save')}
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('strainsView.seedVault.searchPlaceholder')}
                    className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                />
                <select
                    value={filterType}
                    onChange={(e) =>
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        setFilterType(e.target.value as SeedType | 'all')
                    }
                    className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                >
                    <option value="all">{t('strainsView.seedVault.allTypes')}</option>
                    {SEED_TYPES.map((st) => (
                        <option key={st} value={st}>
                            {t(`strainsView.seedVault.types.${st}`)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Inventory List */}
            {filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                    <PhosphorIcons.ArchiveBox className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t('strainsView.seedVault.empty')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredInventory.map((entry) => (
                        <SeedEntryCard
                            key={entry.id}
                            entry={entry}
                            onAdjust={handleAdjust}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

SeedVaultTab.displayName = 'SeedVaultTab'

// ---------------------------------------------------------------------------
// SeedEntryCard
// ---------------------------------------------------------------------------

interface SeedEntryCardProps {
    entry: SeedInventoryEntry
    onAdjust: (id: string, delta: number) => void
    onRemove: (id: string) => void
}

const SeedEntryCard: React.FC<SeedEntryCardProps> = memo(({ entry, onAdjust, onRemove }) => {
    const { t } = useTranslation()

    const typeColors: Record<SeedType, string> = {
        Regular: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        Feminized: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        Autoflowering: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        Clone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm text-text-primary truncate">
                        {entry.strainName}
                    </span>
                    <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[entry.seedType]}`}
                    >
                        {t(`strainsView.seedVault.types.${entry.seedType}`)}
                    </span>
                </div>
                {entry.breeder && (
                    <p className="text-xs text-text-secondary truncate">{entry.breeder}</p>
                )}
                {entry.notes && (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{entry.notes}</p>
                )}
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onAdjust(entry.id, -1)}
                    disabled={entry.quantity <= 0}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-surface-hover disabled:opacity-30 transition-colors"
                    aria-label={t('strainsView.seedVault.decrease')}
                >
                    <PhosphorIcons.Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-text-primary tabular-nums">
                    {entry.quantity}
                </span>
                <button
                    type="button"
                    onClick={() => onAdjust(entry.id, 1)}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border hover:bg-surface-hover transition-colors"
                    aria-label={t('strainsView.seedVault.increase')}
                >
                    <PhosphorIcons.Plus className="h-3 w-3" />
                </button>
            </div>

            {/* Delete */}
            <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="h-7 w-7 flex items-center justify-center rounded text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label={t('strainsView.seedVault.remove')}
            >
                <PhosphorIcons.TrashSimple className="h-4 w-4" />
            </button>
        </div>
    )
})

SeedEntryCard.displayName = 'SeedEntryCard'
