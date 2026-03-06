import React, { useMemo, memo } from 'react';
import { SavedExperiment, Plant, PlantHistoryEntry } from '@/types';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { scenarioService } from '@/services/scenarioService';
import { Button } from '@/components/common/Button';

const COMP_WIDTH = 300;
const COMP_HEIGHT = 150;
const COMP_PADDING = { top: 10, right: 10, bottom: 30, left: 30 } as const;

// ---------------------------------------------------------------------------
// ComparisonChart – deklaratives React-SVG (kein imperativer d3-DOM-Zugriff)
// ---------------------------------------------------------------------------
const ComparisonChart: React.FC<{ historyA: PlantHistoryEntry[], historyB: PlantHistoryEntry[], labelA: string, labelB: string }> = memo(({ historyA, historyB, labelA, labelB }) => {
    const { t } = useTranslation();

    const allHistory = useMemo(() => [...historyA, ...historyB], [historyA, historyB]);

    const xScale = useMemo(() => {
        const [min, max] = d3.extent(allHistory, h => h.day);
        return d3.scaleLinear()
            .domain([min ?? 0, max ?? 1])
            .range([COMP_PADDING.left, COMP_WIDTH - COMP_PADDING.right]);
    }, [allHistory]);

    const yScale = useMemo(() => {
        const maxH = d3.max(allHistory, h => h.height) ?? 10;
        return d3.scaleLinear()
            .domain([0, Math.max(1, maxH)])
            .range([COMP_HEIGHT - COMP_PADDING.bottom, COMP_PADDING.top]);
    }, [allHistory]);

    const lineGen = useMemo(() =>
        d3.line<PlantHistoryEntry>()
            .x(d => xScale(d.day))
            .y(d => yScale(d.height)),
    [xScale, yScale]);

    try {
        return (
            <div className="w-full">
                <h4 className="font-bold text-center mb-2">{t('plantsView.detailedView.height')} (cm) vs. {t('plantsView.plantCard.day')}</h4>
                <svg viewBox={`0 0 ${COMP_WIDTH} ${COMP_HEIGHT}`} className="w-full" role="img" aria-label={t('plantsView.comparison.chartLabel')}>
                    <g className="history-chart-grid" transform={`translate(0, ${COMP_HEIGHT - COMP_PADDING.bottom})`}>
                        {xScale.ticks(5).map(tick => (
                            <g key={`x-${tick}`} transform={`translate(${xScale(tick)}, 0)`}>
                                <line y2="6" stroke="currentColor" />
                                <text fill="currentColor" y="9" dy="0.71em" textAnchor="middle" className="history-chart-labels">{tick}</text>
                            </g>
                        ))}
                    </g>
                    <g className="history-chart-grid" transform={`translate(${COMP_PADDING.left}, 0)`}>
                        {yScale.ticks(5).map(tick => (
                            <g key={`y-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                                <line x2="-6" stroke="currentColor" />
                                <text fill="currentColor" x="-9" dy="0.32em" textAnchor="end" className="history-chart-labels">{tick}</text>
                            </g>
                        ))}
                    </g>
                    <path d={lineGen(historyA) || ''} fill="none" stroke="rgb(var(--color-primary-500))" strokeWidth={2} />
                    <path d={lineGen(historyB) || ''} fill="none" stroke="rgb(var(--color-accent-500))" strokeWidth={2} />
                </svg>
                <div className="flex justify-center gap-4 text-xs mt-2">
                    <span className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-primary-500"></div>{labelA}</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-accent-500"></div>{labelB}</span>
                </div>
            </div>
        );
    } catch {
        return <div className="text-red-400 text-sm p-4 text-center">{t('common.error')}</div>;
    }
});
ComparisonChart.displayName = 'ComparisonChart';

const PlantSummaryCard: React.FC<{ title: string, plant: Plant }> = memo(({ title, plant }) => {
    const { t } = useTranslation();
    return (
        <Card className="bg-slate-800/50">
            <h3 className="font-bold text-lg text-primary-300">{title}</h3>
            <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>{t('plantsView.comparison.height')}:</span> <span className="font-mono">{plant.height.toFixed(1)} cm</span></div>
                <div className="flex justify-between"><span>{t('plantsView.comparison.biomass')}:</span> <span className="font-mono">{plant.biomass.total.toFixed(1)} g</span></div>
                <div className="flex justify-between"><span>{t('plantsView.comparison.health')}:</span> <span className="font-mono">{plant.health.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span>{t('plantsView.comparison.nodes')}:</span> <span className="font-mono">{plant.structuralModel.nodes}</span></div>
            </div>
        </Card>
    );
});
PlantSummaryCard.displayName = 'PlantSummaryCard';


export const ComparisonView: React.FC<{ experiment: SavedExperiment; onFinish: () => void }> = ({ experiment, onFinish }) => {
    const { t } = useTranslation();
    const scenario = useMemo(() => scenarioService.getScenarioById(experiment.scenarioId), [experiment.scenarioId]);

    if (!scenario) return <p>{t('plantsView.comparison.errorNotFound')}</p>;

    const resolveActionLabel = (action: string) => {
        if (action === 'TEMP_PLUS_2') return '+2 C'
        if (action === 'TEMP_MINUS_2') return '-2 C'
        return action
    }

    const labelA = resolveActionLabel(scenario.plantAModifier.action);
    const labelB = resolveActionLabel(scenario.plantBModifier.action);
    const scenarioTitle = scenario.title || t(scenario.titleKey, { defaultValue: scenario.titleKey })
    const scenarioDescription = scenario.description || t(scenario.descriptionKey, { defaultValue: scenario.descriptionKey })

    const diffHeight = experiment.modifiedFinalState.height - experiment.originalFinalState.height;
    const diffBiomass = experiment.modifiedFinalState.biomass.total - experiment.originalFinalState.biomass.total;

    try {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-display text-primary-400">{scenarioTitle}</h2>
                    <p className="text-slate-400">{scenarioDescription}</p>
                    <p className="text-slate-400">{t('plantsView.comparison.basedOn', { name: experiment.basePlantName })}</p>
                </div>
                <Button onClick={onFinish} variant="secondary">
                    <PhosphorIcons.X className="w-5 h-5 mr-1" />
                    {t('plantsView.comparison.finishExperiment')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlantSummaryCard title={t('plantsView.comparison.resultA', { label: labelA })} plant={experiment.originalFinalState} />
                <PlantSummaryCard title={t('plantsView.comparison.resultB', { label: labelB })} plant={experiment.modifiedFinalState} />
            </div>

            <Card>
                <ComparisonChart historyA={experiment.originalHistory} historyB={experiment.modifiedHistory} labelA={labelA} labelB={labelB} />
            </Card>

            <Card>
                 <h3 className="text-xl font-bold font-display text-primary-400 mb-2">{t('plantsView.comparison.summaryOfDifferences')}</h3>
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">{t('plantsView.comparison.heightDifference')}</p>
                        <p className={`text-2xl font-bold ${diffHeight >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diffHeight >= 0 ? '+' : ''}{diffHeight.toFixed(1)} cm
                        </p>
                    </div>
                     <div>
                        <p className="text-sm text-slate-400">{t('plantsView.comparison.biomassDifference')}</p>
                        <p className={`text-2xl font-bold ${diffBiomass >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diffBiomass >= 0 ? '+' : ''}{diffBiomass.toFixed(1)} g
                        </p>
                    </div>
                 </div>
            </Card>
        </div>
    );
    } catch {
        return <div className="text-red-400 text-sm p-4 text-center">{t('common.error')}</div>;
    }
};