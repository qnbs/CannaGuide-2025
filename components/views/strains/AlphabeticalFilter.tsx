import React, { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface AlphabeticalFilterProps {
    activeLetter: string | null;
    onLetterClick: (letter: string | null) => void;
}

export const AlphabeticalFilter: React.FC<AlphabeticalFilterProps> = memo(({ activeLetter, onLetterClick }) => {
    const { t } = useTranslation();
    const alphabet = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    const groupRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const buttons = Array.from(
                groupRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
            );
            const currentIndex = buttons.indexOf(e.target as HTMLButtonElement);
            if (currentIndex < 0) return;

            let nextIndex = -1;
            if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
            else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            else if (e.key === 'Home') nextIndex = 0;
            else if (e.key === 'End') nextIndex = buttons.length - 1;

            if (nextIndex >= 0) {
                e.preventDefault();
                buttons[nextIndex].focus();
            }
        },
        [],
    );

    return (
        <div
            ref={groupRef}
            className="flex flex-nowrap overflow-x-auto horizontal-scrollbar py-2 -mx-4 px-4 space-x-2 overscroll-behavior-x-contain pb-2"
            role="toolbar"
            aria-label={t('common.accessibility.filterByLetter')}
            onKeyDown={handleKeyDown}
        >
            {alphabet.map(char => (
                <button
                    key={char}
                    onClick={() => onLetterClick(char)}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
                        activeLetter === char
                            ? 'bg-primary-500 text-white shadow-md ring-1 ring-inset ring-white/50'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                    aria-pressed={activeLetter === char}
                    aria-label={char === '#' ? t('common.all') : char}
                >
                    {char}
                </button>
            ))}
        </div>
    );
});
