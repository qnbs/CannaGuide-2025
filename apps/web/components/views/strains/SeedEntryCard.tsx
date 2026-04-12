// ---------------------------------------------------------------------------
// SeedEntryCard -- Expandable inventory card with viability + stock status
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { SeedInventoryEntry, SeedType } from '@/types'
import { LOW_STOCK_THRESHOLD } from '@/stores/slices/breedingSlice'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<SeedType, string> = {
    Regular: 'bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-400/20',
    Feminized: 'bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-pink-400/20',
    Autoflowering: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20',
    Clone: 'bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/20',
}

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000
const FOUR_YEARS_MS = 4 * 365.25 * 24 * 60 * 60 * 1000

function getViability(acquiredAt: number, now: number): 'good' | 'declining' | 'expired' {
    const age = now - acquiredAt
    if (age < TWO_YEARS_MS) return 'good'
    if (age < FOUR_YEARS_MS) return 'declining'
    return 'expired'
}

function getStockStatus(quantity: number): 'ok' | 'low' | 'out' {
    if (quantity === 0) return 'out'
    if (quantity <= LOW_STOCK_THRESHOLD) return 'low'
    return 'ok'
}

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeedEntryCardProps {
    entry: SeedInventoryEntry
    onAdjust: (id: string, delta: number) => void
    onRemove: (id: string) => void
    onEdit: (entry: SeedInventoryEntry) => void
    onConsume: (id: string) => void
    bulkMode: boolean
    selected: boolean
    onToggleSelect: (id: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedEntryCard: React.FC<SeedEntryCardProps> = memo(
    ({ entry, onAdjust, onRemove, onEdit, onConsume, bulkMode, selected, onToggleSelect }) => {
        const { t } = useTranslation()
        const [expanded, setExpanded] = useState(false)

        const now = Date.now()
        const viability = getViability(entry.acquiredAt, now)
        const stock = getStockStatus(entry.quantity)

        const toggleExpand = useCallback(() => setExpanded((p) => !p), [])

        const viabilityClasses =
            viability === 'good'
                ? 'text-emerald-400'
                : viability === 'declining'
                  ? 'text-amber-400'
                  : 'text-red-400'

        const stockDotClasses =
            stock === 'ok' ? 'bg-green-500' : stock === 'low' ? 'bg-yellow-500' : 'bg-red-500'

        return (
            <div
                className={`rounded-2xl border backdrop-blur-md transition-all duration-200 ${selected ? 'border-primary-400/40 bg-primary-500/10 shadow-[0_0_20px_rgba(var(--color-primary-400),0.12)]' : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]'}`}
            >
                {/* Main row */}
                <div className="flex items-center gap-3 p-3">
                    {bulkMode && (
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggleSelect(entry.id)}
                            className="h-4 w-4 rounded border-border text-accent"
                        />
                    )}

                    {/* Stock dot */}
                    <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${stockDotClasses}`}
                        title={
                            stock === 'ok'
                                ? t('strainsView.seedVault.inStock')
                                : stock === 'low'
                                  ? t('strainsView.seedVault.lowStockLabel')
                                  : t('strainsView.seedVault.outOfStock')
                        }
                    />

                    {/* Info */}
                    <button
                        type="button"
                        onClick={toggleExpand}
                        className="flex-1 min-w-0 text-left"
                        aria-expanded={expanded}
                        aria-label={
                            expanded
                                ? t('strainsView.seedVault.collapseDetails')
                                : t('strainsView.seedVault.expandDetails')
                        }
                    >
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm text-text-primary truncate">
                                {entry.strainName}
                            </span>
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${TYPE_COLORS[entry.seedType]}`}
                            >
                                {t(`strainsView.seedVault.types.${entry.seedType}`)}
                            </span>
                            {/* Viability indicator */}
                            <span className={`text-xs shrink-0 ${viabilityClasses}`}>
                                {viability === 'good'
                                    ? t('strainsView.seedVault.viabilityGood')
                                    : viability === 'declining'
                                      ? t('strainsView.seedVault.viabilityDeclining')
                                      : t('strainsView.seedVault.viabilityExpired')}
                            </span>
                        </div>
                        {entry.breeder && (
                            <p className="text-xs text-text-secondary truncate">{entry.breeder}</p>
                        )}
                        {/* Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {entry.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </button>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => onAdjust(entry.id, -1)}
                            disabled={entry.quantity <= 0}
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.1] disabled:opacity-30 transition-all"
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
                            className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.1] transition-all"
                            aria-label={t('strainsView.seedVault.increase')}
                        >
                            <PhosphorIcons.Plus className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => onConsume(entry.id)}
                            disabled={entry.quantity <= 0}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-30 transition-all"
                            aria-label={t('strainsView.seedVault.consumeForGrow')}
                            title={t('strainsView.seedVault.consumeForGrow')}
                        >
                            <PhosphorIcons.Plant className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(entry)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/15 transition-all"
                            aria-label={t('strainsView.seedVault.editEntry')}
                        >
                            <PhosphorIcons.PencilSimple className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onRemove(entry.id)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all"
                            aria-label={t('strainsView.seedVault.remove')}
                        >
                            <PhosphorIcons.TrashSimple className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-white/[0.06] animate-fade-in">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2.5 text-xs">
                            {/* Acquired date */}
                            <div>
                                <span className="text-text-secondary">
                                    {t('strainsView.seedVault.acquiredDate')}
                                </span>
                                <p className="text-text-primary font-medium">
                                    {formatDate(entry.acquiredAt)}
                                </p>
                            </div>

                            {/* Quality */}
                            {entry.quality > 0 && (
                                <div>
                                    <span className="text-text-secondary">
                                        {t('strainsView.seedVault.qualityRating')}
                                    </span>
                                    <div className="flex gap-0.5 mt-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <PhosphorIcons.Star
                                                key={s}
                                                weight={s <= entry.quality ? 'fill' : 'regular'}
                                                className={`h-3.5 w-3.5 ${s <= entry.quality ? 'text-amber-400' : 'text-slate-600'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Source */}
                            {entry.source && (
                                <div>
                                    <span className="text-text-secondary">
                                        {t('strainsView.seedVault.source')}
                                    </span>
                                    <p className="text-text-primary font-medium">
                                        {t(`strainsView.seedVault.sources.${entry.source}`)}
                                    </p>
                                </div>
                            )}

                            {/* Storage */}
                            {entry.storageLocation && (
                                <div>
                                    <span className="text-text-secondary">
                                        {t('strainsView.seedVault.storageLocation')}
                                    </span>
                                    <p className="text-text-primary font-medium">
                                        {entry.storageLocation}
                                    </p>
                                </div>
                            )}

                            {/* Germination Rate */}
                            {entry.germinationRate !== undefined && (
                                <div>
                                    <span className="text-text-secondary">
                                        {t('strainsView.seedVault.germinationRate')}
                                    </span>
                                    <p className="text-text-primary font-medium">
                                        {entry.germinationRate}%
                                    </p>
                                </div>
                            )}

                            {/* Batch Number */}
                            {entry.batchNumber && (
                                <div>
                                    <span className="text-text-secondary">
                                        {t('strainsView.seedVault.batchNumber')}
                                    </span>
                                    <p className="text-text-primary font-medium">
                                        {entry.batchNumber}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                            <div className="mt-2 pt-2 border-t border-white/[0.06]">
                                <span className="text-xs text-text-secondary">
                                    {t('strainsView.seedVault.notes')}
                                </span>
                                <p className="text-xs text-text-primary mt-0.5">{entry.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    },
)

SeedEntryCard.displayName = 'SeedEntryCard'

// ---------------------------------------------------------------------------
// Grid variant (compact card for grid view)
// ---------------------------------------------------------------------------

export interface SeedGridCardProps {
    entry: SeedInventoryEntry
    onClick: (entry: SeedInventoryEntry) => void
    bulkMode: boolean
    selected: boolean
    onToggleSelect: (id: string) => void
}

export const SeedGridCard: React.FC<SeedGridCardProps> = memo(
    ({ entry, onClick, bulkMode, selected, onToggleSelect }) => {
        const { t } = useTranslation()
        const stock = getStockStatus(entry.quantity)
        const stockDotClasses =
            stock === 'ok'
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                : stock === 'low'
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]'

        return (
            <div
                className={`rounded-2xl border p-3 cursor-pointer backdrop-blur-md transition-all duration-200 ${selected ? 'border-primary-400/40 bg-primary-500/10 shadow-[0_0_20px_rgba(var(--color-primary-400),0.12)]' : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]'}`}
                onClick={() => (bulkMode ? onToggleSelect(entry.id) : onClick(entry))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (bulkMode) {
                            onToggleSelect(entry.id)
                        } else {
                            onClick(entry)
                        }
                    }
                }}
            >
                <div className="flex items-center gap-2 mb-1">
                    {bulkMode && (
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggleSelect(entry.id)}
                            className="h-3.5 w-3.5 rounded border-border text-accent"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    <span className={`h-2 w-2 rounded-full shrink-0 ${stockDotClasses}`} />
                    <span className="text-sm font-medium text-text-primary truncate">
                        {entry.strainName}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[entry.seedType]}`}
                    >
                        {t(`strainsView.seedVault.types.${entry.seedType}`)}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-text-primary">
                        {entry.quantity}
                    </span>
                </div>
            </div>
        )
    },
)

SeedGridCard.displayName = 'SeedGridCard'
