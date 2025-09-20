import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Command } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
    const { t } = useTranslations();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLUListElement>(null);
    const modalRef = useFocusTrap(isOpen);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % commands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (commands[selectedIndex]) {
                    commands[selectedIndex].action();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, commands, selectedIndex, onClose]);

    useEffect(() => {
        const item = scrollRef.current?.querySelector(`#command-item-${selectedIndex}`);
        if (item) {
            item.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/75 flex items-start justify-center z-50 p-4 pt-[15vh] modal-overlay-animate" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="command-palette-label">
            <Card ref={modalRef} className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                 <h2 id="command-palette-label" className="sr-only">{t('commandPalette.title')}</h2>
                <ul ref={scrollRef} className="max-h-[65vh] overflow-y-auto" role="listbox" aria-labelledby="command-palette-label">
                    {commands.length > 0 ? (
                        commands.map((cmd, index) => (
                             <li key={cmd.id} role="presentation">
                                <button
                                    id={`command-item-${index}`}
                                    onClick={cmd.action}
                                    onMouseMove={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer text-left ${
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
                                </button>
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