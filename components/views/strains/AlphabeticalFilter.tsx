import React, { memo } from 'react';

interface AlphabeticalFilterProps {
    activeLetter: string | null;
    onLetterClick: (letter: string | null) => void;
}

export const AlphabeticalFilter: React.FC<AlphabeticalFilterProps> = memo(({ activeLetter, onLetterClick }) => {
    const alphabet = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

    return (
        <div className="flex flex-nowrap overflow-x-auto horizontal-scrollbar py-2 -mx-4 px-4 space-x-2 overscroll-behavior-x-contain pb-2">
            {alphabet.map(char => (
                <button
                    key={char}
                    onClick={() => onLetterClick(char)}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        activeLetter === char 
                            ? 'bg-primary-500 text-white shadow-md' 
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                    aria-pressed={activeLetter === char}
                >
                    {char}
                </button>
            ))}
        </div>
    );
});