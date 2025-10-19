import React, { useRef, useEffect, useMemo, memo } from 'react';
import { SavedExperiment, Plant, PlantHistoryEntry } from '@/types';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { scenarioService } from '@/services/scenarioService';
import { Button } from '@/components/common/Button';

// Small component for the chart
const ComparisonChart: React.FC<{ historyA: PlantHistoryEntry[], historyB: PlantHistoryEntry[], labelA: string, labelB: string }> = memo(({ historyA, historyB, labelA, labelB }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (!svgRef.current) return;

        const allHistory = [...historyA, ...historyB];
        const width = 300;
        const height = 150;
        const padding = { top: 10, right: 10, bottom: 30, left: 30 };

        const xScale = d3.scaleLinear()
            .domain(d3.extent(allHistory, h => h.day) as [number, number])
            .range([padding.left, width - padding.right]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(allHistory, h => h.height) as number])
            .range([height - padding.bottom, padding.top]);
            
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Axes
        svg.append("g")
            .attr("transform", `translate(0, ${height - padding.bottom})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .attr("class", "history-chart-grid");
            
        svg.append("g")
            .attr("transform", `translate(${padding.left}, 0)`)
            .call(d3.axisLeft(yScale).ticks(5))
            .attr("class", "history-chart-grid");

        // Lines
        const lineGen = d3.line<PlantHistoryEntry>()
            .x(d => xScale(d.day))
            .y(d => yScale(d.height));

        svg.append("path").datum(historyA).attr("fill", "none").attr("stroke", "rgb(var(--color-primary-500))").attr("stroke-width", 2).attr("d", lineGen);
        svg.append("path").datum(historyB).attr("fill", "none").attr("stroke", "rgb(var(--color-accent-500))").attr("stroke-width", 2).attr("d", lineGen);

    }, [historyA, historyB]);

    return (
        <div className="w-full">
            <h4 className="font-bold text-center mb-2">{t('plantsView.detailedView.height')} (cm) vs. {t('plantsView.plantCard.day')}</h4>
            <svg ref={svgRef} viewBox={`0 0 300 150`} className="w-full" />
            <div className="flex justify-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-primary-500"></div>{labelA}</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-1.5 bg-accent-500"></div>{labelB}</span>
            </div>
        </div>
    );
});

const PlantSummaryCard: React.FC<{ title: string, plant: Plant }> = memo(({ title, plant }) => {
    return (
        <Card className="bg-slate-800/50">
            <h3 className="font-bold text-lg text-primary-300">{title}</h3>
            <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span>Height:</span> <span className="font-mono">{plant.height.toFixed(1)} cm</span></div>
                <div className="flex justify-between"><span>Biomass:</span> <span className="font-mono">{plant.biomass.total.toFixed(1)} g</span></div>
                <div className="flex justify-between"><span>Health:</span> <span className="font-mono">{plant.health.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span>Nodes:</span> <span className="font-mono">{plant.structuralModel.nodes}</span></div>
            </div>
        </Card>
    );
});


export const ComparisonView: React.FC<{ experiment: SavedExperiment; onFinish: () => void }> = ({ experiment, onFinish }) => {
    const { t } = useTranslation();
    const scenario = useMemo(() => scenarioService.getScenarioById(experiment.scenarioId), [experiment.scenarioId]);

    if (!scenario) return <p>Error: Scenario not found.</p>;

    const labelA = scenario.plantAModifier.action;
    const labelB = scenario.plantBModifier.action;

    const diffHeight = experiment.modifiedFinalState.height - experiment.originalFinalState.height;
    const diffBiomass = experiment.modifiedFinalState.biomass.total - experiment.originalFinalState.biomass.total;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-display text-primary-400">{t(scenario.titleKey)}</h2>
                    <p className="text-slate-400">Results based on: {experiment.basePlantName}</p>
                </div>
                <Button onClick={onFinish} variant="secondary">
                    <PhosphorIcons.X className="w-5 h-5 mr-1" />
                    Finish Experiment
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlantSummaryCard title={`Result A: ${labelA}`} plant={experiment.originalFinalState} />
                <PlantSummaryCard title={`Result B: ${labelB}`} plant={experiment.modifiedFinalState} />
            </div>

            <Card>
                <ComparisonChart historyA={experiment.originalHistory} historyB={experiment.modifiedHistory} labelA={labelA} labelB={labelB} />
            </Card>

            <Card>
                 <h3 className="text-xl font-bold font-display text-primary-400 mb-2">Summary of Differences</h3>
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-sm text-slate-400">Height Difference</p>
                        <p className={`text-2xl font-bold ${diffHeight >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diffHeight >= 0 ? '+' : ''}{diffHeight.toFixed(1)} cm
                        </p>
                    </div>
                     <div>
                        <p className="text-sm text-slate-400">Biomass Difference</p>
                        <p className={`text-2xl font-bold ${diffBiomass >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diffBiomass >= 0 ? '+' : ''}{diffBiomass.toFixed(1)} g
                        </p>
                    </div>
                 </div>
            </Card>
        </div>
    );
};