import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

/** Simple deterministic hash from string */
export const strHash = (s: string): number => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

export const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
        {children}
    </span>
)

export const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({
    difficulty,
}) => {
    const { t } = useTranslation()
    const safeDifficulty =
        difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard'
            ? difficulty
            : 'Medium'
    const difficultyLabels: Record<'Easy' | 'Medium' | 'Hard', string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    }
    const difficultyMap = {
        Easy: { level: 1, color: 'text-success' },
        Medium: { level: 2, color: 'text-warning' },
        Hard: { level: 3, color: 'text-danger' },
    }
    const { level, color } = difficultyMap[safeDifficulty] ?? difficultyMap.Medium

    return (
        <div className="flex items-center gap-2 justify-end" title={difficultyLabels[safeDifficulty]}>
            <span>{difficultyLabels[safeDifficulty]}</span>
            <div className="flex">
                {[1, 2, 3].map((marker) => (
                    <PhosphorIcons.Cannabis
                        key={`difficulty-marker-${marker}`}
                        className={`w-5 h-5 ${marker <= level ? color : 'text-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    )
}
