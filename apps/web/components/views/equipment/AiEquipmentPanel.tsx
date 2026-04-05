import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGetEquipmentRecommendationMutation } from '@/stores/api'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'
import { useCalculatorSessionStore } from '@/stores/useCalculatorSessionStore'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { Recommendation, RecommendationCategory } from '@/types'
import {
    exportEquipmentPlanPdf,
    type EquipmentPlanExportData,
} from '@/services/equipmentPlanExportService'

const CATEGORY_ORDER: RecommendationCategory[] = [
    'tent',
    'light',
    'ventilation',
    'circulationFan',
    'pots',
    'soil',
    'nutrients',
    'extra',
]

interface RecommendationTableProps {
    recommendation: Recommendation
}

const RecommendationTable: React.FC<RecommendationTableProps> = memo(({ recommendation }) => {
    const { t } = useTranslation()
    const total = CATEGORY_ORDER.reduce((sum, cat) => sum + (recommendation[cat]?.price ?? 0), 0)

    return (
        <div className="mt-4 space-y-3">
            <div className="overflow-x-auto rounded-lg ring-1 ring-inset ring-white/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-700/60 text-slate-300 text-xs uppercase">
                        <tr>
                            <th className="px-3 py-2">
                                {t('equipmentView.calculators.aiPanel.category')}
                            </th>
                            <th className="px-3 py-2">
                                {t('equipmentView.calculators.aiPanel.product')}
                            </th>
                            <th className="px-3 py-2 text-right">
                                {t('equipmentView.calculators.aiPanel.price')}
                            </th>
                            <th className="px-3 py-2 hidden sm:table-cell">
                                {t('equipmentView.calculators.aiPanel.rationale')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                        {CATEGORY_ORDER.map((cat) => {
                            const item = recommendation[cat]
                            if (!item?.name) return null
                            return (
                                <tr key={cat} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-3 py-2 text-slate-400 capitalize whitespace-nowrap">
                                        {t(`equipmentView.configurator.categories.${cat}`, {
                                            defaultValue: cat,
                                        })}
                                    </td>
                                    <td className="px-3 py-2 text-slate-100 font-medium">
                                        {item.name}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-200 whitespace-nowrap">
                                        {item.price > 0 ? `EUR ${item.price.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-slate-400 text-xs hidden sm:table-cell">
                                        {item.rationale}
                                    </td>
                                </tr>
                            )
                        })}
                        <tr className="bg-primary-500/10 font-semibold">
                            <td colSpan={2} className="px-3 py-2 text-slate-200">
                                {t('equipmentView.calculators.aiPanel.total')}
                            </td>
                            <td className="px-3 py-2 text-right text-primary-300 whitespace-nowrap">
                                EUR {total.toFixed(2)}
                            </td>
                            <td className="hidden sm:table-cell" />
                        </tr>
                    </tbody>
                </table>
            </div>
            {recommendation.proTip && (
                <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 text-amber-200 text-sm">
                    <PhosphorIcons.Sparkle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                    <p>
                        <span className="font-semibold">
                            {t('equipmentView.calculators.aiPanel.proTip')}:{' '}
                        </span>
                        {recommendation.proTip}
                    </p>
                </div>
            )}
        </div>
    )
})
RecommendationTable.displayName = 'RecommendationTable'

export const AiEquipmentPanel: React.FC = memo(() => {
    const { t, i18n } = useTranslation()
    const lang = useAppSelector(selectLanguage)
    const roomDimensions = useCalculatorSessionStore((s) => s.roomDimensions)
    const sharedLightWattage = useCalculatorSessionStore((s) => s.sharedLightWattage)
    const [getEquipmentRecommendation, { data: recommendation, isLoading, error, reset }] =
        useGetEquipmentRecommendationMutation()
    const [exportError, setExportError] = useState<string | null>(null)

    const handleGenerate = useCallback(() => {
        reset()
        setExportError(null)
        const { width, depth, height } = roomDimensions
        const vol = ((width / 100) * (depth / 100) * (height / 100)).toFixed(2)
        const prompt = `Room: ${width}cm x ${depth}cm x ${height}cm (${vol} m3). Light: ${sharedLightWattage}W LED. Recommend a complete indoor cannabis equipment setup for this space. Respond entirely in ${lang === 'de' ? 'German' : lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : lang === 'nl' ? 'Dutch' : 'English'}.`
        getEquipmentRecommendation({ prompt, lang }).catch(console.error)
    }, [getEquipmentRecommendation, lang, roomDimensions, sharedLightWattage, reset])

    const handleExportPdf = useCallback(() => {
        if (recommendation === undefined) return
        setExportError(null)
        const exportData: EquipmentPlanExportData = {
            roomDimensions,
            sharedLightWattage,
            recommendation,
        }
        try {
            exportEquipmentPlanPdf(exportData, i18n.language)
        } catch (err) {
            setExportError(t('equipmentView.calculators.aiPanel.exportError'))
            console.error(err)
        }
    }, [recommendation, roomDimensions, sharedLightWattage, i18n.language, t])

    const errorMessage =
        error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message)
            : t('equipmentView.calculators.aiPanel.error')

    return (
        <div className="rounded-lg bg-gradient-to-br from-primary-900/40 to-slate-800/60 ring-1 ring-inset ring-primary-500/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                    <PhosphorIcons.MagicWand className="w-5 h-5 text-primary-300" />
                </div>
                <div>
                    <h4 className="font-semibold text-slate-100">
                        {t('equipmentView.calculators.aiPanel.title')}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {t('equipmentView.calculators.aiPanel.description')}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('equipmentView.calculators.aiPanel.generating')}
                        </>
                    ) : (
                        <>
                            <PhosphorIcons.Sparkle className="w-4 h-4" />
                            {t('equipmentView.calculators.aiPanel.generate')}
                        </>
                    )}
                </button>

                {recommendation !== undefined && (
                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <PhosphorIcons.ArrowDown className="w-4 h-4" />
                        {t('equipmentView.calculators.aiPanel.exportPdf')}
                    </button>
                )}
            </div>

            {Boolean(error) && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded px-3 py-2">
                    {errorMessage}
                </p>
            )}
            {exportError && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded px-3 py-2">
                    {exportError}
                </p>
            )}

            {recommendation !== undefined && (
                <RecommendationTable recommendation={recommendation} />
            )}
        </div>
    )
})
AiEquipmentPanel.displayName = 'AiEquipmentPanel'
