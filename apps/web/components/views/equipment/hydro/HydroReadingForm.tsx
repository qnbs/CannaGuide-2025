import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import {
    addReading,
    clearAlerts,
    clearReadings,
    selectHydroReadings,
} from '@/stores/slices/hydroSlice'

export const HydroReadingForm: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const readings = useAppSelector(selectHydroReadings)

    const [formPh, setFormPh] = useState('')
    const [formEc, setFormEc] = useState('')
    const [formTemp, setFormTemp] = useState('')

    const handleAddReading = useCallback(() => {
        const ph = parseFloat(formPh)
        const ec = parseFloat(formEc)
        const waterTemp = parseFloat(formTemp)
        if (Number.isNaN(ph) || Number.isNaN(ec) || Number.isNaN(waterTemp)) return
        dispatch(
            addReading({
                timestamp: Date.now(),
                ph,
                ec,
                waterTemp,
            }),
        )
        setFormPh('')
        setFormEc('')
        setFormTemp('')
    }, [dispatch, formPh, formEc, formTemp])

    const handleClearAll = useCallback(() => {
        dispatch(clearReadings())
        dispatch(clearAlerts())
    }, [dispatch])

    return (
        <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {t('equipmentView.hydroMonitoring.input.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label htmlFor="hydro-ph" className="text-xs text-slate-400 block mb-1">
                        {t('equipmentView.hydroMonitoring.input.ph')}
                    </label>
                    <input
                        id="hydro-ph"
                        type="number"
                        step="0.01"
                        min="0"
                        max="14"
                        value={formPh}
                        onChange={(e) => setFormPh(e.target.value)}
                        className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                        placeholder="6.0"
                    />
                </div>
                <div>
                    <label htmlFor="hydro-ec" className="text-xs text-slate-400 block mb-1">
                        {t('equipmentView.hydroMonitoring.input.ec')}
                    </label>
                    <input
                        id="hydro-ec"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formEc}
                        onChange={(e) => setFormEc(e.target.value)}
                        className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                        placeholder="1.6"
                    />
                </div>
                <div>
                    <label htmlFor="hydro-temp" className="text-xs text-slate-400 block mb-1">
                        {t('equipmentView.hydroMonitoring.input.waterTemp')}
                    </label>
                    <input
                        id="hydro-temp"
                        type="number"
                        step="0.1"
                        min="0"
                        max="40"
                        value={formTemp}
                        onChange={(e) => setFormTemp(e.target.value)}
                        className="w-full text-sm rounded-xl border-white/[0.1] bg-white/[0.06] backdrop-blur-sm px-2.5 py-1.5 text-slate-200 focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                        placeholder="21.0"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <button
                    type="button"
                    onClick={handleAddReading}
                    disabled={!formPh || !formEc || !formTemp}
                    className="text-xs bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] shadow-[0_0_16px_rgba(var(--color-primary-500),0.3)] hover:shadow-[0_0_20px_rgba(var(--color-primary-500),0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-white px-4 py-1.5 rounded-xl transition-all duration-300"
                >
                    {t('equipmentView.hydroMonitoring.input.addReading')}
                </button>
                {readings.length > 0 && (
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-muted hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                    >
                        {t('equipmentView.hydroMonitoring.input.clearAll')}
                    </button>
                )}
            </div>
        </div>
    )
})
HydroReadingForm.displayName = 'HydroReadingForm'
