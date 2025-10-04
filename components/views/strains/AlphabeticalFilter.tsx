import React, { memo } from 'react';

interface AlphabeticalFilterProps {
    activeLetter: string | null;
    onLetterClick: (letter: string | null) => void;
}

export const AlphabeticalFilter: React.FC<AlphabeticalFilterProps> = memo(({ activeLetter, onLetterClick }) => {
    const alphabet = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

    return (
        <div className="hidden sm:flex flex-wrap justify-center gap-1.5 p-2 bg-slate-800/50 rounded-lg">
            {alphabet.map(char => (
                <button
                    key={char}
                    onClick={() => onLetterClick(char)}
                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-colors ${
                        activeLetter === char 
                            ? 'bg-primary-500 text-white' 
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
