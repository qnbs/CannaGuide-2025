import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './Card';
import { Command } from '../../types';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useTranslations } from '../../hooks/useTranslations';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const { t } = useTranslations();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLUListElement>(null);

    const filteredCommands = useMemo(() => {
        if (!search) return commands;
        const lowercasedSearch = search.toLowerCase();
        return commands.filter(cmd => 
            cmd.title.toLowerCase().includes(lowercasedSearch) ||
            cmd.subtitle?.toLowerCase().includes(lowercasedSearch) ||
            cmd.keywords?.toLowerCase().includes(lowercasedSearch)
        );
    }, [search, commands]);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        const item = scrollRef.current?.children[selectedIndex] as HTMLLIElement;
        if (item) {
            item.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-start justify-center z-50 p-4 pt-[15vh]" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="command-palette-label">
            <Card className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="relative">
                     <label htmlFor="command-search" id="command-palette-label" className="sr-only">{t('commandPalette.placeholder')}</label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-accent-400" />
                    </div>
                    <input
                        id="command-search"
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('commandPalette.placeholder')}
                        className="w-full bg-accent-900/50 border border-accent-700 rounded-lg pl-10 pr-4 py-2 text-accent-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoComplete="off"
                    />
                </div>
                <ul ref={scrollRef} className="mt-4 max-h-[50vh] overflow-y-auto" role="listbox">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                            <li
                                key={cmd.id}
                                id={`command-item-${index}`}
                                onClick={cmd.action}
                                onMouseMove={() => setSelectedIndex(index)}
                                className={`flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer ${
                                    index === selectedIndex ? 'bg-primary-500/20' : 'hover:bg-accent-800/50'
                                }`}
                                role="option"
                                aria-selected={index === selectedIndex}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-6 h-6 text-accent-300 flex-shrink-0">{cmd.icon}</div>
                                    <div>
                                        <p className="font-semibold text-accent-100">{cmd.title}</p>
                                        {cmd.subtitle && <p className="text-xs text-accent-400">{cmd.subtitle}</p>}
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="p-4 text-center text-accent-300">{t('commandPalette.noResults')}</li>
                    )}
                </ul>
            </Card>
        </div>
    );
};