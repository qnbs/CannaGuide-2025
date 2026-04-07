import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAppSelector } from '@/stores/store'
import { useDispatch } from 'react-redux'
import {
    selectActiveGrow,
    selectNonArchivedGrows,
    selectGrowCount,
    selectPlantsForGrow,
} from '@/stores/selectors'
import { setActiveGrowId } from '@/stores/slices/growsSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface GrowSwitcherProps {
    onCreateGrow?: () => void
    compact?: boolean
}

const GrowPlantCount: React.FC<{ growId: string }> = memo(({ growId }) => {
    const plants = useAppSelector(selectPlantsForGrow(growId))
    return (
        <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
            {plants.length}
        </span>
    )
})
GrowPlantCount.displayName = 'GrowPlantCount'

const GrowSwitcher: React.FC<GrowSwitcherProps> = memo(({ onCreateGrow, compact }) => {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const activeGrow = useAppSelector(selectActiveGrow)
    const grows = useAppSelector(selectNonArchivedGrows)
    const growCount = useAppSelector(selectGrowCount)
    const [open, setOpen] = useState(false)

    const handleSelect = useCallback(
        (growId: string) => {
            dispatch(setActiveGrowId(growId))
            setOpen(false)
        },
        [dispatch],
    )

    // Hide when only 1 grow (zero disruption for single-grow users)
    if (growCount < 2) return null

    const growColor = activeGrow?.color ?? '#22c55e'
    const growLabel = activeGrow?.emoji
        ? `${activeGrow.emoji} ${activeGrow.name}`
        : (activeGrow?.name ?? '')

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${compact ? 'max-w-[160px]' : 'max-w-[200px]'}`}
                    aria-label={t('settingsView.grows.activeGrow', {
                        name: activeGrow?.name ?? '',
                    })}
                >
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: growColor }}
                    />
                    <span className="truncate">{growLabel}</span>
                    <PhosphorIcons.ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-[100] min-w-[180px] max-w-[240px] animate-in fade-in slide-in-from-top-2 rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-xl backdrop-blur-xl"
                    sideOffset={6}
                    align="start"
                >
                    {grows.map((grow) => {
                        const isActive = grow.id === activeGrow?.id
                        const color = grow.color ?? '#22c55e'
                        return (
                            <DropdownMenu.Item
                                key={grow.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:bg-white/10 ${isActive ? 'bg-white/8 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                onSelect={() => handleSelect(grow.id)}
                            >
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="truncate">
                                    {grow.emoji ? `${grow.emoji} ` : ''}
                                    {grow.name}
                                </span>
                                <GrowPlantCount growId={grow.id} />
                            </DropdownMenu.Item>
                        )
                    })}

                    {onCreateGrow && (
                        <>
                            <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
                            <DropdownMenu.Item
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-400 outline-none transition-colors focus:bg-white/10 hover:bg-white/5"
                                onSelect={onCreateGrow}
                            >
                                <PhosphorIcons.Plus className="h-4 w-4" />
                                <span>{t('settingsView.grows.createGrow')}</span>
                            </DropdownMenu.Item>
                        </>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
})
GrowSwitcher.displayName = 'GrowSwitcher'

export { GrowSwitcher }
