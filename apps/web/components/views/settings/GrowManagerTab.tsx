import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    selectAllGrows,
    selectNonArchivedGrows,
    selectActiveGrowId,
    selectGrowCount,
    selectPlantsForGrow,
    selectGrowSummary,
} from '@/stores/selectors'
import { setActiveGrowId } from '@/stores/slices/growsSlice'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { GrowCreateModal } from './GrowCreateModal'
import { GrowEditModal } from './GrowEditModal'
import { MAX_GROWS } from '@/constants'
import { cn } from '@/lib/utils'
import type { Grow } from '@/types'

const GrowPlantBadge: React.FC<{ growId: string }> = memo(({ growId }) => {
    const plants = useAppSelector(selectPlantsForGrow(growId))
    const { t } = useTranslation()
    return (
        <span className="text-xs text-slate-400">
            {t('settingsView.grows.plantCount', { count: plants.length })}
        </span>
    )
})
GrowPlantBadge.displayName = 'GrowPlantBadge'

const GrowStatsRow: React.FC<{ growId: string }> = memo(({ growId }) => {
    const summary = useAppSelector(selectGrowSummary(growId))
    const { t } = useTranslation()
    return (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span>
                {t('settingsView.grows.statsPlants', { count: summary.plantCount })}
            </span>
            {summary.journalEntryCount > 0 && (
                <span>
                    {t('settingsView.grows.statsJournal', { count: summary.journalEntryCount })}
                </span>
            )}
            {summary.averageHealth > 0 && (
                <span>
                    {t('settingsView.grows.statsHealth', {
                        value: Math.round(summary.averageHealth),
                    })}
                </span>
            )}
            {summary.oldestPlantAge > 0 && (
                <span>
                    {t('settingsView.grows.statsAge', { days: summary.oldestPlantAge })}
                </span>
            )}
        </div>
    )
})
GrowStatsRow.displayName = 'GrowStatsRow'

const GrowManagerTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const allGrows = useAppSelector(selectAllGrows)
    const activeGrows = useAppSelector(selectNonArchivedGrows)
    const activeGrowId = useAppSelector(selectActiveGrowId)
    const growCount = useAppSelector(selectGrowCount)
    const [createOpen, setCreateOpen] = useState(false)
    const [editGrow, setEditGrow] = useState<Grow | null>(null)

    const archivedGrows = allGrows.filter((g) => g.archived)

    const handleActivate = useCallback(
        (id: string) => {
            dispatch(setActiveGrowId(id))
        },
        [dispatch],
    )

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                            {t('settingsView.grows.title')}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {t('settingsView.grows.subtitle', { count: growCount, max: MAX_GROWS })}
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateOpen(true)}
                        disabled={growCount >= MAX_GROWS}
                        size="sm"
                    >
                        <PhosphorIcons.Plus className="mr-1.5 h-4 w-4" />
                        {t('settingsView.grows.createGrow')}
                    </Button>
                </div>

                <div className="space-y-2">
                    {activeGrows.map((grow) => {
                        const isActive = grow.id === activeGrowId
                        return (
                            <div
                                key={grow.id}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                                    isActive
                                        ? 'border-primary-500/40 bg-primary-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/8',
                                )}
                            >
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor: grow.color ?? '#22c55e',
                                    }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-slate-100">
                                        {grow.emoji ? `${grow.emoji} ` : ''}
                                        {grow.name}
                                    </p>
                                    {grow.description && (
                                        <p className="truncate text-xs text-slate-400">
                                            {grow.description}
                                        </p>
                                    )}
                                    <GrowPlantBadge growId={grow.id} />
                                    <GrowStatsRow growId={grow.id} />
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isActive && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleActivate(grow.id)}
                                            className="text-xs"
                                        >
                                            {t('settingsView.grows.activate')}
                                        </Button>
                                    )}
                                    {isActive && (
                                        <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-[10px] font-semibold text-primary-300">
                                            {t('settingsView.grows.active')}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setEditGrow(grow)}
                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                                        aria-label={t('settingsView.grows.editGrow')}
                                    >
                                        <PhosphorIcons.PencilSimple className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {archivedGrows.length > 0 && (
                <Card>
                    <h3 className="mb-3 text-sm font-semibold text-slate-400">
                        {t('settingsView.grows.archived')}
                    </h3>
                    <div className="space-y-2">
                        {archivedGrows.map((grow) => (
                            <div
                                key={grow.id}
                                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-3 opacity-60"
                            >
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor: grow.color ?? '#22c55e',
                                    }}
                                />
                                <p className="flex-1 truncate text-sm text-slate-300">
                                    {grow.name}
                                </p>
                                <GrowPlantBadge growId={grow.id} />
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <GrowCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
            {editGrow && (
                <GrowEditModal
                    isOpen={Boolean(editGrow)}
                    onClose={() => setEditGrow(null)}
                    grow={editGrow}
                />
            )}
        </div>
    )
}

export default GrowManagerTab
