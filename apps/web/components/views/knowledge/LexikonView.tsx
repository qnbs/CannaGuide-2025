import React, { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { LexiconEntry } from '@/types'
import { lexiconData } from '@/data/lexicon'

type CategoryFilter = 'All' | LexiconEntry['category']

const CATEGORY_COLORS: Record<LexiconEntry['category'], string> = {
    Cannabinoid: 'bg-purple-800 text-purple-200 border-purple-600',
    Terpene: 'bg-green-800 text-green-200 border-green-600',
    Flavonoid: 'bg-yellow-800 text-yellow-200 border-yellow-600',
    General: 'bg-slate-700 text-slate-200 border-slate-500',
    Nutrient: 'bg-blue-800 text-blue-200 border-blue-600',
    Disease: 'bg-red-800 text-red-200 border-red-600',
}

const LexikonViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
    const searchRef = useRef<HTMLInputElement>(null)

    const categories: CategoryFilter[] = [
        'All',
        'Cannabinoid',
        'Terpene',
        'Flavonoid',
        'Nutrient',
        'Disease',
        'General',
    ]

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        return lexiconData.filter((entry) => {
            const term = t(`helpView.lexicon.${entry.category.toLowerCase()}s.${entry.key}.term`, {
                defaultValue: entry.key,
            }).toLowerCase()
            const definition = t(
                `helpView.lexicon.${entry.category.toLowerCase()}s.${entry.key}.definition`,
                { defaultValue: '' },
            ).toLowerCase()
            const matchesQuery = !q || term.includes(q) || definition.includes(q)
            const matchesCategory = activeCategory === 'All' || entry.category === activeCategory
            return matchesQuery && matchesCategory
        })
    }, [query, activeCategory, t])

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        ref={searchRef}
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                        }}
                        placeholder={t('knowledgeView.lexikon.searchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        aria-label={t('knowledgeView.lexikon.searchPlaceholder')}
                    />
                </div>
                <span className="hidden sm:inline text-xs text-slate-400 whitespace-nowrap">
                    {t('knowledgeView.lexikon.resultCount', {
                        count: filtered.length,
                        total: lexiconData.length,
                    })}
                </span>
            </div>

            <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('knowledgeView.lexikon.filterLabel')}
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => {
                            setActiveCategory(cat)
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            activeCategory === cat
                                ? 'bg-primary-600 text-white border-primary-400 scale-105'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-400'
                        }`}
                        aria-pressed={activeCategory === cat}
                    >
                        {cat === 'All'
                            ? t('knowledgeView.lexikon.all')
                            : t(`knowledgeView.lexikon.categories.${cat.toLowerCase()}`)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                    {t('knowledgeView.lexikon.noResults', { term: query })}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((entry) => {
                        const term = t(
                            `helpView.lexicon.${entry.category.toLowerCase()}s.${entry.key}.term`,
                            { defaultValue: entry.key },
                        )
                        const definition = t(
                            `helpView.lexicon.${entry.category.toLowerCase()}s.${entry.key}.definition`,
                            { defaultValue: '' },
                        )
                        const colorCls =
                            CATEGORY_COLORS[entry.category] ??
                            'bg-slate-700 text-slate-200 border-slate-500'
                        return (
                            <article
                                key={entry.key}
                                className="p-4 rounded-lg bg-slate-800/60 border border-white/10 hover:border-primary-500/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-100 text-sm leading-snug">
                                        {term}
                                    </h3>
                                    <span
                                        className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full border ${colorCls}`}
                                    >
                                        {entry.category}
                                    </span>
                                </div>
                                {definition ? (
                                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                                        {definition}
                                    </p>
                                ) : (
                                    <p className="text-slate-500 text-xs italic">
                                        {t('knowledgeView.lexikon.noDefinition')}
                                    </p>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}

            <p className="text-xs text-slate-500 text-center">
                {t('knowledgeView.lexikon.totalCount', { count: lexiconData.length })}
            </p>
        </div>
    )
}

LexikonViewComponent.displayName = 'LexikonView'

export default LexikonViewComponent
