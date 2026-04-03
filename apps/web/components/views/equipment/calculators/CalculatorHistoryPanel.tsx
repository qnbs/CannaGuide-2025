/**
 * CalculatorHistoryPanel
 *
 * Displays the last 20 calculation results for a given calculator.
 * Collapsible panel rendered at the bottom of each connected calculator component.
 */

import React, { memo, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { dbService, type CalculatorHistoryEntry } from '@/services/dbService'

interface Props {
    calculatorId: string
    refreshToken: number
}

export const CalculatorHistoryPanel: React.FC<Props> = memo(({ calculatorId, refreshToken }) => {
    const { t } = useTranslation('equipment')
    const [entries, setEntries] = useState<CalculatorHistoryEntry[]>([])

    useEffect(() => {
        dbService
            .getCalculatorHistory(calculatorId)
            .then(setEntries)
            .catch((err: unknown) => {
                console.debug('[CalculatorHistoryPanel] failed to load history', err)
            })
    }, [calculatorId, refreshToken])

    const handleClear = useCallback(() => {
        dbService
            .clearCalculatorHistory(calculatorId)
            .then(() => setEntries([]))
            .catch((err: unknown) => {
                console.debug('[CalculatorHistoryPanel] failed to clear history', err)
            })
    }, [calculatorId])

    if (entries.length === 0) {
        return (
            <p className="text-xs text-slate-600 text-center mt-2">
                {t('equipmentView.calculators.history.noEntries')}
            </p>
        )
    }

    return (
        <details className="mt-4 rounded-lg border border-slate-700/40 bg-slate-900/30">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 select-none">
                <span className="text-xs font-semibold text-slate-400">
                    {t('equipmentView.calculators.history.title')} ({entries.length})
                </span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        handleClear()
                    }}
                    className="text-xs text-slate-500 hover:text-red-400 ml-2"
                >
                    {t('equipmentView.calculators.history.clear')}
                </button>
            </summary>

            <ul className="divide-y divide-slate-800 px-3 pb-2 max-h-48 overflow-y-auto">
                {entries.map((entry) => (
                    <li key={entry.id} className="py-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">
                                {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            {entry.label !== undefined && entry.label !== '' && (
                                <span className="text-xs text-primary-400">{entry.label}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {Object.entries(entry.inputs).map(([k, v]) => (
                                <span key={k} className="text-xs text-slate-500">
                                    {k}: <span className="text-slate-400">{v}</span>
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {Object.entries(entry.result).map(([k, v]) => (
                                <span key={k} className="text-xs text-emerald-600">
                                    {k}: <span className="text-emerald-400">{v}</span>
                                </span>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </details>
    )
})
CalculatorHistoryPanel.displayName = 'CalculatorHistoryPanel'
