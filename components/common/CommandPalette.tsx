import React, { useDeferredValue, useMemo, useState, useEffect, useRef } from 'react'
import { Command as Cmdk } from 'cmdk'
import { Command } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { groupAndSortCommands } from '@/services/commandService'
import { useCommandPalette } from '@/hooks/useCommandPalette'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const deferredQuery = useDeferredValue(query)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const shouldAutoFocusInput =
        typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
    const { allCommands } = useCommandPalette()

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

    const displayedCommands = useMemo(() => {
        if (!deferredQuery.trim()) return groupAndSortCommands(allCommands)

        const lowerCaseQuery = deferredQuery.toLowerCase()
        const fuzzyRegex = new RegExp(lowerCaseQuery.split('').map(escapeRegExp).join('.*?'), 'i')

        const filtered = allCommands.filter((command) => {
            const commandText = [
                command.title,
                command.group,
                command.keywords || '',
                command.subtitle || '',
            ]
                .join(' ')
                .toLowerCase()
            return fuzzyRegex.test(commandText)
        })

        return groupAndSortCommands(filtered)
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

    const handleCommandClick = (command: Command) => {
        if (!command.isHeader) {
            command.action()
            onClose()
        }
    }

    return (
        <Cmdk.Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
            label={t('commandPalette.title')}
            className="fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-[101] h-[calc(100dvh-max(1rem,env(safe-area-inset-top)+env(safe-area-inset-bottom)))] w-[calc(100%-1rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-white/20 bg-[rgba(var(--color-bg-component),0.94)] shadow-2xl sm:top-[15vh] sm:bottom-auto sm:h-auto sm:w-[calc(100%-2rem)] sm:max-w-xl sm:rounded-lg"
            overlayClassName="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md"
        >
            <div className="relative flex items-center justify-center gap-3 border-b border-slate-700/50 px-4 py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    aria-label={t('commandPalette.close')}
                >
                    <PhosphorIcons.X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 text-center">
                    <PhosphorIcons.CommandLine className="h-6 w-6 flex-shrink-0" />
                    <h2 className="font-display text-lg font-bold text-slate-100">
                        {t('commandPalette.title')}
                    </h2>
                </div>
            </div>

            <div className="relative border-b border-slate-700/50 p-3">
                <PhosphorIcons.MagnifyingGlass className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Cmdk.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t('commandPalette.placeholder')}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-slate-800 px-3 py-2 pl-10 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <Cmdk.List className="max-h-[calc(100dvh-13rem)] overflow-y-auto p-2 sm:max-h-[50vh]">
                <Cmdk.Empty className="flex flex-col items-center gap-3 p-10 text-center text-slate-400">
                    <PhosphorIcons.CommandLine className="h-8 w-8 text-slate-500" />
                    <p>{t('commandPalette.noResults')}</p>
                </Cmdk.Empty>

                {groupedCommands.map((group) => (
                    <Cmdk.Group
                        key={group.id}
                        heading={group.title}
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-400"
                    >
                        {group.commands.map((command) => {
                            const CommandIcon = command.icon
                            return (
                                <Cmdk.Item
                                    key={command.id}
                                    value={`${command.title} ${command.group} ${command.keywords || ''} ${command.subtitle || ''}`}
                                    onSelect={() => handleCommandClick(command)}
                                    className="group flex cursor-pointer items-center justify-between gap-4 rounded-md p-3 text-slate-300 data-[selected=true]:bg-slate-700/50 data-[selected=true]:text-primary-300"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="h-5 w-5 flex-shrink-0">
                                            <CommandIcon />
                                        </div>
                                        <div className="truncate">
                                            <p className="truncate font-semibold">
                                                {command.title}
                                            </p>
                                            {command.subtitle && (
                                                <p className="truncate text-xs text-slate-400">
                                                    {command.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {command.shortcut && (
                                        <div className="flex flex-shrink-0 gap-1">
                                            {command.shortcut.map((key) => (
                                                <kbd key={key}>{key}</kbd>
                                            ))}
                                        </div>
                                    )}
                                </Cmdk.Item>
                            )
                        })}
                    </Cmdk.Group>
                ))}
            </Cmdk.List>
        </Cmdk.Dialog>
    )
}
