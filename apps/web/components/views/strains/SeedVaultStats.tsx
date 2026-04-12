// ---------------------------------------------------------------------------
// SeedVaultStats -- Inventory statistics dashboard for the Seed Vault
// ---------------------------------------------------------------------------

import React, { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectSeedInventoryStats } from '@/stores/slices/breedingSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { SeedType } from '@/types'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeedVaultStats: React.FC = memo(() => {
    const { t } = useTranslation()
    const stats = useAppSelector(selectSeedInventoryStats)
    const [collapsed, setCollapsed] = useState(false)

    const toggle = useCallback(() => setCollapsed((p) => !p), [])

    if (stats.totalEntries === 0) return null

    const maxTypeCount = Math.max(1, ...Object.values(stats.byType))

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
            <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.04] transition-colors rounded-2xl"
                aria-expanded={!collapsed}
            >
                <span>{t('strainsView.seedVault.stats.title')}</span>
                <PhosphorIcons.ChevronDown
                    className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                />
            </button>
            {!collapsed && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Metric cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatCard
                            label={t('strainsView.seedVault.stats.totalEntries')}
                            value={stats.totalEntries}
                        />
                        <StatCard
                            label={t('strainsView.seedVault.stats.uniqueStrains')}
                            value={stats.uniqueStrains}
                        />
                        <StatCard
                            label={t('strainsView.seedVault.stats.lowStock')}
                            value={stats.lowStockCount}
                            variant={stats.lowStockCount > 0 ? 'warning' : 'default'}
                        />
                        <StatCard
                            label={t('strainsView.seedVault.stats.outOfStock')}
                            value={stats.outOfStockCount}
                            variant={stats.outOfStockCount > 0 ? 'danger' : 'default'}
                        />
                    </div>

                    {/* Type breakdown bars */}
                    <div>
                        <p className="text-xs font-medium text-text-secondary mb-1.5">
                            {t('strainsView.seedVault.stats.byType')}
                        </p>
                        <div className="space-y-1">
                            {(['Feminized', 'Regular', 'Autoflowering', 'Clone'] as SeedType[]).map(
                                (st) => (
                                    <TypeBar
                                        key={st}
                                        label={t(`strainsView.seedVault.types.${st}`)}
                                        count={stats.byType[st]}
                                        max={maxTypeCount}
                                        seedType={st}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

SeedVaultStats.displayName = 'SeedVaultStats'

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

interface StatCardProps {
    label: string
    value: number
    variant?: 'default' | 'warning' | 'danger'
}

const StatCard: React.FC<StatCardProps> = memo(({ label, value, variant = 'default' }) => {
    const variantClasses =
        variant === 'danger'
            ? 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5'
            : variant === 'warning'
              ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
              : 'border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02]'

    const valueClasses =
        variant === 'danger'
            ? 'text-red-400'
            : variant === 'warning'
              ? 'text-amber-400'
              : 'text-slate-100'

    return (
        <div className={`rounded-xl border ${variantClasses} p-3 text-center backdrop-blur-sm`}>
            <p className={`text-xl font-bold tabular-nums ${valueClasses}`}>{value}</p>
            <p className="text-xs text-slate-400 truncate">{label}</p>
        </div>
    )
})

StatCard.displayName = 'StatCard'

// ---------------------------------------------------------------------------
// TypeBar
// ---------------------------------------------------------------------------

const TYPE_BAR_COLORS: Record<SeedType, string> = {
    Feminized: 'bg-pink-500',
    Regular: 'bg-slate-400',
    Autoflowering: 'bg-emerald-500',
    Clone: 'bg-sky-500',
}

interface TypeBarProps {
    label: string
    count: number
    max: number
    seedType: SeedType
}

const TypeBar: React.FC<TypeBarProps> = memo(({ label, count, max, seedType }) => {
    const pct = max > 0 ? (count / max) * 100 : 0
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-24 truncate">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${TYPE_BAR_COLORS[seedType]}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-medium text-slate-200 tabular-nums w-8 text-right">
                {count}
            </span>
        </div>
    )
})

TypeBar.displayName = 'TypeBar'
