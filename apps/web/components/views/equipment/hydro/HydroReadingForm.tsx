import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/stores/store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { addReading } from '@/stores/slices/hydroSlice'
import { useHydroClear, type HydroClearTarget } from './useHydroClear'
import { HydroClearActions, HydroUndoNotice } from './HydroClearControls'

const INPUT = 'equipmentView.hydroMonitoring.input'

/** The confirmation texts for each clear: each names exactly what it deletes. */
const CONFIRM_KEYS = {
    readings: {
        title: `${INPUT}.clearReadingsConfirm.title`,
        description: `${INPUT}.clearReadingsConfirm.description`,
        confirm: `${INPUT}.clearReadingsConfirm.confirm`,
    },
    alerts: {
        title: `${INPUT}.clearAlertsConfirm.title`,
        description: `${INPUT}.clearAlertsConfirm.description`,
        confirm: `${INPUT}.clearAlertsConfirm.confirm`,
    },
    all: {
        title: `${INPUT}.clearAllConfirm.title`,
        description: `${INPUT}.clearAllConfirm.description`,
        confirm: `${INPUT}.clearAllConfirm.confirm`,
    },
} as const satisfies Record<HydroClearTarget, Record<'title' | 'description' | 'confirm', string>>

export const HydroReadingForm: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const { readingCount, alertCount, target, setTarget, confirmClear, undo, undoClear } =
        useHydroClear()
    const keys = CONFIRM_KEYS[target ?? 'all']
    const closeOnDismiss = useCallback(
        (open: boolean) => {
            if (!open) setTarget(null)
        },
        [setTarget],
    )

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
                    className="text-xs bg-[linear-gradient(135deg,rgb(var(--color-primary-400)),rgb(var(--color-primary-600)))] shadow-[0_0_16px_rgba(var(--color-primary-500),0.3)] hover:shadow-[0_0_20px_rgba(var(--color-primary-500),0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none text-on-accent px-4 py-1.5 rounded-xl transition-all duration-300"
                >
                    {t('equipmentView.hydroMonitoring.input.addReading')}
                </button>
                <HydroClearActions
                    readingCount={readingCount}
                    alertCount={alertCount}
                    onPick={setTarget}
                />
            </div>
            <HydroUndoNotice undo={undo} onUndo={undoClear} />
            <ConfirmDialog
                open={target !== null}
                title={t(keys.title)}
                description={t(keys.description, { readings: readingCount, alerts: alertCount })}
                confirmLabel={t(keys.confirm)}
                cancelLabel={t(`${INPUT}.clearAllConfirm.cancel`)}
                onConfirm={confirmClear}
                onOpenChange={closeOnDismiss}
            />
        </div>
    )
})
HydroReadingForm.displayName = 'HydroReadingForm'
