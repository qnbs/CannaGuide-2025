import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectHydroThresholds, setThresholds } from '@/stores/slices/hydroSlice'
import type { HydroThresholds } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const THRESHOLD_FIELDS: [keyof HydroThresholds, string][] = [
    ['phMin', 'equipmentView.hydroMonitoring.thresholds.phMin'],
    ['phMax', 'equipmentView.hydroMonitoring.thresholds.phMax'],
    ['ecMin', 'equipmentView.hydroMonitoring.thresholds.ecMin'],
    ['ecMax', 'equipmentView.hydroMonitoring.thresholds.ecMax'],
    ['waterTempMin', 'equipmentView.hydroMonitoring.thresholds.tempMin'],
    ['waterTempMax', 'equipmentView.hydroMonitoring.thresholds.tempMax'],
]

export const HydroThresholdEditor: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const thresholds = useAppSelector(selectHydroThresholds)
    const [showThresholdEditor, setShowThresholdEditor] = useState(false)

    const handleThresholdChange = useCallback(
        (field: keyof HydroThresholds, value: string) => {
            const num = parseFloat(value)
            if (!Number.isNaN(num)) {
                dispatch(setThresholds({ [field]: num }))
            }
        },
        [dispatch],
    )

    return (
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
            <button
                type="button"
                onClick={() => setShowThresholdEditor(!showThresholdEditor)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 w-full transition-colors duration-200"
            >
                <PhosphorIcons.GearSix className="w-4 h-4" aria-hidden="true" />
                {t('equipmentView.hydroMonitoring.thresholds.title')}
                <span className="ml-auto text-xs text-muted">
                    {showThresholdEditor ? '-' : '+'}
                </span>
            </button>
            {showThresholdEditor && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {THRESHOLD_FIELDS.map(([field, labelKey]) => (
                        <div key={field}>
                            <label
                                htmlFor={`thresh-${field}`}
                                className="text-xs text-slate-400 block mb-1"
                            >
                                {t(labelKey)}
                            </label>
                            <input
                                id={`thresh-${field}`}
                                type="number"
                                step="0.1"
                                value={thresholds[field]}
                                onChange={(e) => handleThresholdChange(field, e.target.value)}
                                className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
})
HydroThresholdEditor.displayName = 'HydroThresholdEditor'
