import React, { memo } from 'react'
import { Card } from '@/components/common/Card'
import { LexiconEntry } from '@/types'
import { useTranslation } from 'react-i18next'
import { Speakable } from '@/components/common/Speakable'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const CATEGORY_STYLE: Record<string, { pill: string; border: string; icon: React.ReactNode }> = {
    Cannabinoid: {
        pill: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        border: 'hover:ring-emerald-500/30',
        icon: <PhosphorIcons.Flask className="w-3 h-3" />,
    },
    Terpene: {
        pill: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        border: 'hover:ring-amber-500/30',
        icon: <PhosphorIcons.Drop className="w-3 h-3" />,
    },
    Flavonoid: {
        pill: 'bg-fuchsia-500/10 text-fuchsia-400 ring-fuchsia-500/20',
        border: 'hover:ring-fuchsia-500/30',
        icon: <PhosphorIcons.Sparkle className="w-3 h-3" />,
    },
    General: {
        pill: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
        border: 'hover:ring-sky-500/30',
        icon: <PhosphorIcons.BookOpenText className="w-3 h-3" />,
    },
}

const getCategoryKey = (category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'General') => {
    const lower = category.toLowerCase()
    return lower === 'general' ? 'general' : `${lower}s`
}

export const LexiconCard: React.FC<{ entry: LexiconEntry }> = memo(({ entry }) => {
    const { t } = useTranslation()

    const categoryKey = getCategoryKey(entry.category)
    const term = t(`helpView.lexicon.${categoryKey}.${entry.key}.term`)
    const definition = t(`helpView.lexicon.${categoryKey}.${entry.key}.definition`)
    const details = t(`helpView.lexicon.${categoryKey}.${entry.key}.details`, {
        returnObjects: true,
    })
    const detailsObject =
        typeof details === 'object' && details !== null && !Array.isArray(details)
            ? details
            : undefined

    const style = CATEGORY_STYLE[entry.category] ??
        CATEGORY_STYLE.General ?? { border: '', pill: '', icon: null }

    return (
        <Card
            className={`bg-slate-800/50 ring-1 ring-inset ring-slate-700/50 ${style?.border ?? ''} transition-all duration-200 flex flex-col`}
        >
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-base font-bold text-primary-300 leading-snug">{term}</h3>
            </div>
            <span
                className={`inline-flex items-center gap-1 self-start text-[10px] uppercase font-semibold tracking-wider rounded-full px-2 py-0.5 ring-1 ring-inset mb-2.5 ${style?.pill ?? ''}`}
            >
                {style?.icon}
                {entry.category}
            </span>
            <Speakable elementId={`lexicon-${entry.key}`}>
                <p className="text-sm text-slate-300 leading-relaxed flex-grow">{definition}</p>
            </Speakable>
            {detailsObject && (
                <details className="mt-3 pt-3 border-t border-slate-700/50 group">
                    <summary className="list-none cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-300 flex items-center gap-1 select-none">
                        <PhosphorIcons.ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-180" />
                        Details
                    </summary>
                    <div className="mt-2 text-xs text-slate-400 space-y-1 animate-fade-in">
                        {Object.entries(detailsObject).map(([key, value]) => (
                            <p key={key}>
                                <strong className="text-slate-300">
                                    {key
                                        .replaceAll(/([A-Z])/g, ' $1')
                                        .replace(/^./, (str) => str.toUpperCase())}
                                    :
                                </strong>{' '}
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                            </p>
                        ))}
                    </div>
                </details>
            )}
        </Card>
    )
})
LexiconCard.displayName = 'LexiconCard'
