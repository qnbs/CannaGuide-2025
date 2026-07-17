import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const CostTrackingSection: React.FC = () => {
    const { t } = useTranslation()
    const [budgetInput, setBudgetInput] = useState('')
    const budget = aiRateLimiter.getMonthlyBudget()
    const budgetPercent = aiRateLimiter.getBudgetUsagePercent()
    const todayCost = aiRateLimiter.getTodayUsage()
    const history = aiRateLimiter.getUsageHistory(7)

    const maxTokens = Math.max(...history.map((d) => d.totalTokens), 1)

    const handleSetBudget = () => {
        const val = parseInt(budgetInput, 10)
        if (!Number.isNaN(val) && val >= 0) {
            aiRateLimiter.setMonthlyBudgetLimit(val)
            setBudgetInput('')
        }
    }

    return (
        <div className="border-t border-slate-700/50 pt-3 mt-3 space-y-3">
            <p className="text-xs font-semibold text-slate-400">
                {t('settingsView.costTracking.title')}
            </p>
            <p className="text-xs text-slate-600">{t('settingsView.costTracking.disclaimer')}</p>
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-2 text-center">
                    <p className="text-lg font-bold text-slate-200">
                        {todayCost.totalTokens.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                        {t('settingsView.costTracking.tokensToday')}
                    </p>
                </div>
                <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-2 text-center">
                    <p className="text-lg font-bold text-slate-200">
                        ${todayCost.estimatedCostUsd.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted">
                        {t('settingsView.costTracking.costToday')}
                    </p>
                </div>
            </div>
            {history.length > 0 && (
                <div>
                    <p className="text-xs text-muted mb-1">
                        {t('settingsView.costTracking.last7Days')}
                    </p>
                    <div className="flex items-end gap-1 h-8">
                        {history.map((day) => (
                            <div
                                key={day.date}
                                className="flex-1 bg-primary-500/60 rounded-t"
                                style={{
                                    height: `${Math.max(4, (day.totalTokens / maxTokens) * 100)}%`,
                                }}
                                title={`${day.date}: ${day.totalTokens.toLocaleString()} tokens`}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <p className="text-xs text-muted">
                    {t('settingsView.costTracking.monthlyBudget')}:{' '}
                    {budget.limit > 0
                        ? `${budget.spent.toLocaleString()} / ${budget.limit.toLocaleString()} tokens`
                        : t('settingsView.costTracking.unlimited')}
                </p>
                {budgetPercent !== null && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className={cn(
                                'h-2 rounded-full transition-all',
                                budgetPercent >= 90
                                    ? 'bg-red-500'
                                    : budgetPercent >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500',
                            )}
                            style={{ width: `${Math.min(100, budgetPercent)}%` }}
                        />
                    </div>
                )}
                <div className="flex gap-2">
                    <Input
                        type="number"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder={t('settingsView.costTracking.budgetPlaceholder')}
                        className="flex-1"
                        min={0}
                    />
                    <Button variant="secondary" size="sm" onClick={handleSetBudget}>
                        {t('settingsView.costTracking.setBudget')}
                    </Button>
                </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => aiRateLimiter.clearCostHistory()}>
                {t('settingsView.costTracking.resetHistory')}
            </Button>
        </div>
    )
}
