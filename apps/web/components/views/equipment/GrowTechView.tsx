import React, { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { AIResponse, GrowTechCategory } from '@/types'
import { useAppSelector } from '@/stores/store'
import { selectSettings, selectLanguage } from '@/stores/selectors'
import {
    calculateGrowTechMatchScore,
    getRelatedGeneticForGrowTech,
} from '@/services/trendsEcosystemService'
import { aiService } from '@/services/aiFacade'

const CATEGORIES: Array<{
    id: GrowTechCategory
    iconKey: keyof typeof categoryIcons
    color: string
}> = [
    { id: 'dynamicLighting', iconKey: 'dynamicLighting', color: 'text-yellow-400' },
    { id: 'sensorsIoT', iconKey: 'sensorsIoT', color: 'text-cyan-400' },
    { id: 'aiAutomation', iconKey: 'aiAutomation', color: 'text-purple-400' },
    { id: 'digitalTwin', iconKey: 'digitalTwin', color: 'text-blue-400' },
    { id: 'hydroAero', iconKey: 'hydroAero', color: 'text-emerald-400' },
    { id: 'tissueCulture', iconKey: 'tissueCulture', color: 'text-green-400' },
    { id: 'smartGrowBoxes', iconKey: 'smartGrowBoxes', color: 'text-orange-400' },
    { id: 'sustainability', iconKey: 'sustainability', color: 'text-lime-400' },
]

const categoryIcons = {
    dynamicLighting: PhosphorIcons.LightbulbFilament,
    sensorsIoT: PhosphorIcons.WifiHigh,
    aiAutomation: PhosphorIcons.Brain,
    digitalTwin: PhosphorIcons.Cube,
    hydroAero: PhosphorIcons.Drop,
    tissueCulture: PhosphorIcons.TestTube,
    smartGrowBoxes: PhosphorIcons.GameController,
    sustainability: PhosphorIcons.Leafy,
}

export const GrowTechView: React.FC = React.memo(() => {
    const { t } = useTranslation()
    const [expandedCategory, setExpandedCategory] = useState<GrowTechCategory | null>(null)
    const [filterQuery, setFilterQuery] = useState('')
    const [aiResult, setAiResult] = useState<AIResponse | null>(null)
    const [aiLoading, setAiLoading] = useState(false)

    const settings = useAppSelector(selectSettings)
    const growSetup = settings.defaults.growSetup
    const lang = useAppSelector(selectLanguage)

    const toggleCategory = (id: GrowTechCategory) => {
        setExpandedCategory((prev) => (prev === id ? null : id))
        setAiResult(null)
    }

    const handleAiAnalyze = useCallback(async (): Promise<void> => {
        setAiLoading(true)
        setAiResult(null)
        try {
            const result = await aiService.getGrowTechRecommendation(growSetup, lang)
            setAiResult(result)
        } finally {
            setAiLoading(false)
        }
    }, [growSetup, lang])

    const impactData = useMemo(
        () => [
            {
                area: t('knowledgeView.growTech.impact.areas.ledSensors'),
                homeAdvantage: t('knowledgeView.growTech.impact.home.ledSensors'),
                commercialAdvantage: t('knowledgeView.growTech.impact.commercial.ledSensors'),
                effort: t('knowledgeView.growTech.impact.effort.medium'),
            },
            {
                area: t('knowledgeView.growTech.impact.areas.aiAutomation'),
                homeAdvantage: t('knowledgeView.growTech.impact.home.aiAutomation'),
                commercialAdvantage: t('knowledgeView.growTech.impact.commercial.aiAutomation'),
                effort: t('knowledgeView.growTech.impact.effort.highInitial'),
            },
            {
                area: t('knowledgeView.growTech.impact.areas.aeroponics'),
                homeAdvantage: t('knowledgeView.growTech.impact.home.aeroponics'),
                commercialAdvantage: t('knowledgeView.growTech.impact.commercial.aeroponics'),
                effort: t('knowledgeView.growTech.impact.effort.mediumHigh'),
            },
            {
                area: t('knowledgeView.growTech.impact.areas.digitalTwin'),
                homeAdvantage: t('knowledgeView.growTech.impact.home.digitalTwin'),
                commercialAdvantage: t('knowledgeView.growTech.impact.commercial.digitalTwin'),
                effort: t('knowledgeView.growTech.impact.effort.high'),
            },
        ],
        [t],
    )

    const filteredCategories = useMemo(() => {
        const q = filterQuery.trim().toLowerCase()
        if (!q) return CATEGORIES
        return CATEGORIES.filter(
            (c) =>
                t(`knowledgeView.growTech.categories.${c.id}.title`).toLowerCase().includes(q) ||
                t(`knowledgeView.growTech.categories.${c.id}.tagline`).toLowerCase().includes(q),
        )
    }, [filterQuery, t])

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="section-hero animate-fade-in">
                <div className="relative z-10 text-center">
                    <div className="surface-badge mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-primary-200">
                        <PhosphorIcons.Sparkle className="h-3.5 w-3.5" />
                        {t('knowledgeView.growTech.badge2026')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-100">
                        {t('knowledgeView.growTech.title')}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
                        {t('knowledgeView.growTech.subtitle')}
                    </p>
                </div>
            </div>

            {/* Introduction */}
            <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                {t('knowledgeView.growTech.intro')}
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
                    placeholder={t('knowledgeView.growTech.searchPlaceholder')}
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    aria-label={t('knowledgeView.growTech.searchPlaceholder')}
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

            {/* AI Setup Recommendation button */}
            <div>
                <button
                    type="button"
                    onClick={() => void handleAiAnalyze()}
                    disabled={aiLoading}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <PhosphorIcons.Sparkle className="w-4 h-4" aria-hidden="true" />
                    {aiLoading
                        ? t('knowledgeView.growTech.aiAnalyzing')
                        : t('knowledgeView.growTech.aiAnalyze')}
                </button>
                {aiResult !== null && (
                    <div className="mt-2 p-3 rounded-lg bg-purple-950/30 border border-purple-800/30 text-sm text-purple-200 leading-relaxed">
                        <span className="font-semibold block mb-1">
                            {t('knowledgeView.growTech.aiInsightLabel')}
                        </span>
                        {aiResult.content}
                    </div>
                )}
            </div>

            {/* Technology Categories */}
            <div className="space-y-3" role="list" aria-label={t('knowledgeView.growTech.title')}>
                {filteredCategories.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                        {t('knowledgeView.growTech.noMatchResults')}
                    </p>
                )}
                {filteredCategories.map((cat) => {
                    const Icon = categoryIcons[cat.iconKey]
                    const isExpanded = expandedCategory === cat.id
                    const panelId = `grow-tech-panel-${cat.id}`
                    const triggerId = `grow-tech-trigger-${cat.id}`
                    return (
                        <div
                            key={cat.id}
                            role="listitem"
                            className="bg-slate-800/60 rounded-lg border border-slate-700/50 overflow-hidden"
                        >
                            <button
                                id={triggerId}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-slate-700/30 transition-colors"
                                aria-expanded={isExpanded}
                                aria-controls={panelId}
                            >
                                <Icon
                                    className={`w-6 h-6 flex-shrink-0 ${cat.color}`}
                                    aria-hidden="true"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-100">
                                        {t(`knowledgeView.growTech.categories.${cat.id}.title`)}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate">
                                        {t(`knowledgeView.growTech.categories.${cat.id}.tagline`)}
                                    </p>
                                </div>
                                {(() => {
                                    const match = calculateGrowTechMatchScore(cat.id, growSetup)
                                    const matchColor =
                                        match.score >= 80
                                            ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                            : match.score >= 60
                                              ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                                              : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                                    return (
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded border font-mono shrink-0 ${matchColor}`}
                                            title={`${t('knowledgeView.growTech.matchScore')}: ${match.score}% -- ${match.reason}`}
                                        >
                                            {match.score}%
                                        </span>
                                    )
                                })()}
                                <PhosphorIcons.ChevronDown
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`}
                                    aria-hidden="true"
                                />
                            </button>
                            {isExpanded && (
                                <div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={triggerId}
                                    className="px-3 sm:px-4 pb-4 space-y-3 animate-fade-in"
                                >
                                    <p
                                        className="text-sm text-slate-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                t(
                                                    `knowledgeView.growTech.categories.${cat.id}.content`,
                                                ),
                                            ),
                                        }}
                                    />
                                    {/* Key Benefits */}
                                    <div className="bg-slate-900/50 rounded-md p-3">
                                        <h5 className="text-xs font-semibold text-primary-400 mb-2 uppercase tracking-wider">
                                            {t('knowledgeView.growTech.keyBenefits')}
                                        </h5>
                                        <p
                                            className="text-xs text-slate-400 leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(
                                                    t(
                                                        `knowledgeView.growTech.categories.${cat.id}.benefits`,
                                                    ),
                                                ),
                                            }}
                                        />
                                    </div>
                                    {/* Pro Tip */}
                                    <div className="flex items-start gap-2 bg-primary-600/10 border border-primary-500/20 rounded-md p-3">
                                        <PhosphorIcons.LightbulbFilament
                                            className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0"
                                            aria-hidden="true"
                                        />
                                        <p className="text-xs text-primary-300">
                                            {t(`knowledgeView.growTech.categories.${cat.id}.tip`)}
                                        </p>
                                    </div>
                                    {/* Related genetic trends */}
                                    {getRelatedGeneticForGrowTech(cat.id).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {getRelatedGeneticForGrowTech(cat.id).map((genetic) => (
                                                <span
                                                    key={genetic}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-pink-900/40 border border-pink-700/40 text-pink-300"
                                                >
                                                    {t(
                                                        `strainsView.geneticTrends.categories.${genetic}.title`,
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Impact Table */}
            <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-4">
                <h4 className="text-sm font-bold text-slate-100 mb-3">
                    {t('knowledgeView.growTech.impact.title')}
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 pr-2 text-slate-400 font-medium">
                                    {t('knowledgeView.growTech.impact.headers.area')}
                                </th>
                                <th className="text-left py-2 px-2 text-slate-400 font-medium">
                                    {t('knowledgeView.growTech.impact.headers.homeGrower')}
                                </th>
                                <th className="text-left py-2 px-2 text-slate-400 font-medium">
                                    {t('knowledgeView.growTech.impact.headers.commercial')}
                                </th>
                                <th className="text-left py-2 pl-2 text-slate-400 font-medium">
                                    {t('knowledgeView.growTech.impact.headers.effort')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {impactData.map((row) => (
                                <tr key={row.area} className="border-b border-slate-700/50">
                                    <td className="py-2 pr-2 font-semibold text-slate-200">
                                        {row.area}
                                    </td>
                                    <td className="py-2 px-2 text-slate-300">
                                        {row.homeAdvantage}
                                    </td>
                                    <td className="py-2 px-2 text-slate-300">
                                        {row.commercialAdvantage}
                                    </td>
                                    <td className="py-2 pl-2 text-slate-400">{row.effort}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CannaGuide integration note */}
            <div className="bg-gradient-to-r from-primary-600/10 to-purple-600/10 border border-primary-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <PhosphorIcons.Sparkle
                        className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <h4 className="text-sm font-bold text-primary-300 mb-1">
                            {t('knowledgeView.growTech.cannaGuideIntegration.title')}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {t('knowledgeView.growTech.cannaGuideIntegration.content')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
})

GrowTechView.displayName = 'GrowTechView'

export default GrowTechView
