import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const DOSING_ROWS = [
    {
        stageKey: 'equipmentView.hydroMonitoring.dosing.seedling',
        ec: '0.3 - 0.6',
        ph: '5.5 - 6.0',
    },
    {
        stageKey: 'equipmentView.hydroMonitoring.dosing.vegetative',
        ec: '0.8 - 1.6',
        ph: '5.5 - 6.0',
    },
    {
        stageKey: 'equipmentView.hydroMonitoring.dosing.flowering',
        ec: '1.4 - 2.4',
        ph: '5.5 - 6.0',
    },
    {
        stageKey: 'equipmentView.hydroMonitoring.dosing.lateFlower',
        ec: '1.0 - 1.8',
        ph: '5.8 - 6.2',
    },
    {
        stageKey: 'equipmentView.hydroMonitoring.dosing.flush',
        ec: '0.0 - 0.3',
        ph: '5.8 - 6.2',
        isLast: true,
    },
] as const

export const HydroDosingReference: React.FC = memo(() => {
    const { t } = useTranslation()

    return (
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
                <PhosphorIcons.Flask className="w-4 h-4 inline mr-1" aria-hidden="true" />
                {t('equipmentView.hydroMonitoring.dosing.title')}
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/[0.08]">
                            <th className="text-left py-2 text-slate-400 font-medium">
                                {t('equipmentView.hydroMonitoring.dosing.stage')}
                            </th>
                            <th className="text-center py-2 text-slate-400 font-medium">
                                {t('equipmentView.hydroMonitoring.dosing.ecColumn')}
                            </th>
                            <th className="text-center py-2 text-slate-400 font-medium">
                                {t('equipmentView.hydroMonitoring.dosing.phColumn')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {DOSING_ROWS.map((row) => (
                            <tr
                                key={row.stageKey}
                                className={
                                    'isLast' in row && row.isLast
                                        ? undefined
                                        : 'border-b border-white/[0.06]'
                                }
                            >
                                <td className="py-2 text-slate-300">{t(row.stageKey)}</td>
                                <td className="text-center text-slate-400">{row.ec}</td>
                                <td className="text-center text-slate-400">{row.ph}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
})
HydroDosingReference.displayName = 'HydroDosingReference'
