import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from './Card';
import { Command } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const { t } = useTranslations();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const modalRef = useFocusTrap(isOpen);

    const filteredCommands = useMemo(() => {
        if (!query) return commands;
        const lowercasedQuery = query.toLowerCase();
        return commands.filter(cmd => {
            const searchableText = `${cmd.title} ${cmd.subtitle || ''} ${cmd.keywords || ''}`.toLowerCase();
            return searchableText.includes(lowercasedQuery);
        });
    }, [query, commands]);

    const groupedCommands = useMemo(() => {
        return filteredCommands.reduce((acc, cmd) => {
            const group = cmd.subtitle || t('commandPalette.actions');
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(cmd);
            return acc;
        }, {} as Record<string, Command[]>);
    }, [filteredCommands, t]);
    
    const flatFilteredCommands = useMemo(() => Object.values(groupedCommands).flat(), [groupedCommands]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % flatFilteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + flatFilteredCommands.length) % flatFilteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatFilteredCommands[selectedIndex]) {
                    flatFilteredCommands[selectedIndex].action();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatFilteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        if (scrollRef.current) {
            const selectedItem = scrollRef.current.querySelector(`[data-command-id="${flatFilteredCommands[selectedIndex]?.id}"]`);
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, flatFilteredCommands]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/75 flex items-start justify-center z-50 p-4 pt-[15vh] modal-overlay-animate" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="command-palette-label">
            <Card ref={modalRef} className="w-full max-w-2xl !p-0" onClick={e => e.stopPropagation()}>
                 <h2 id="command-palette-label" className="sr-only">{t('commandPalette.title')}</h2>
                 <div className="flex items-center gap-3 p-3 border-b border-slate-700">
                    <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('commandPalette.placeholder')}
                        className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
                    />
                 </div>
                <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto p-2">
                    {flatFilteredCommands.length > 0 ? (
                        Object.entries(groupedCommands).map(([group, cmds]) => (
                             <div key={group} className="mb-2">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">{group}</h3>
                                <ul role="listbox" aria-label={group}>
                                    {cmds.map(cmd => {
                                        const index = flatFilteredCommands.findIndex(c => c.id === cmd.id);
                                        return (
                                            <li key={cmd.id} role="presentation">
                                                <button
                                                    data-command-id={cmd.id}
                                                    onClick={cmd.action}
                                                    onMouseMove={() => setSelectedIndex(index)}
                                                    className={`w-full flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer text-left ${
                                                        index === selectedIndex ? 'bg-primary-500/20' : 'hover:bg-slate-700/50'
                                                    }`}
                                                    role="option"
                                                    aria-selected={index === selectedIndex}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-6 h-6 text-slate-300 flex-shrink-0">{cmd.icon}</div>
                                                        <p className="font-semibold text-slate-100">{cmd.title}</p>
                                                    </div>
                                                    {cmd.shortcut && (
                                                        <div className="flex items-center gap-1">
                                                            {cmd.shortcut.map((key, i) => <kbd key={`${key}-${i}`}>{key}</kbd>)}
                                                        </div>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                             </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400">{t('commandPalette.noResults')}</div>
                    )}
                </div>
            </Card>
        </div>
    );
};