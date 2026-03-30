import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { GrowTechCategory } from '@/types'

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

export const GrowTechView: React.FC = () => {
    const { t } = useTranslation('knowledge')
    const [expandedCategory, setExpandedCategory] = useState<GrowTechCategory | null>(null)

    const toggleCategory = (id: GrowTechCategory) => {
        setExpandedCategory((prev) => (prev === id ? null : id))
    }

    const impactData = useMemo(
        () => [
            {
                area: t('growTech.impact.areas.ledSensors'),
                homeAdvantage: t('growTech.impact.home.ledSensors'),
                commercialAdvantage: t('growTech.impact.commercial.ledSensors'),
                effort: t('growTech.impact.effort.medium'),
            },
            {
                area: t('growTech.impact.areas.aiAutomation'),
                homeAdvantage: t('growTech.impact.home.aiAutomation'),
                commercialAdvantage: t('growTech.impact.commercial.aiAutomation'),
                effort: t('growTech.impact.effort.highInitial'),
            },
            {
                area: t('growTech.impact.areas.aeroponics'),
                homeAdvantage: t('growTech.impact.home.aeroponics'),
                commercialAdvantage: t('growTech.impact.commercial.aeroponics'),
                effort: t('growTech.impact.effort.mediumHigh'),
            },
            {
                area: t('growTech.impact.areas.digitalTwin'),
                homeAdvantage: t('growTech.impact.home.digitalTwin'),
                commercialAdvantage: t('growTech.impact.commercial.digitalTwin'),
                effort: t('growTech.impact.effort.high'),
            },
        ],
        [t],
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-xl font-bold text-primary-300">{t('growTech.title')}</h3>
                <p className="text-sm text-slate-400 mt-1">{t('growTech.subtitle')}</p>
            </div>

            {/* Year Badge */}
            <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600/20 text-primary-300 text-xs font-semibold border border-primary-500/30">
                    <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />
                    {t('growTech.badge2026')}
                </span>
            </div>

            {/* Introduction */}
            <p className="text-sm text-slate-300 leading-relaxed">{t('growTech.intro')}</p>

            {/* Technology Categories */}
            <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                    const Icon = categoryIcons[cat.iconKey]
                    const isExpanded = expandedCategory === cat.id
                    return (
                        <div
                            key={cat.id}
                            className="bg-slate-800/60 rounded-lg border border-slate-700/50 overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-slate-700/30 transition-colors"
                                aria-expanded={isExpanded}
                            >
                                <Icon className={`w-6 h-6 flex-shrink-0 ${cat.color}`} />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-100">
                                        {t(`growTech.categories.${cat.id}.title`)}
                                    </h4>
                                    <p className="text-xs text-slate-400 truncate">
                                        {t(`growTech.categories.${cat.id}.tagline`)}
                                    </p>
                                </div>
                                <PhosphorIcons.ChevronDown
                                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>
                            {isExpanded && (
                                <div className="px-3 sm:px-4 pb-4 space-y-3 animate-fade-in">
                                    <p
                                        className="text-sm text-slate-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                t(`growTech.categories.${cat.id}.content`),
                                            ),
                                        }}
                                    />
                                    {/* Key Benefits */}
                                    <div className="bg-slate-900/50 rounded-md p-3">
                                        <h5 className="text-xs font-semibold text-primary-400 mb-2 uppercase tracking-wider">
                                            {t('growTech.keyBenefits')}
                                        </h5>
                                        <p
                                            className="text-xs text-slate-400 leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(
                                                    t(`growTech.categories.${cat.id}.benefits`),
                                                ),
                                            }}
                                        />
                                    </div>
                                    {/* Pro Tip */}
                                    <div className="flex items-start gap-2 bg-primary-600/10 border border-primary-500/20 rounded-md p-3">
                                        <PhosphorIcons.LightbulbFilament className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-primary-300">
                                            {t(`growTech.categories.${cat.id}.tip`)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Impact Table */}
            <div className="bg-slate-800/60 rounded-lg border border-slate-700/50 p-4">
                <h4 className="text-sm font-bold text-slate-100 mb-3">
                    {t('growTech.impact.title')}
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 pr-2 text-slate-400 font-medium">
                                    {t('growTech.impact.headers.area')}
                                </th>
                                <th className="text-left py-2 px-2 text-slate-400 font-medium">
                                    {t('growTech.impact.headers.homeGrower')}
                                </th>
                                <th className="text-left py-2 px-2 text-slate-400 font-medium">
                                    {t('growTech.impact.headers.commercial')}
                                </th>
                                <th className="text-left py-2 pl-2 text-slate-400 font-medium">
                                    {t('growTech.impact.headers.effort')}
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
                    <PhosphorIcons.Sparkle className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-primary-300 mb-1">
                            {t('growTech.cannaGuideIntegration.title')}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {t('growTech.cannaGuideIntegration.content')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

GrowTechView.displayName = 'GrowTechView'

export default GrowTechView
