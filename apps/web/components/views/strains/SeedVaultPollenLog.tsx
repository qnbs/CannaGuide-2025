// ---------------------------------------------------------------------------
// SeedVaultPollenLog -- Pollen record management section
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectPollenRecords,
    addPollenRecord,
    removePollenRecord,
} from '@/stores/slices/breedingSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { PollenRecord } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedVaultPollenLog: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const records = useAppSelector(selectPollenRecords)

    const [collapsed, setCollapsed] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [filterViable, setFilterViable] = useState(false)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    // -- Form state --
    const [donorName, setDonorName] = useState('')
    const [collectedDate, setCollectedDate] = useState(
        () => new Date().toISOString().split('T')[0] ?? '',
    )
    const [storage, setStorage] = useState('')
    const [viable, setViable] = useState(true)
    const [notes, setNotes] = useState('')

    const resetForm = useCallback(() => {
        setDonorName('')
        setCollectedDate(new Date().toISOString().split('T')[0] ?? '')
        setStorage('')
        setViable(true)
        setNotes('')
    }, [])

    const handleAdd = useCallback(() => {
        if (!donorName.trim()) return

        const record: PollenRecord = {
            id: `pollen-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
            donorStrainId: '',
            donorStrainName: donorName.trim(),
            collectedAt: collectedDate ? new Date(collectedDate).getTime() : Date.now(),
            storageLocation: storage.trim() || undefined,
            viable,
            notes: notes.trim() || undefined,
        }

        dispatch(addPollenRecord(record))
        resetForm()
        setShowAddForm(false)
    }, [dispatch, donorName, collectedDate, storage, viable, notes, resetForm])

    const handleConfirmDelete = useCallback(
        (id: string) => {
            dispatch(removePollenRecord(id))
            setConfirmDeleteId(null)
        },
        [dispatch],
    )

    const filteredRecords = filterViable ? records.filter((r) => r.viable) : records

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
            <button
                type="button"
                onClick={() => setCollapsed((p) => !p)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.04] transition-colors rounded-2xl"
                aria-expanded={!collapsed}
            >
                <div className="flex items-center gap-2">
                    <PhosphorIcons.Plant className="h-4 w-4 text-accent" />
                    <span>
                        {t('strainsView.seedVault.pollenSection.title')} ({records.length})
                    </span>
                </div>
                <PhosphorIcons.ChevronDown
                    className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                />
            </button>

            {!collapsed && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] text-white text-xs font-semibold shadow-[0_4px_16px_rgba(var(--color-primary-500),0.2)] hover:shadow-[0_6px_20px_rgba(var(--color-primary-500),0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <PhosphorIcons.Plus className="h-3.5 w-3.5" />
                            {t('strainsView.seedVault.pollenSection.addRecord')}
                        </button>
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={() => setFilterViable((p) => !p)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${filterViable ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/20' : 'text-slate-400 hover:bg-white/[0.06]'}`}
                        >
                            {filterViable
                                ? t('strainsView.seedVault.pollenSection.filterViable')
                                : t('strainsView.seedVault.pollenSection.showAll')}
                        </button>
                    </div>

                    {/* Add form */}
                    {showAddForm && (
                        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        {t('strainsView.seedVault.pollenSection.donor')}
                                    </label>
                                    <input
                                        type="text"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        maxLength={100}
                                        placeholder={t(
                                            'strainsView.seedVault.pollenSection.donorPlaceholder',
                                        )}
                                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 backdrop-blur-sm transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        {t('strainsView.seedVault.pollenSection.collectedDate')}
                                    </label>
                                    <input
                                        type="date"
                                        value={collectedDate}
                                        onChange={(e) => setCollectedDate(e.target.value)}
                                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 backdrop-blur-sm transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        {t('strainsView.seedVault.pollenSection.storageLocation')}
                                    </label>
                                    <input
                                        type="text"
                                        value={storage}
                                        onChange={(e) => setStorage(e.target.value)}
                                        maxLength={100}
                                        placeholder={t(
                                            'strainsView.seedVault.pollenSection.storagePlaceholder',
                                        )}
                                        className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 backdrop-blur-sm transition-colors"
                                    />
                                </div>
                                <div className="flex items-end gap-3 pb-0.5">
                                    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={viable}
                                            onChange={(e) => setViable(e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-accent"
                                        />
                                        {t('strainsView.seedVault.pollenSection.viable')}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    {t('strainsView.seedVault.pollenSection.notes')}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength={300}
                                    rows={2}
                                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 backdrop-blur-sm transition-colors resize-none"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm()
                                        setShowAddForm(false)
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-all"
                                >
                                    {t('strainsView.seedVault.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={!donorName.trim()}
                                    className="px-3 py-1.5 rounded-xl bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] text-white text-xs font-semibold hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-200"
                                >
                                    {t('strainsView.seedVault.save')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Records list */}
                    {filteredRecords.length === 0 ? (
                        <p className="text-xs text-text-secondary text-center py-4">
                            {t('strainsView.seedVault.pollenSection.empty')}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {filteredRecords.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-text-primary truncate">
                                                {r.donorStrainName}
                                            </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${r.viable ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20' : 'bg-red-500/15 text-red-300 ring-red-400/20'}`}
                                            >
                                                {r.viable
                                                    ? t(
                                                          'strainsView.seedVault.pollenSection.viable',
                                                      )
                                                    : t(
                                                          'strainsView.seedVault.pollenSection.notViable',
                                                      )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary">
                                            {formatDate(r.collectedAt)}
                                            {r.storageLocation && ` -- ${r.storageLocation}`}
                                        </p>
                                        {r.notes && (
                                            <p className="text-xs text-text-secondary mt-0.5 truncate">
                                                {r.notes}
                                            </p>
                                        )}
                                    </div>

                                    {confirmDeleteId === r.id ? (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleConfirmDelete(r.id)}
                                                className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/20 text-xs hover:bg-red-500/30 transition-colors"
                                            >
                                                {t('strainsView.seedVault.confirmDelete')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:bg-white/[0.06] transition-colors"
                                            >
                                                {t('strainsView.seedVault.cancel')}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(r.id)}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all shrink-0"
                                            aria-label={t(
                                                'strainsView.seedVault.pollenSection.remove',
                                            )}
                                        >
                                            <PhosphorIcons.TrashSimple className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
})

SeedVaultPollenLog.displayName = 'SeedVaultPollenLog'
