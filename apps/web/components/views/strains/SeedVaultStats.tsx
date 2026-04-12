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
        <div className="rounded-lg border border-border bg-surface">
            <button
                type="button"
                onClick={toggle}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors rounded-lg"
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
            ? 'border-red-200 dark:border-red-900/40'
            : variant === 'warning'
              ? 'border-yellow-200 dark:border-yellow-900/40'
              : 'border-border'

    const valueClasses =
        variant === 'danger'
            ? 'text-red-600 dark:text-red-400'
            : variant === 'warning'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-text-primary'

    return (
        <div className={`rounded-md border ${variantClasses} bg-surface p-2.5 text-center`}>
            <p className={`text-xl font-bold tabular-nums ${valueClasses}`}>{value}</p>
            <p className="text-xs text-text-secondary truncate">{label}</p>
        </div>
    )
})

StatCard.displayName = 'StatCard'

// ---------------------------------------------------------------------------
// TypeBar
// ---------------------------------------------------------------------------

const TYPE_BAR_COLORS: Record<SeedType, string> = {
    Feminized: 'bg-pink-500 dark:bg-pink-400',
    Regular: 'bg-gray-500 dark:bg-gray-400',
    Autoflowering: 'bg-green-500 dark:bg-green-400',
    Clone: 'bg-blue-500 dark:bg-blue-400',
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
            <span className="text-xs text-text-secondary w-24 truncate">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${TYPE_BAR_COLORS[seedType]}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-medium text-text-primary tabular-nums w-8 text-right">
                {count}
            </span>
        </div>
    )
})

TypeBar.displayName = 'TypeBar'
