// ---------------------------------------------------------------------------
// SeedEntryForm -- Add / Edit form for seed inventory entries
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { allStrainsData } from '@/data/strains'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { SeedInventoryEntry, SeedType, SeedSource } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEED_TYPES: SeedType[] = ['Regular', 'Feminized', 'Autoflowering', 'Clone']
const SEED_SOURCES: SeedSource[] = ['purchase', 'harvest', 'trade', 'gift']
const MAX_AUTOCOMPLETE = 8

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeedEntryFormProps {
    mode: 'add' | 'edit'
    entry?: SeedInventoryEntry | undefined
    onSave: (entry: SeedInventoryEntry) => void
    onCancel: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedEntryForm: React.FC<SeedEntryFormProps> = memo(
    ({ mode, entry, onSave, onCancel }) => {
        const { t } = useTranslation()

        // -- Form state --
        const [strainName, setStrainName] = useState(entry?.strainName ?? '')
        const [strainId, setStrainId] = useState(entry?.strainId ?? '')
        const [quantity, setQuantity] = useState(entry?.quantity ?? 1)
        const [seedType, setSeedType] = useState<SeedType>(entry?.seedType ?? 'Feminized')
        const [breeder, setBreeder] = useState(entry?.breeder ?? '')
        const [notes, setNotes] = useState(entry?.notes ?? '')
        const [quality, setQuality] = useState(entry?.quality ?? 0)
        const [tags, setTags] = useState(entry?.tags ?? [])
        const [tagInput, setTagInput] = useState('')
        const [source, setSource] = useState<SeedSource | ''>(entry?.source ?? '')
        const [storageLocation, setStorageLocation] = useState(entry?.storageLocation ?? '')
        const [batchNumber, setBatchNumber] = useState(entry?.batchNumber ?? '')
        const [germinationRate, setGerminationRate] = useState(
            entry?.germinationRate !== undefined ? String(entry.germinationRate) : '',
        )
        const [acquiredDate, setAcquiredDate] = useState(() => {
            const ts = entry?.acquiredAt ?? Date.now()
            return new Date(ts).toISOString().split('T')[0] ?? ''
        })

        // -- Autocomplete --
        const [showSuggestions, setShowSuggestions] = useState(false)
        const inputRef = useRef<HTMLInputElement>(null)

        const suggestions = useMemo(() => {
            if (!strainName.trim() || strainName.length < 2) return []
            const term = strainName.toLowerCase()
            const matches: Array<{ id: string; name: string }> = []
            for (const s of allStrainsData) {
                if (s.name.toLowerCase().includes(term)) {
                    matches.push({ id: s.id, name: s.name })
                    if (matches.length >= MAX_AUTOCOMPLETE) break
                }
            }
            return matches
        }, [strainName])

        const handleSelectStrain = useCallback((id: string, name: string) => {
            setStrainId(id)
            setStrainName(name)
            setShowSuggestions(false)
        }, [])

        // Close suggestions on outside click
        useEffect(() => {
            const handler = (e: MouseEvent): void => {
                if (
                    inputRef.current &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    !inputRef.current.parentElement?.contains(e.target as Node)
                ) {
                    setShowSuggestions(false)
                }
            }
            document.addEventListener('mousedown', handler)
            return () => document.removeEventListener('mousedown', handler)
        }, [])

        // -- Tags --
        const handleTagKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault()
                    const newTag = tagInput.trim().toLowerCase()
                    if (!tags.includes(newTag)) {
                        setTags((prev) => [...prev, newTag])
                    }
                    setTagInput('')
                }
            },
            [tagInput, tags],
        )

        const handleRemoveTag = useCallback((tag: string) => {
            setTags((prev) => prev.filter((t) => t !== tag))
        }, [])

        // -- Submit --
        const handleSubmit = useCallback(() => {
            if (!strainName.trim()) return

            const parsedGermRate = germinationRate
                ? Math.min(100, Math.max(0, parseInt(germinationRate, 10)))
                : undefined
            const parsedDate = acquiredDate ? new Date(acquiredDate).getTime() : Date.now()

            const result: SeedInventoryEntry = {
                id: entry?.id ?? `seed-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
                strainId: strainId || '',
                strainName: strainName.trim(),
                quantity: Math.max(1, quantity),
                seedType,
                breeder: breeder.trim(),
                quality,
                acquiredAt: parsedDate,
                notes: notes.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
                storageLocation: storageLocation.trim() || undefined,
                germinationRate:
                    parsedGermRate !== undefined && !isNaN(parsedGermRate)
                        ? parsedGermRate
                        : undefined,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                source: (source as SeedSource) || undefined,
                batchNumber: batchNumber.trim() || undefined,
            }

            onSave(result)
        }, [
            entry?.id,
            strainName,
            strainId,
            quantity,
            seedType,
            breeder,
            quality,
            notes,
            tags,
            source,
            storageLocation,
            batchNumber,
            germinationRate,
            acquiredDate,
            onSave,
        ])

        return (
            <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                    {mode === 'edit'
                        ? t('strainsView.seedVault.editEntry')
                        : t('strainsView.seedVault.addEntry')}
                </h3>
                {/* Row 1: Strain + Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Strain with autocomplete */}
                    <div className="relative" ref={inputRef}>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.strainName')}
                        </label>
                        <input
                            type="text"
                            value={strainName}
                            onChange={(e) => {
                                setStrainName(e.target.value)
                                setStrainId('')
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            maxLength={100}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                            placeholder={t('strainsView.seedVault.strainNamePlaceholder')}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleSelectStrain(s.id, s.name)}
                                        className="w-full px-3 py-1.5 text-sm text-left text-text-primary hover:bg-surface-hover transition-colors"
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {strainId && (
                            <p className="text-xs text-accent mt-0.5">
                                {t('strainsView.seedVault.importFromCatalog')}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.quantity')}
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={9999}
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                            }
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                </div>

                {/* Row 2: Seed Type + Breeder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.seedType')}
                        </label>
                        <select
                            value={seedType}
                            onChange={(e) =>
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                setSeedType(e.target.value as SeedType)
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
                            value={breeder}
                            onChange={(e) => setBreeder(e.target.value)}
                            maxLength={100}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                </div>

                {/* Row 3: Source + Date + Storage */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.source')}
                        </label>
                        <select
                            value={source}
                            onChange={(e) =>
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                setSource(e.target.value as SeedSource | '')
                            }
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        >
                            <option value="">--</option>
                            {SEED_SOURCES.map((s) => (
                                <option key={s} value={s}>
                                    {t(`strainsView.seedVault.sources.${s}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.acquiredDate')}
                        </label>
                        <input
                            type="date"
                            value={acquiredDate}
                            onChange={(e) => setAcquiredDate(e.target.value)}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.storageLocation')}
                        </label>
                        <input
                            type="text"
                            value={storageLocation}
                            onChange={(e) => setStorageLocation(e.target.value)}
                            maxLength={100}
                            placeholder={t('strainsView.seedVault.storageLocationPlaceholder')}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                </div>

                {/* Row 4: Quality + Germination Rate + Batch Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quality star rating */}
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.qualityRating')}
                        </label>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setQuality(star === quality ? 0 : star)}
                                    className="text-yellow-500 hover:scale-110 transition-transform"
                                    aria-label={t('strainsView.seedVault.stars', { count: star })}
                                >
                                    <PhosphorIcons.Star
                                        weight={star <= quality ? 'fill' : 'regular'}
                                        className="h-5 w-5"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.germinationRate')} (%)
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={germinationRate}
                            onChange={(e) => setGerminationRate(e.target.value)}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                            {t('strainsView.seedVault.batchNumber')}
                        </label>
                        <input
                            type="text"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            maxLength={50}
                            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                        {t('strainsView.seedVault.tags')}
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-red-500"
                                    aria-label={t('strainsView.seedVault.removeTag')}
                                >
                                    <PhosphorIcons.X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        maxLength={30}
                        placeholder={t('strainsView.seedVault.tagPlaceholder')}
                        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                        {t('strainsView.seedVault.notes')}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1.5 rounded-md text-sm text-text-secondary hover:bg-surface-hover transition-colors"
                    >
                        {t('strainsView.seedVault.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!strainName.trim()}
                        className="px-3 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                    >
                        {t('strainsView.seedVault.save')}
                    </button>
                </div>
            </div>
        )
    },
)

SeedEntryForm.displayName = 'SeedEntryForm'
