import React, { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { lexiconData } from '@/data/lexicon'
import { LexiconCard } from './LexiconCard'
import { SearchBar } from '@/components/common/SearchBar'

export type LexiconCategory =
    | 'All'
    | 'Cannabinoid'
    | 'Terpene'
    | 'Flavonoid'
    | 'Nutrient'
    | 'Disease'
    | 'General'

export const CATEGORY_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
    Cannabinoid: { ring: 'ring-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    Terpene: { ring: 'ring-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    Flavonoid: { ring: 'ring-fuchsia-500/30', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    Nutrient: { ring: 'ring-green-500/30', text: 'text-green-400', bg: 'bg-green-500/10' },
    Disease: { ring: 'ring-red-500/30', text: 'text-red-400', bg: 'bg-red-500/10' },
    General: { ring: 'ring-sky-500/30', text: 'text-sky-400', bg: 'bg-sky-500/10' },
}

export const LexiconSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState<LexiconCategory>('All')

    const getCategoryKey = (
        category: 'Cannabinoid' | 'Terpene' | 'Flavonoid' | 'Nutrient' | 'Disease' | 'General',
    ) => {
        if (category === 'General') return 'general'
        return `${category.toLowerCase()}s`
    }

    const augmentedLexicon = useMemo(
        () =>
            lexiconData
                .map((item) => {
                    const categoryKey = getCategoryKey(item.category)
                    const term = t(`helpView.lexicon.${categoryKey}.${item.key}.term`)
                    const definition = t(`helpView.lexicon.${categoryKey}.${item.key}.definition`)
                    return { ...item, term, definition }
                })
                .toSorted((a, b) => a.term.localeCompare(b.term)),
        [t],
    )

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { All: augmentedLexicon.length }
        for (const item of augmentedLexicon) {
            counts[item.category] = (counts[item.category] ?? 0) + 1
        }
        return counts
    }, [augmentedLexicon])

    const filteredLexicon = useMemo(() => {
        let items = augmentedLexicon
        if (activeCategory !== 'All') {
            items = items.filter((item) => item.category === activeCategory)
        }
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase()
            items = items.filter(
                (item) =>
                    item.term.toLowerCase().includes(lowerCaseSearch) ||
                    item.definition.toLowerCase().includes(lowerCaseSearch),
            )
        }
        return items
    }, [searchTerm, augmentedLexicon, activeCategory])

    // Alphabet quick-jump letters
    const availableLetters = useMemo(() => {
        const letters = new Set<string>()
        for (const item of filteredLexicon) {
            const first = item.term.charAt(0).toUpperCase()
            letters.add(first)
        }
        return Array.from(letters).toSorted((a, b) => a.localeCompare(b))
    }, [filteredLexicon])

    const scrollToLetter = useCallback((letter: string) => {
        const el = document.getElementById(`lexicon-letter-${letter}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    // Group filtered items by first letter
    const groupedByLetter = useMemo(() => {
        const groups: Record<string, typeof filteredLexicon> = {}
        for (const item of filteredLexicon) {
            const letter = item.term.charAt(0).toUpperCase()
            if (!groups[letter]) groups[letter] = []
            groups[letter].push(item)
        }
        return groups
    }, [filteredLexicon])

    const categories: LexiconCategory[] = [
        'All',
        'Cannabinoid',
        'Terpene',
        'Flavonoid',
        'Nutrient',
        'Disease',
        'General',
    ]

    const categoryIcons: Record<LexiconCategory, React.ReactNode> = {
        All: <PhosphorIcons.GridFour className="w-3.5 h-3.5" />,
        Cannabinoid: <PhosphorIcons.Flask className="w-3.5 h-3.5" />,
        Terpene: <PhosphorIcons.Drop className="w-3.5 h-3.5" />,
        Flavonoid: <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />,
        Nutrient: <PhosphorIcons.Drop className="w-3.5 h-3.5" />,
        Disease: <PhosphorIcons.FirstAidKit className="w-3.5 h-3.5" />,
        General: <PhosphorIcons.BookOpenText className="w-3.5 h-3.5" />,
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <h3 className="text-xl font-bold font-display text-primary-400">
                    {t('helpView.lexicon.title')}
                </h3>
                <span className="text-xs tabular-nums text-slate-500">
                    {t('helpView.lexicon.resultCount', {
                        count: filteredLexicon.length,
                        total: augmentedLexicon.length,
                    })}
                </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.lexicon.subtitle')}</p>

            {/* Category filter with counts */}
            <div
                className="flex flex-wrap gap-2 mb-4"
                role="tablist"
                aria-label={t('common.accessibility.lexiconCategories')}
            >
                {categories.map((cat) => {
                    const count = categoryCounts[cat] ?? 0
                    const isActive = activeCategory === cat
                    const colors = cat !== 'All' ? CATEGORY_COLORS[cat] : undefined
                    const categoryButtonClass = isActive
                        ? `bg-primary-600 text-white shadow-lg ring-1 ring-primary-400 ${colors?.bg ?? ''}`
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-inset ring-slate-700/50'
                    const countPillClass = isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-700 text-slate-400'

                    return (
                        <button
                            key={cat}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveCategory(cat)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${categoryButtonClass}`}
                        >
                            {categoryIcons[cat]}
                            {t(`helpView.lexicon.categories.${cat.toLowerCase()}`)}
                            <span
                                className={`text-xs tabular-nums rounded-full px-1.5 py-px ${countPillClass}`}
                            >
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="mb-4">
                <SearchBar
                    placeholder={t('helpView.lexicon.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                />
            </div>

            {/* Alphabet quick-jump */}
            {availableLetters.length > 1 && (
                <nav
                    className="flex flex-wrap gap-1 mb-4"
                    aria-label={t('common.accessibility.alphabetNavigation')}
                >
                    {availableLetters.map((letter) => (
                        <button
                            key={letter}
                            type="button"
                            onClick={() => scrollToLetter(letter)}
                            className="w-7 h-7 rounded text-xs font-bold text-slate-400 bg-slate-800/60 hover:bg-primary-600 hover:text-white transition-colors duration-150 flex items-center justify-center"
                        >
                            {letter}
                        </button>
                    ))}
                </nav>
            )}

            {/* Grouped results by letter */}
            {filteredLexicon.length > 0 ? (
                <div className="space-y-6">
                    {Object.keys(groupedByLetter)
                        .toSorted((a, b) => a.localeCompare(b))
                        .map((letter) => (
                            <section key={letter}>
                                <div
                                    id={`lexicon-letter-${letter}`}
                                    className="flex items-center gap-3 mb-3 scroll-mt-4"
                                >
                                    <span className="text-lg font-bold text-primary-400/70 w-7 text-center">
                                        {letter}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-700/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(groupedByLetter[letter] ?? []).map((item) => (
                                        <LexiconCard
                                            key={item.key}
                                            entry={{ key: item.key, category: item.category }}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500 space-y-2 md:col-span-2 lg:col-span-3">
                    <PhosphorIcons.MagnifyingGlass className="w-10 h-10 mx-auto text-slate-600" />
                    <p>{t('helpView.lexicon.noResults', { term: searchTerm })}</p>
                </div>
            )}
        </Card>
    )
})
LexiconSection.displayName = 'LexiconSection'
