import React from 'react'
import { useTranslation } from 'react-i18next'
import type { HydroClearTarget, HydroClearUndo } from './useHydroClear'

const INPUT = 'equipmentView.hydroMonitoring.input'

const CLEAR_BUTTON_CLASS =
    'text-xs text-muted hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200'

interface HydroClearActionsProps {
    readingCount: number
    alertCount: number
    onPick: (target: HydroClearTarget) => void
}

/** Clear readings, clear alerts, or both; each only when there is something to clear. */
export const HydroClearActions: React.FC<HydroClearActionsProps> = ({
    readingCount,
    alertCount,
    onPick,
}) => {
    const { t } = useTranslation()
    return (
        <>
            {readingCount > 0 && (
                <button
                    type="button"
                    onClick={() => onPick('readings')}
                    className={CLEAR_BUTTON_CLASS}
                >
                    {t(`${INPUT}.clearReadings`)}
                </button>
            )}
            {alertCount > 0 && (
                <button
                    type="button"
                    onClick={() => onPick('alerts')}
                    className={CLEAR_BUTTON_CLASS}
                >
                    {t(`${INPUT}.clearAlerts`)}
                </button>
            )}
            {readingCount + alertCount > 0 && (
                <button type="button" onClick={() => onPick('all')} className={CLEAR_BUTTON_CLASS}>
                    {t(`${INPUT}.clearAll`)}
                </button>
            )}
        </>
    )
}

interface HydroUndoNoticeProps {
    undo: HydroClearUndo | null
    onUndo: () => void
}

/** What a confirmed clear removed, with the undo while its window lasts. */
export const HydroUndoNotice: React.FC<HydroUndoNoticeProps> = ({ undo, onUndo }) => {
    const { t } = useTranslation()
    if (undo === null) return null
    return (
        <div
            role="status"
            className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-slate-300"
        >
            <span>
                {t(`${INPUT}.undo.message`, {
                    readings: undo.readings.length,
                    alerts: undo.alerts.length,
                })}
            </span>
            <button
                type="button"
                onClick={onUndo}
                className="font-semibold text-primary-400 hover:text-primary-300"
            >
                {t(`${INPUT}.undo.action`)}
            </button>
        </div>
    )
}
