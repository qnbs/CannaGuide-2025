import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { GeneticTrendCategory } from '@/types'

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

export const GeneticTrendsView: React.FC = () => {
    const { t } = useTranslation()

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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="section-hero animate-fade-in">
                <div className="relative z-10 text-center">
                    <div className="surface-badge mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary-200">
                        <PhosphorIcons.Sparkle className="h-3.5 w-3.5" />
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

            {/* Category Accordions */}
            <div className="space-y-3">
                {categories.map((cat) => {
                    const Icon = categoryIcons[cat.iconKey]
                    return (
                        <details
                            key={cat.id}
                            className="group bg-slate-800 rounded-lg overflow-hidden ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200"
                        >
                            <summary className="list-none flex items-center w-full gap-3 p-4 cursor-pointer select-none">
                                <Icon className={`w-6 h-6 flex-shrink-0 ${cat.color}`} />
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-slate-100">
                                        {cat.title}
                                    </span>
                                    <span className="block text-xs text-slate-400 truncate">
                                        {cat.tagline}
                                    </span>
                                </div>
                                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                            </summary>
                            <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3 animate-fade-in">
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
                                    <PhosphorIcons.ChartLineUp className="w-4 h-4 text-primary-400 flex-shrink-0" />
                                    <span className="text-xs text-primary-300">
                                        {t('strainsView.geneticTrends.relevanceLabel')}:{' '}
                                        {cat.relevance}
                                    </span>
                                </div>
                            </div>
                        </details>
                    )
                })}
            </div>

            {/* Trend Overview Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-800/60">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.trend')}
                            </th>
                            <th className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.description')}
                            </th>
                            <th className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.examples')}
                            </th>
                            <th className="p-3 font-semibold">
                                {t('strainsView.geneticTrends.table.relevance')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {categories.map((cat) => (
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
                <PhosphorIcons.Sparkle className="w-5 h-5 text-purple-400 inline mr-2" />
                {t('strainsView.geneticTrends.conclusion')}
            </div>
        </div>
    )
}

GeneticTrendsView.displayName = 'GeneticTrendsView'
