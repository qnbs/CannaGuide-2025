import React, { useState, useMemo, memo, useRef } from 'react';
import { PlantHistoryEntry, JournalEntry, JournalEntryType } from '@/types';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface HistoryChartProps {
    history: PlantHistoryEntry[];
    journal: JournalEntry[];
    plantCreatedAt: number;
}

type ChartView = 'growth' | 'substrate';

const eventTypes: JournalEntryType[] = [JournalEntryType.Watering, JournalEntryType.Feeding, JournalEntryType.Training];
const eventIcons: Record<JournalEntryType, React.ReactNode> = {
    [JournalEntryType.Watering]: <PhosphorIcons.Drop />,
    [JournalEntryType.Feeding]: <PhosphorIcons.TestTube />,
    [JournalEntryType.Training]: <PhosphorIcons.Scissors />,
    [JournalEntryType.Photo]: <></>,
    [JournalEntryType.Observation]: <></>,
    [JournalEntryType.PestControl]: <></>,
    [JournalEntryType.System]: <></>,
    [JournalEntryType.Environment]: <></>,
    [JournalEntryType.Amendment]: <></>,
    [JournalEntryType.Harvest]: <PhosphorIcons.ArchiveBox />,
    [JournalEntryType.PostHarvest]: <PhosphorIcons.ArchiveBox />,
};

type Metric = 'height' | 'stressLevel' | 'ph' | 'ec' | 'moisture';

const pathConfig = {
    growth: [
        { key: 'height' as Metric, labelKey: 'plantsView.detailedView.height', color: 'rgb(var(--color-primary-500))', strokeWidth: 2, dash: false, unit: 'cm' },
        { key: 'stressLevel' as Metric, labelKey: 'plantsView.detailedView.stress', color: 'rgb(var(--color-accent-500))', strokeWidth: 1.5, dash: true, unit: '%' },
    ],
    substrate: [
        { key: 'ph' as Metric, labelKey: 'plantsView.vitals.ph', color: 'rgb(250, 204, 21)', strokeWidth: 2, dash: false, unit: '' },
        { key: 'ec' as Metric, labelKey: 'plantsView.vitals.ec', color: 'rgb(249, 115, 22)', strokeWidth: 2, dash: true, unit: '' },
        { key: 'moisture' as Metric, labelKey: 'plantsView.vitals.moisture', color: 'rgb(59, 130, 246)', strokeWidth: 1.5, dash: false, unit: '%', opacity: 0.7 },
    ]
};

export const HistoryChart: React.FC<HistoryChartProps> = memo(({ history, journal, plantCreatedAt }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<ChartView>('growth');
    const [hoveredData, setHoveredData] = useState<{ point: PlantHistoryEntry, x: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    if (!history || history.length < 2) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('plantsView.detailedView.historyNoData')}</div>;
    }

    const width = 300;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 30, left: 30 };

    const maxDay = Math.max(1, d3.max(history, h => h.day) || 1);
    const xScale = useMemo(() => d3.scaleLinear().domain([0, maxDay]).range([padding.left, width - padding.right]), [maxDay]);

    const yDomains = useMemo(() => ({
        height: [0, Math.max(10, d3.max(history, h => h.height) || 10)],
        stressLevel: [0, 100],
        ph: [5, 8],
        ec: [0, 3],
        moisture: [0, 100],
    }), [history]);

    const yScales = useMemo(() => ({
        height: d3.scaleLinear().domain(yDomains.height).range([height - padding.bottom, padding.top]),
        stressLevel: d3.scaleLinear().domain(yDomains.stressLevel).range([height - padding.bottom, padding.top]),
        ph: d3.scaleLinear().domain(yDomains.ph).range([height - padding.bottom, padding.top]),
        ec: d3.scaleLinear().domain(yDomains.ec).range([height - padding.bottom, padding.top]),
        moisture: d3.scaleLinear().domain(yDomains.moisture).range([height - padding.bottom, padding.top]),
    }), [yDomains, height, padding]);

    const lineGenerators = useMemo(() => ({
        height: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.height(d.height)),
        stressLevel: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.stressLevel(d.stressLevel)),
        ph: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.ph(d.medium.ph)),
        ec: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.ec(d.medium.ec)),
        moisture: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.moisture(d.medium.moisture)),
    }), [xScale, yScales]);
    
    const eventEntries = useMemo(() => journal.filter(e => eventTypes.includes(e.type)), [journal]);

    const paths = pathConfig[view];

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        
        const [mouseX] = d3.pointer(event);
        const day = xScale.invert(mouseX);
        
        const bisector = d3.bisector((d: PlantHistoryEntry) => d.day).left;
        const index = bisector(history, day, 1);
        const d0 = history[index - 1];
        const d1 = history[index];
        if (!d0 || !d1) return;
        
        const point = day - d0.day > d1.day - day ? d1 : d0;
        setHoveredData({ point, x: xScale(point.day) });
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
    };

    return (
        <div className="w-full h-full">
            <div className="flex justify-center gap-1 mb-2">
                <button onClick={() => setView('growth')} className={`px-2 py-0.5 text-xs rounded-md ring-1 ring-inset ring-white/20 ${view === 'growth' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.history')}</button>
                <button onClick={() => setView('substrate')} className={`px-2 py-0.5 text-xs rounded-md ring-1 ring-inset ring-white/20 ${view === 'substrate' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.vitals')}</button>
            </div>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid" transform={`translate(0, ${height - padding.bottom})`}>
                    {xScale.ticks(5).map(tick => (
                        <g key={`x-${tick}`} transform={`translate(${xScale(tick)}, 0)`}>
                            <line y2="6" stroke="currentColor" />
                            <text fill="currentColor" y="9" dy="0.71em" textAnchor="middle" className="history-chart-labels">{tick}</text>
                        </g>
                    ))}
                </g>
                
                {paths.map((pathInfo) => (
                    <path key={pathInfo.key} d={lineGenerators[pathInfo.key](history) || ''} fill="none" stroke={pathInfo.color} strokeWidth={pathInfo.strokeWidth} strokeDasharray={pathInfo.dash ? '3,3' : 'none'} opacity={pathInfo.opacity ?? 1} />
                ))}

                {eventEntries.map(entry => {
                    const dayOfEvent = Math.floor((entry.createdAt - plantCreatedAt) / (1000 * 3600 * 24));
                    if (dayOfEvent < 0 || dayOfEvent > maxDay) return null;
                    
                    const xPos = xScale(dayOfEvent);
                    const yPos = height - padding.bottom + 2;

                    return (
                        <g key={entry.id} transform={`translate(${xPos}, ${yPos})`} className="cursor-pointer">
                            <title>{t(`plantsView.historyChart.events.${entry.type.toLowerCase()}`)}: {entry.notes}</title>
                            <circle r="4" fill="rgb(var(--color-bg-component))" stroke="rgb(var(--color-border))" />
                            <foreignObject x="-6" y="-6" width="12" height="12" className="text-slate-300">
                                <div className="w-full h-full text-[10px] flex items-center justify-center">
                                    {eventIcons[entry.type]}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                <rect 
                    x={padding.left}
                    y={padding.top}
                    width={width - padding.left - padding.right}
                    height={height - padding.top - padding.bottom}
                    fill="transparent"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />

                {hoveredData && (
                    <g pointerEvents="none">
                        <line x1={hoveredData.x} y1={padding.top} x2={hoveredData.x} y2={height - padding.bottom} stroke="rgb(var(--color-border))" strokeWidth="1" strokeDasharray="2,2" />
                        
                        {paths.map(pathInfo => {
                            let yValue;
                            if (pathInfo.key === 'ph' || pathInfo.key === 'ec' || pathInfo.key === 'moisture') {
                                yValue = hoveredData.point.medium[pathInfo.key];
                            } else {
                                yValue = (hoveredData.point as any)[pathInfo.key];
                            }
                            const yPos = yScales[pathInfo.key](yValue);

                            return <circle key={`dot-${pathInfo.key}`} cx={hoveredData.x} cy={yPos} r="3" fill={pathInfo.color} stroke="rgb(var(--color-bg-primary))" strokeWidth="1.5" />;
                        })}

                        <foreignObject x={hoveredData.x > width / 2 ? hoveredData.x - 120 - 10 : hoveredData.x + 10} y={padding.top} width="120" height="100">
                           <div className="bg-slate-900/80 p-2 rounded-md border border-slate-700 text-xs text-slate-200 space-y-1">
                                <p className="font-bold border-b border-slate-700 pb-1 mb-1">{t('plantsView.plantCard.day')} {hoveredData.point.day}</p>
                                {paths.map(pathInfo => {
                                      let value;
                                      if (pathInfo.key === 'ph' || pathInfo.key === 'ec' || pathInfo.key === 'moisture') {
                                          value = hoveredData.point.medium[pathInfo.key];
                                      } else {
                                          value = (hoveredData.point as any)[pathInfo.key];
                                      }
                                      return <p key={`tooltip-${pathInfo.key}`} style={{color: pathInfo.color}}>{t(pathInfo.labelKey)}: {value.toFixed(1)}{pathInfo.unit}</p>
                                })}
                           </div>
                        </foreignObject>
                    </g>
                )}
            </svg>
            <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                {paths.map((pathInfo) => (
                    <span key={pathInfo.key} className="flex items-center gap-1.5">
                        {pathInfo.dash ? 
                            <div className="w-2.5 h-0.5 border-t border-dashed" style={{borderColor: pathInfo.color}}></div> :
                            <div className="w-2.5 h-0.5" style={{backgroundColor: pathInfo.color}}></div>
                        }
                        {t(pathInfo.labelKey)}
                    </span>
                ))}
            </div>
        </div>
    );
});