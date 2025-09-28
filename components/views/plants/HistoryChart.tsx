import React, { useState, useMemo } from 'react';
import { PlantHistoryEntry, JournalEntry, JournalEntryType } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
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
};

export const HistoryChart: React.FC<HistoryChartProps> = ({ history, journal, plantCreatedAt }) => {
    const { t } = useTranslations();
    const [view, setView] = useState<ChartView>('growth');
    
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
    }), [yDomains]);

    const lineGenerators = useMemo(() => ({
        height: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.height(d.height)),
        stressLevel: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.stressLevel(d.stressLevel)),
        ph: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.ph(d.substrate.ph)),
        ec: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.ec(d.substrate.ec)),
        moisture: d3.line<PlantHistoryEntry>().x(d => xScale(d.day)).y(d => yScales.moisture(d.substrate.moisture)),
    }), [xScale, yScales]);
    
    const eventEntries = useMemo(() => journal.filter(e => eventTypes.includes(e.type)), [journal]);

    const paths = view === 'growth' ? [
        { d: lineGenerators.height(history), stroke: 'rgb(var(--color-primary-500))', strokeWidth: 2, label: t('plantsView.detailedView.height'), dash: false },
        { d: lineGenerators.stressLevel(history), stroke: 'rgb(var(--color-accent-500))', strokeWidth: 1.5, label: t('plantsView.detailedView.stress'), dash: true },
    ] : [
        { d: lineGenerators.ph(history), stroke: 'rgb(250, 204, 21)', strokeWidth: 2, label: 'pH', dash: false },
        { d: lineGenerators.ec(history), stroke: 'rgb(249, 115, 22)', strokeWidth: 2, label: 'EC', dash: true },
        { d: lineGenerators.moisture(history), stroke: 'rgb(59, 130, 246)', strokeWidth: 1.5, label: t('plantsView.vitals.moisture'), dash: false, opacity: 0.5 },
    ];

    return (
        <div className="w-full h-full">
            <div className="flex justify-center gap-1 mb-2">
                <button onClick={() => setView('growth')} className={`px-2 py-0.5 text-xs rounded-md ${view === 'growth' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.history')}</button>
                <button onClick={() => setView('substrate')} className={`px-2 py-0.5 text-xs rounded-md ${view === 'substrate' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.vitals')}</button>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid" transform={`translate(0, ${height - padding.bottom})`}>
                    {xScale.ticks(5).map(tick => (
                        <g key={`x-${tick}`} transform={`translate(${xScale(tick)}, 0)`}>
                            <line y2="6" stroke="currentColor" />
                            <text fill="currentColor" y="9" dy="0.71em" textAnchor="middle" className="history-chart-labels">{tick}</text>
                        </g>
                    ))}
                </g>
                
                {paths.map((path, i) => (
                    <path key={i} d={path.d || ''} fill="none" stroke={path.stroke} strokeWidth={path.strokeWidth} strokeDasharray={path.dash ? '3,3' : 'none'} opacity={path.opacity ?? 1} />
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
            </svg>
            <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                {paths.map((path, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                        {path.dash ? 
                            <div className="w-2.5 h-0.5 border-t border-dashed" style={{borderColor: path.stroke}}></div> :
                            <div className="w-2.5 h-0.5" style={{backgroundColor: path.stroke}}></div>
                        }
                        {path.label}
                    </span>
                ))}
            </div>
        </div>
    );
};
