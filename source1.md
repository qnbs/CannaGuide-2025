# Cannabis Grow Guide 2025 - Source Code: Components

This document contains the source code for all React components used in the application, organized by their function and location within the `components/` directory.

---

## 1. Common Components (`components/common/`)

Reusable components used across multiple views.

### `Button.tsx`
```typescript
import React from 'react';

type ButtonOwnProps<E extends React.ElementType> = {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'base' | 'lg';
    as?: E;
    className?: string;
}

type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> & Omit<React.ComponentProps<E>, keyof ButtonOwnProps<E>>;

const defaultElement = 'button';

export const Button = <E extends React.ElementType = typeof defaultElement>({
    children,
    className,
    variant = 'primary',
    size = 'base',
    as,
    ...props
}: ButtonProps<E>) => {
    const Component = as || defaultElement;

    const baseClasses = "rounded-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50";

    const variantClasses = {
        primary: "bg-primary-500 hover:bg-primary-400 focus-visible:ring-primary-400 text-on-accent font-bold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30",
        secondary: "bg-slate-700 hover:bg-slate-600 focus-visible:ring-primary-500 text-slate-100 border border-slate-600",
        danger: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white",
    };
    
    const sizeClasses = {
        sm: "px-2 py-1 text-sm",
        base: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <Component className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
            {children}
        </Component>
    );
};
```

### `Card.tsx`
```typescript
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-pane rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
```

### `CommandPalette.tsx`
```typescript
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
```

... (and so on for all other components)

---

## 2. Views (`components/views/`)

These are the main screen components of the application.

### `StrainsView.tsx`
```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { Strain, Plant, PlantStage, View, GrowSetup, ExportSource, ExportFormat } from '../../types';
// ... other imports
import { strainService } from '../../services/strainService';
import { LIST_GRID_CLASS } from '../../constants';

// ... Full component code for StrainsView, StrainDetailModal, AdvancedFilterModal
```

### `PlantsView.tsx`
```typescript
import React, { useState } from 'react';
import { Plant, View, JournalEntry, ArchivedAdvisorResponse, AIResponse } from '../../types';
// ... other imports

// ... Full component code for PlantsView and EmptyPlantSlot
```

... (and so on for all other view components)
