import React, { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { AIResponse, GeneticTrendCategory } from '@/types'
import { useAppSelector } from '@/stores/store'
import { selectSelectedPlantId, selectPlantById } from '@/stores/selectors'
import {
    calculateGeneticTrendMatchScore,
    getRelatedGrowTechForGenetic,
} from '@/services/trendsEcosystemService'
import { aiService } from '@/services/aiFacade'
import { selectLanguage } from '@/stores/selectors'

const CATEGORIES: Array<{
    id: GeneticTrendCategory
    iconKey: keyof typeof categoryIcons
    color: string
}> = [
    { id: 'terpeneDiversity', iconKey: 'terpeneDiversity', color: 'text-pink-400' },
    { id: 'ultraPotency', iconKey: 'ultraPotency', color: 'text-red-400' },
    { id: 'balancedHybrids', iconKey: 'balancedHybrids', color: 'text-blue-400' },
    { id: 'autofloweringRevolution', iconKey: 'autofloweringRevolution', color: 'text-amber-400' },
    { id: 'advancedBreeding', iconKey: 'advancedBreeding', color: 'text-purple-400' },
    { id: 'landraceRevival', iconKey: 'landraceRevival', color: 'text-green-400' },
]

const categoryIcons = {
    terpeneDiversity: PhosphorIcons.Drop,
    ultraPotency: PhosphorIcons.Lightning,
    balancedHybrids: PhosphorIcons.Checks,
    autofloweringRevolution: PhosphorIcons.SkipForward,
    advancedBreeding: PhosphorIcons.TestTube,
    landraceRevival: PhosphorIcons.Leafy,
}

export const GeneticTrendsView: React.FC = React.memo(() => {
    const { t } = useTranslation()
    const [expandedCategory, setExpandedCategory] = useState<GeneticTrendCategory | null>(null)
    const [filterQuery, setFilterQuery] = useState('')
    const [aiResult, setAiResult] = useState<AIResponse | null>(null)
    const [aiCategory, setAiCategory] = useState<GeneticTrendCategory | null>(null)
    const [isAiLoading, setIsAiLoading] = useState(false)

    const selectedId = useAppSelector(selectSelectedPlantId)
    const activePlant = useAppSelector(selectPlantById(selectedId))
    const lang = useAppSelector(selectLanguage)

    const toggleCategory = (id: GeneticTrendCategory): void => {
        setExpandedCategory((prev) => (prev === id ? null : id))
        setAiResult(null)
        setAiCategory(null)
    }

    const handleAiAnalyze = useCallback(
        async (category: GeneticTrendCategory): Promise<void> => {
            setAiCategory(category)
            setIsAiLoading(true)
            setAiResult(null)
            try {
                const result = await aiService.getGeneticTrendAnalysis(category, lang)
                setAiResult(result)
            } finally {
                setIsAiLoading(false)
            }
        },
        [lang],
    )

    const categories = useMemo(
        () =>
            CATEGORIES.map((cat) => ({
                ...cat,
                title: t(`strainsView.geneticTrends.categories.${cat.id}.title`),
                tagline: t(`strainsView.geneticTrends.categories.${cat.id}.tagline`),
                content: t(`strainsView.geneticTrends.categories.${cat.id}.content`),
                examples: t(`strainsView.geneticTrends.categories.${cat.id}.examples`),
                relevance: t(`strainsView.geneticTrends.categories.${cat.id}.relevance`),
            })),
        [t],
    )

    const filteredCategories = useMemo(() => {
        const q = filterQuery.trim().toLowerCase()
        if (!q) return categories
        return categories.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.tagline.toLowerCase().includes(q) ||
                c.examples.toLowerCase().includes(q),
        )
    }, [categories, filterQuery])

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="section-hero animate-fade-in">
                <div className="relative z-10 text-center">
                    <div className="surface-badge mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary-200">
                        <PhosphorIcons.Sparkle className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('strainsView.geneticTrends.badge2026')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-100">
                        {t('strainsView.geneticTrends.title')}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
                        {t('strainsView.geneticTrends.subtitle')}
                    </p>
                </div>
            </div>

            {/* Intro */}
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                {t('strainsView.geneticTrends.intro')}
            </div>

            {/* Search filter */}
            <div className="relative">
                <PhosphorIcons.MagnifyingGlass
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    aria-hidden="true"
                />
                <input
                    type="search"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder={t('strainsView.geneticTrends.searchPlaceholder')}
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    aria-label={t('strainsView.geneticTrends.searchPlaceholder')}
                />
                {filterQuery && (
                    <button
                        type="button"
                        onClick={() => setFilterQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        aria-label={t('common.clearSearch')}
                    >
                        <PhosphorIcons.X className="w-4 h-4" aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Match-to-My-Grow info when no plant selected */}
            {!activePlant && (
                <p className="text-xs text-slate-500 text-center">
                    {t('strainsView.geneticTrends.noPlantSelected')}
                </p>
            )}

            {/* Category Accordions */}
            <div
                className="space-y-3"
                role="list"
                aria-label={t('strainsView.geneticTrends.title')}
            >
                {filteredCategories.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                        {t('strainsView.geneticTrends.noMatchResults')}
                    </p>
                )}
                {filteredCategories.map((cat) => {
                    const Icon = categoryIcons[cat.iconKey]
                    const isExpanded = expandedCategory === cat.id
                    const panelId = `genetic-trend-panel-${cat.id}`
                    const triggerId = `genetic-trend-trigger-${cat.id}`
                    return (
                        <div
                            key={cat.id}
                            role="listitem"
                            className="bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200"
                        >
                            <button
                                id={triggerId}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                aria-expanded={isExpanded}
                                aria-controls={panelId}
                                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer select-none hover:bg-slate-700/20 transition-colors"
                            >
                                <Icon
                                    className={`w-6 h-6 flex-shrink-0 ${cat.color}`}
                                    aria-hidden="true"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-slate-100">
                                        {cat.title}
                                    </span>
                                    <span className="block text-xs text-slate-400 truncate">
                                        {cat.tagline}
                                    </span>
                                </div>
                                {activePlant &&
                                    (() => {
                                        const match = calculateGeneticTrendMatchScore(
                                            cat.id,
                                            activePlant,
                                        )
                                        const matchColor =
                                            match.score >= 80
                                                ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                                : match.score >= 60
                                                  ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                                                  : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                                        return (
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded border font-mono shrink-0 ${matchColor}`}
                                                title={`${t('strainsView.geneticTrends.matchScore')}: ${match.score}% -- ${match.reason}`}
                                            >
                                                {match.score}%
                                            </span>
                                        )
                                    })()}
                                <PhosphorIcons.ChevronDown
                                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                />
                            </button>
                            {isExpanded && (
                                <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={triggerId}
                                    className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3 animate-fade-in"
                                >
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                        {cat.content}
                                    </p>
                                    <div className="p-3 rounded-md bg-slate-900/60 border border-slate-700">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                            {t('strainsView.geneticTrends.examplesLabel')}
                                        </h4>
                                        <p className="text-sm text-slate-300">{cat.examples}</p>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded bg-primary-900/30 border border-primary-800/50">
                                        <PhosphorIcons.ChartLineUp
                                            className="w-4 h-4 text-primary-400 flex-shrink-0"
                                            aria-hidden="true"
                                        />
                                        <span className="text-xs text-primary-300">
                                            {t('strainsView.geneticTrends.relevanceLabel')}:{' '}
                                            {cat.relevance}
                                        </span>
                                    </div>
                                    {/* Related Grow Tech tags */}
                                    {getRelatedGrowTechForGenetic(cat.id).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {getRelatedGrowTechForGenetic(cat.id).map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-700/40 text-blue-300"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* AI Analysis button + result */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => void handleAiAnalyze(cat.id)}
                                            disabled={isAiLoading && aiCategory === cat.id}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <PhosphorIcons.Sparkle
                                                className="w-3.5 h-3.5"
                                                aria-hidden="true"
                                            />
                                            {isAiLoading && aiCategory === cat.id
                                                ? t('strainsView.geneticTrends.aiAnalyzing')
                                                : t('strainsView.geneticTrends.aiAnalyze')}
                                        </button>
                                        {aiResult !== null && aiCategory === cat.id && (
                                            <div className="mt-2 p-3 rounded-lg bg-purple-950/30 border border-purple-800/30 text-xs text-purple-200 leading-relaxed">
                                                <span className="font-semibold block mb-1">
                                                    {t('strainsView.geneticTrends.aiInsightLabel')}
                                                </span>
                                                {aiResult.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Trend Overview Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-800/60">
                <table
                    className="w-full text-sm text-left"
                    aria-label={t('strainsView.geneticTrends.table.trend')}
                >
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th scope="col" className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.trend')}
                            </th>
                            <th scope="col" className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.description')}
                            </th>
                            <th scope="col" className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.examples')}
                            </th>
                            <th scope="col" className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.relevance')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredCategories.map((cat) => (
                            <tr key={cat.id} className="bg-slate-800/30">
                                <td className="p-3 font-medium text-slate-200">{cat.title}</td>
                                <td className="p-3 text-slate-400">{cat.tagline}</td>
                                <td className="p-3 text-slate-400">{cat.examples}</td>
                                <td className="p-3 text-slate-400">{cat.relevance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Implications */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary-900/20 to-purple-900/20 border border-primary-800/30">
                <h3 className="text-sm font-bold text-primary-300 mb-2">
                    {t('strainsView.geneticTrends.implications.title')}
                </h3>
                <ul className="space-y-1 text-sm text-slate-300 list-disc list-inside">
                    <li>{t('strainsView.geneticTrends.implications.homeGrow')}</li>
                    <li>{t('strainsView.geneticTrends.implications.quality')}</li>
                    <li>{t('strainsView.geneticTrends.implications.cannaGuide')}</li>
                </ul>
            </div>

            {/* Conclusion */}
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                <PhosphorIcons.Sparkle
                    className="w-5 h-5 text-purple-400 inline mr-2"
                    aria-hidden="true"
                />
                {t('strainsView.geneticTrends.conclusion')}
            </div>
        </div>
    )
})

GeneticTrendsView.displayName = 'GeneticTrendsView'
