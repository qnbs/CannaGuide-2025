import React, { useState, useMemo, useCallback, memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, ResultDisplay } from './common'
import { CalculatorHistoryPanel } from './CalculatorHistoryPanel'
import { dbService } from '@/services/dbService'

type BudgetCategory =
    | 'tent'
    | 'light'
    | 'ventilation'
    | 'circulationFan'
    | 'pots'
    | 'soil'
    | 'nutrients'
    | 'extras'

const CATEGORIES: BudgetCategory[] = [
    'tent',
    'light',
    'ventilation',
    'circulationFan',
    'pots',
    'soil',
    'nutrients',
    'extras',
]

const DEFAULTS: Record<BudgetCategory, number> = {
    tent: 80,
    light: 200,
    ventilation: 120,
    circulationFan: 30,
    pots: 20,
    soil: 30,
    nutrients: 60,
    extras: 50,
}

export const BudgetCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [prices, setPrices] = useState({ ...DEFAULTS })
    const [historyToken, setHistoryToken] = useState(0)
    const savedResultRef = useRef<string | null>(null)

    const total = useMemo(
        () => CATEGORIES.reduce((sum, cat) => sum + (prices[cat] ?? 0), 0),
        [prices],
    )

    const handleChange = useCallback((cat: BudgetCategory, val: number) => {
        setPrices((prev) => ({ ...prev, [cat]: val }))
    }, [])

    const handleSave = useCallback(() => {
        const key = JSON.stringify({ prices, total })
        if (savedResultRef.current === key) return
        savedResultRef.current = key
        const entry = {
            id: `budget-${Date.now()}`,
            calculatorId: 'budget',
            inputs: { ...prices },
            result: { total },
            timestamp: Date.now(),
        }
        dbService
            .saveCalculatorHistoryEntry(entry)
            .then(() => setHistoryToken((t) => t + 1))
            .catch(console.error)
    }, [prices, total])

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.budget.title')}
            description={t('equipmentView.calculators.budget.description')}
        >
            <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                    <Input
                        key={cat}
                        label={t(`equipmentView.calculators.budget.${cat}`)}
                        type="number"
                        unit={t('equipmentView.calculators.budget.currency')}
                        value={prices[cat] ?? 0}
                        min={0}
                        step={1}
                        onChange={(e) => handleChange(cat, Number(e.target.value))}
                    />
                ))}
            </div>

            <ResultDisplay
                label={t('equipmentView.calculators.budget.total')}
                value={total.toFixed(2)}
                unit={t('equipmentView.calculators.budget.currency')}
            />

            <button
                type="button"
                onClick={handleSave}
                className="w-full mt-2 px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium transition-colors"
            >
                {t('equipmentView.calculators.history.save')}
            </button>

            <CalculatorHistoryPanel calculatorId="budget" refreshToken={historyToken} />
        </CalculatorSection>
    )
})
BudgetCalculator.displayName = 'BudgetCalculator'
