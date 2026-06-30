import React from 'react'
import { useTranslation } from 'react-i18next'

export const PhQuickGuidePanel: React.FC = () => {
    const { t } = useTranslation()
    const ranges = [
        { medium: 'soil', phMin: 6.0, phMax: 7.0, ecMin: 1.0, ecMax: 2.0 },
        { medium: 'coco', phMin: 5.8, phMax: 6.3, ecMin: 1.2, ecMax: 2.2 },
        { medium: 'hydro', phMin: 5.5, phMax: 6.2, ecMin: 1.0, ecMax: 2.5 },
    ]

    return (
        <div className="space-y-2">
            <p className="text-xs text-slate-400">{t('knowledgeView.rechner.ph.intro')}</p>
            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10 bg-slate-800/80">
                            <th className="text-left px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.medium')}
                            </th>
                            <th className="text-center px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.phRange')}
                            </th>
                            <th className="text-center px-3 py-2 text-slate-400 font-semibold">
                                {t('knowledgeView.rechner.ph.ecRange')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranges.map((r) => (
                            <tr
                                key={r.medium}
                                className="border-b border-white/5 hover:bg-slate-700/40 transition-colors"
                            >
                                <td className="px-3 py-2 font-medium text-slate-200">
                                    {t(`knowledgeView.rechner.ph.mediums.${r.medium}`)}
                                </td>
                                <td className="px-3 py-2 text-center text-green-300">
                                    {r.phMin.toFixed(1)} - {r.phMax.toFixed(1)}
                                </td>
                                <td className="px-3 py-2 text-center text-blue-300">
                                    {r.ecMin.toFixed(1)} - {r.ecMax.toFixed(1)} mS/cm
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-slate-500">{t('knowledgeView.rechner.ph.note')}</p>
        </div>
    )
}
