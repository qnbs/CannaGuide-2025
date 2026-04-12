import React, { useMemo, memo, useState } from 'react'
import { SavedExperiment, Plant, PlantHistoryEntry } from '@/types'
import { useTranslation } from 'react-i18next'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { scenarioService } from '@/services/scenarioService'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/utils'

// -- Chart Tab Types -------------------------------------------------------

type ChartTab = 'height' | 'health' | 'stress' | 'nutrients'

const CHART_TABS: ChartTab[] = ['height', 'health', 'stress', 'nutrients']

// -- Merge histories into Recharts-friendly data ---------------------------

function mergeHistoryData(
    historyA: PlantHistoryEntry[],
    historyB: PlantHistoryEntry[],
    metric: ChartTab,
): Array<Record<string, number>> {
    const maxLen = Math.max(historyA.length, historyB.length)
    const data: Array<Record<string, number>> = []
    for (let i = 0; i < maxLen; i++) {
        const entryA = historyA[i]
        const entryB = historyB[i]
        const row: Record<string, number> = {
            day: entryA?.day ?? entryB?.day ?? i + 1,
        }
        switch (metric) {
            case 'height':
                if (entryA) row['plantA'] = Number(entryA.height.toFixed(2))
                if (entryB) row['plantB'] = Number(entryB.height.toFixed(2))
                break
            case 'health':
                if (entryA) row['plantA'] = Number(entryA.health.toFixed(1))
                if (entryB) row['plantB'] = Number(entryB.health.toFixed(1))
                break
            case 'stress':
                if (entryA) row['plantA'] = Number(entryA.stressLevel.toFixed(1))
                if (entryB) row['plantB'] = Number(entryB.stressLevel.toFixed(1))
                break
            case 'nutrients':
                if (entryA) {
                    row['phA'] = Number(entryA.medium.ph.toFixed(2))
                    row['ecA'] = Number(entryA.medium.ec.toFixed(2))
                }
                if (entryB) {
                    row['phB'] = Number(entryB.medium.ph.toFixed(2))
                    row['ecB'] = Number(entryB.medium.ec.toFixed(2))
                }
                break
        }
        data.push(row)
    }
    return data
}

// -- ComparisonChart (Recharts) --------------------------------------------

const ComparisonChart: React.FC<{
    historyA: PlantHistoryEntry[]
    historyB: PlantHistoryEntry[]
    labelA: string
    labelB: string
    activeTab: ChartTab
}> = memo(({ historyA, historyB, labelA, labelB, activeTab }) => {
    const { t } = useTranslation()
    const chartData = useMemo(
        () => mergeHistoryData(historyA, historyB, activeTab),
        [historyA, historyB, activeTab],
    )

    const yAxisLabel =
        activeTab === 'height'
            ? 'cm'
            : activeTab === 'health'
              ? '%'
              : activeTab === 'stress'
                ? '%'
                : 'pH / EC'

    const isNutrient = activeTab === 'nutrients'

    return (
        <div className="w-full">
            <h4 className="font-bold text-center mb-2 text-sm text-white/80">
                {t(`knowledgeView.sandbox.chartTabs.${activeTab}`, activeTab)} vs.{' '}
                {t('plantsView.plantCard.day')}
            </h4>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="day"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        label={{
                            value: t('plantsView.plantCard.day'),
                            position: 'insideBottom',
                            offset: -2,
                            fill: 'rgba(255,255,255,0.4)',
                            fontSize: 10,
                        }}
                    />
                    <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        label={{
                            value: yAxisLabel,
                            angle: -90,
                            position: 'insideLeft',
                            fill: 'rgba(255,255,255,0.4)',
                            fontSize: 10,
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {isNutrient ? (
                        <>
                            <Line
                                type="monotone"
                                dataKey="phA"
                                name={`pH ${labelA}`}
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="phB"
                                name={`pH ${labelB}`}
                                stroke="#60a5fa"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="ecA"
                                name={`EC ${labelA}`}
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="ecB"
                                name={`EC ${labelB}`}
                                stroke="#fbbf24"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        </>
                    ) : (
                        <>
                            <Line
                                type="monotone"
                                dataKey="plantA"
                                name={labelA}
                                stroke="rgb(var(--color-primary-500))"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="plantB"
                                name={labelB}
                                stroke="rgb(var(--color-accent-500))"
                                strokeWidth={2}
                                dot={false}
                            />
                        </>
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
})
ComparisonChart.displayName = 'ComparisonChart'

// -- PlantSummaryCard ------------------------------------------------------

const PlantSummaryCard: React.FC<{ title: string; plant: Plant }> = memo(({ title, plant }) => {
    const { t } = useTranslation()
    return (
        <Card className="bg-slate-800/50">
            <h3 className="font-bold text-lg text-primary-300">{title}</h3>
            <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                    <span>{t('plantsView.comparison.height')}:</span>{' '}
                    <span className="font-mono">{plant.height.toFixed(1)} cm</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('plantsView.comparison.biomass')}:</span>{' '}
                    <span className="font-mono">{plant.biomass.total.toFixed(1)} g</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('plantsView.comparison.health')}:</span>{' '}
                    <span className="font-mono">{plant.health.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('plantsView.comparison.nodes')}:</span>{' '}
                    <span className="font-mono">{plant.structuralModel.nodes}</span>
                </div>
            </div>
        </Card>
    )
})
PlantSummaryCard.displayName = 'PlantSummaryCard'

// -- ComparisonView --------------------------------------------------------

export const ComparisonView: React.FC<{ experiment: SavedExperiment; onFinish: () => void }> = ({
    experiment,
    onFinish,
}) => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<ChartTab>('height')
    const scenario = useMemo(
        () => scenarioService.getScenarioById(experiment.scenarioId),
        [experiment.scenarioId],
    )

    if (!scenario) return <p>{t('plantsView.comparison.errorNotFound')}</p>

    const resolveActionLabel = (action: string): string => {
        if (action === 'TEMP_PLUS_2') return '+2 C'
        if (action === 'TEMP_MINUS_2') return '-2 C'
        return action
    }

    const labelA = resolveActionLabel(scenario.plantAModifier.action)
    const labelB = resolveActionLabel(scenario.plantBModifier.action)
    const scenarioTitle =
        scenario.title || t(scenario.titleKey, { defaultValue: scenario.titleKey })
    const scenarioDescription =
        scenario.description ||
        t(scenario.descriptionKey, { defaultValue: scenario.descriptionKey })

    const diffHeight = experiment.modifiedFinalState.height - experiment.originalFinalState.height
    const diffBiomass =
        experiment.modifiedFinalState.biomass.total - experiment.originalFinalState.biomass.total
    const diffHeightClass = diffHeight >= 0 ? 'text-green-400' : 'text-red-400'
    const diffBiomassClass = diffBiomass >= 0 ? 'text-green-400' : 'text-red-400'

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-display text-primary-400">
                        {scenarioTitle}
                    </h2>
                    <p className="text-slate-400">{scenarioDescription}</p>
                    <p className="text-slate-400">
                        {t('plantsView.comparison.basedOn', { name: experiment.basePlantName })}
                    </p>
                </div>
                <Button onClick={onFinish} variant="secondary">
                    <PhosphorIcons.X className="w-5 h-5 mr-1" />
                    {t('plantsView.comparison.finishExperiment')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlantSummaryCard
                    title={t('plantsView.comparison.resultA', { label: labelA })}
                    plant={experiment.originalFinalState}
                />
                <PlantSummaryCard
                    title={t('plantsView.comparison.resultB', { label: labelB })}
                    plant={experiment.modifiedFinalState}
                />
            </div>

            <Card>
                {/* -- Chart Tabs -- */}
                <div className="flex gap-1 mb-4 overflow-x-auto">
                    {CHART_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                                activeTab === tab
                                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                    : 'text-white/60 hover:text-white/90 hover:bg-white/5',
                            )}
                        >
                            {t(`knowledgeView.sandbox.chartTabs.${tab}`, tab)}
                        </button>
                    ))}
                </div>
                <ComparisonChart
                    historyA={experiment.originalHistory}
                    historyB={experiment.modifiedHistory}
                    labelA={labelA}
                    labelB={labelB}
                    activeTab={activeTab}
                />
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2">
                    {t('plantsView.comparison.summaryOfDifferences')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">
                            {t('plantsView.comparison.heightDifference')}
                        </p>
                        <p className={`text-2xl font-bold ${diffHeightClass}`}>
                            {diffHeight >= 0 ? '+' : ''}
                            {diffHeight.toFixed(1)} cm
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">
                            {t('plantsView.comparison.biomassDifference')}
                        </p>
                        <p className={`text-2xl font-bold ${diffBiomassClass}`}>
                            {diffBiomass >= 0 ? '+' : ''}
                            {diffBiomass.toFixed(1)} g
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
