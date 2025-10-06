import React, { useMemo, useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Command } from '@/types'
import { useTranslation } from 'react-i18next'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { groupAndSortCommands } from '@/services/commandService'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { Input } from '@/components/ui/ThemePrimitives'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation()
    const modalRef = useFocusTrap(isOpen)
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const { allCommands } = useCommandPalette()

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
            setQuery('')
        }
    }, [isOpen])

    const displayedCommands = useMemo(() => {
        if (!query.trim()) return groupAndSortCommands(allCommands)

        const lowerCaseQuery = query.toLowerCase()
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
    }, [query, allCommands])

    const handleCommandClick = (command: Command) => {
        if (!command.isHeader) {
            command.action()
            onClose()
        }
    }

    if (!isOpen) return null

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-start justify-center p-4 pt-[15vh]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={t('commandPalette.title')}
        >
            <div
                ref={modalRef as React.RefObject<HTMLDivElement>}
                className="w-full max-w-xl glass-pane !p-0 rounded-lg shadow-2xl modal-content-animate"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
                    <PhosphorIcons.CommandLine className="w-6 h-6 flex-shrink-0" />
                    <h2 className="text-lg font-bold font-display text-slate-100">
                        {t('commandPalette.title')}
                    </h2>
                </div>
                <div className="p-3 border-b border-slate-700/50 relative">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('commandPalette.placeholder')}
                        className="w-full pl-10 input-base"
                    />
                </div>
                {displayedCommands.length > 0 ? (
                    <ul
                        id="command-results-list"
                        role="listbox"
                        className="max-h-[50vh] overflow-y-auto p-2"
                    >
                        {displayedCommands.map((command) => {
                            if (command.isHeader) {
                                return (
                                    <li
                                        key={command.id}
                                        role="presentation"
                                        className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none"
                                    >
                                        {command.title}
                                    </li>
                                )
                            }

                            const CommandIcon = command.icon
                            return (
                                <li
                                    key={command.id}
                                    role="option"
                                    onClick={() => handleCommandClick(command)}
                                    className="flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer transition-colors duration-100 text-slate-300 hover:bg-slate-700/50 hover:text-primary-300"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-5 h-5 flex-shrink-0">
                                            <CommandIcon />
                                        </div>
                                        <div className="truncate">
                                            <p className="font-semibold truncate">{command.title}</p>
                                            {command.subtitle && (
                                                <p className="text-xs text-slate-400 truncate">
                                                    {command.subtitle}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {command.shortcut && (
                                        <div className="flex gap-1 flex-shrink-0">
                                            {command.shortcut.map((key) => (
                                                <kbd key={key}>{key}</kbd>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-3">
                        <PhosphorIcons.CommandLine className="w-8 h-8 text-slate-500" />
                        <p>{t('commandPalette.noResults')}</p>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}