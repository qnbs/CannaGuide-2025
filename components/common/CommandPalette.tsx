import React, { useDeferredValue, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Command as Cmdk } from 'cmdk'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Command } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    groupAndSortCommands,
    searchAndRankCommands,
    recordCommandUsage,
    getRecentCommands,
} from '@/services/commandService'
import { useCommandPalette } from '@/hooks/useCommandPalette'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

/** Highlight matching characters in a title for the current query. */
const HighlightedTitle: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query.trim()) return <>{text}</>
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const idx = lowerText.indexOf(lowerQuery)

    if (idx === -1) return <>{text}</>

    return (
        <>
            {text.slice(0, idx)}
            <span className="text-primary-400 underline decoration-primary-400/40 underline-offset-2">
                {text.slice(idx, idx + query.length)}
            </span>
            {text.slice(idx + query.length)}
        </>
    )
}
HighlightedTitle.displayName = 'HighlightedTitle'

/** Keyboard shortcut badge */
const KbdBadge: React.FC<{ keys: string[] }> = ({ keys }) => (
    <div className="flex flex-shrink-0 items-center gap-1">
        {keys.map((key) => (
            <kbd
                key={key}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400"
            >
                {key}
            </kbd>
        ))}
    </div>
)
KbdBadge.displayName = 'KbdBadge'

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const deferredQuery = useDeferredValue(query)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const shouldAutoFocusInput =
        typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
    const { allCommands } = useCommandPalette()

    // Track stale deferred value for loading indicator
    const isSearching = query !== deferredQuery

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            if (shouldAutoFocusInput) {
                window.requestAnimationFrame(() => {
                    inputRef.current?.focus()
                })
            }
        }
    }, [isOpen, shouldAutoFocusInput])

    // Build recently-used section for empty-query state
    const recentCommandIds = useMemo(() => {
        if (!isOpen) return []
        return getRecentCommands().map((r) => r.id)
    }, [isOpen])

    const recentCommands = useMemo(
        () =>
            recentCommandIds
                .map((id) => allCommands.find((c) => c.id === id))
                .filter((c): c is Command => c !== undefined),
        [recentCommandIds, allCommands],
    )

    const displayedCommands = useMemo(() => {
        if (!deferredQuery.trim()) return groupAndSortCommands(allCommands)
        return groupAndSortCommands(searchAndRankCommands(allCommands, deferredQuery))
    }, [deferredQuery, allCommands])

    const groupedCommands = useMemo(() => {
        const groups: Array<{ id: string; title: string; commands: Command[] }> = []
        let currentGroup: { id: string; title: string; commands: Command[] } | null = null

        displayedCommands.forEach((command) => {
            if (command.isHeader) {
                currentGroup = { id: command.id, title: command.title, commands: [] }
                groups.push(currentGroup)
                return
            }

            if (!currentGroup) {
                currentGroup = {
                    id: `group-${command.group}`,
                    title: command.group,
                    commands: [],
                }
                groups.push(currentGroup)
            }

            currentGroup.commands.push(command)
        })

        return groups.filter((group) => group.commands.length > 0)
    }, [displayedCommands])

    const handleCommandClick = useCallback(
        (command: Command) => {
            if (!command.isHeader) {
                recordCommandUsage(command.id)
                command.action()
                onClose()
            }
        },
        [onClose],
    )

    // Localised group names
    const localiseGroupName = useCallback(
        (name: string): string => {
            const key = `commandPalette.groups.${name.toLowerCase()}`
            const translated = t(key)
            // If the key doesn't resolve, fall back to raw name
            return translated === key ? name : translated
        },
        [t],
    )

    const commandCount = allCommands.length
    const matchCount = displayedCommands.filter((c) => !c.isHeader).length

    return (
        <Cmdk.Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
            label={t('commandPalette.title')}
            className="fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-[101] h-[calc(100dvh-max(1rem,env(safe-area-inset-top)+env(safe-area-inset-bottom)))] w-[calc(100%-1rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-white/20 bg-[rgba(var(--color-bg-component),0.96)] shadow-2xl backdrop-blur-xl sm:top-[12vh] sm:bottom-auto sm:h-auto sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:rounded-xl"
            overlayClassName="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md"
        >
            <VisuallyHidden>
                <DialogPrimitive.Title>{t('commandPalette.title')}</DialogPrimitive.Title>
            </VisuallyHidden>
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    aria-label={t('commandPalette.close')}
                >
                    <PhosphorIcons.X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                    <PhosphorIcons.CommandLine className="h-5 w-5 text-primary-400" />
                    <h2 className="font-display text-base font-bold text-slate-100">
                        {t('commandPalette.title')}
                    </h2>
                </div>
                <KbdBadge keys={['⌘', 'K']} />
            </div>

            {/* ── Search ──────────────────────────────────────────── */}
            <div className="relative border-b border-white/10 px-4 py-3">
                <PhosphorIcons.MagnifyingGlass className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Cmdk.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t('commandPalette.placeholder')}
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pl-10 pr-20 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                {/* Result count badge */}
                <div className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2">
                    {deferredQuery.trim() ? (
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-500">
                            {matchCount}/{commandCount}
                        </span>
                    ) : isSearching ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
                    ) : null}
                </div>
            </div>

            {/* ── Command List ────────────────────────────────────── */}
            <Cmdk.List className="max-h-[calc(100dvh-16rem)] overflow-y-auto overscroll-contain p-2 sm:max-h-[50vh]">
                <Cmdk.Empty className="flex flex-col items-center gap-2 p-8 text-center">
                    <PhosphorIcons.MagnifyingGlass className="h-8 w-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">
                        {t('commandPalette.noResults')}
                    </p>
                    <p className="text-xs text-slate-500">{t('commandPalette.noResultsHint')}</p>
                </Cmdk.Empty>

                {/* Recently Used (only when no search query) */}
                {!deferredQuery.trim() && recentCommands.length > 0 && (
                    <Cmdk.Group
                        heading={t('commandPalette.recentlyUsed')}
                        className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-primary-400/70"
                    >
                        {recentCommands.map((command) => {
                            const CommandIcon = command.icon
                            return (
                                <Cmdk.Item
                                    key={`recent-${command.id}`}
                                    value={`recent ${command.title} ${command.group} ${command.keywords ?? ''}`}
                                    onSelect={() => handleCommandClick(command)}
                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors data-[selected=true]:bg-primary-500/10 data-[selected=true]:text-primary-200"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-400 group-data-[selected=true]:bg-primary-500/20 group-data-[selected=true]:text-primary-300">
                                            <div className="h-4 w-4">
                                                <CommandIcon />
                                            </div>
                                        </div>
                                        <span className="truncate text-sm font-medium">
                                            {command.title}
                                        </span>
                                    </div>
                                    <div className="h-3 w-3 flex-shrink-0 text-slate-600">
                                        <PhosphorIcons.ArrowClockwise />
                                    </div>
                                </Cmdk.Item>
                            )
                        })}
                    </Cmdk.Group>
                )}

                {/* Grouped Commands */}
                {groupedCommands.map((group) => (
                    <Cmdk.Group
                        key={group.id}
                        heading={localiseGroupName(group.title)}
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-slate-500"
                    >
                        {group.commands.map((command) => {
                            const CommandIcon = command.icon
                            return (
                                <Cmdk.Item
                                    key={command.id}
                                    value={`${command.title} ${command.group} ${command.keywords ?? ''} ${command.subtitle ?? ''}`}
                                    onSelect={() => handleCommandClick(command)}
                                    className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors data-[selected=true]:bg-primary-500/10 data-[selected=true]:text-primary-200"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-400 group-data-[selected=true]:bg-primary-500/20 group-data-[selected=true]:text-primary-300">
                                            <div className="h-4 w-4">
                                                <CommandIcon />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                <HighlightedTitle
                                                    text={command.title}
                                                    query={deferredQuery}
                                                />
                                            </p>
                                            {command.subtitle && (
                                                <p className="truncate text-[11px] text-slate-500">
                                                    {command.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {command.shortcut && <KbdBadge keys={command.shortcut} />}
                                </Cmdk.Item>
                            )
                        })}
                    </Cmdk.Group>
                ))}
            </Cmdk.List>

            {/* ── Footer ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                        <KbdBadge keys={['↑', '↓']} />
                        {t('commandPalette.footer.navigate')}
                    </span>
                    <span className="flex items-center gap-1">
                        <KbdBadge keys={['↵']} />
                        {t('commandPalette.footer.select')}
                    </span>
                    <span className="flex items-center gap-1">
                        <KbdBadge keys={['Esc']} />
                        {t('commandPalette.footer.close')}
                    </span>
                </div>
                <span className="text-[10px] tabular-nums text-slate-600">
                    {commandCount} {t('commandPalette.footer.navigate').toLowerCase()}
                </span>
            </div>
        </Cmdk.Dialog>
    )
}
