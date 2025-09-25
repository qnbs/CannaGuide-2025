import React, { useState } from 'react';
import { PlantHistoryEntry } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';

interface HistoryChartProps {
    history: PlantHistoryEntry[];
}

type ChartView = 'growth' | 'substrate';

type PathConfig = {
    d: string;
    stroke: string;
    strokeWidth: number;
    label: string;
    dash: boolean;
    opacity?: number;
};

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
    const { t } = useTranslations();
    const [view, setView] = useState<ChartView>('growth');
    
    if (!history || history.length < 2) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('plantsView.detailedView.historyNoData')}</div>;
    }

    const width = 300;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };

    const maxDay = Math.max(1, ...history.map(h => h.day));
    
    const createPath = (dataKey: keyof PlantHistoryEntry['substrate'] | 'height' | 'stressLevel') => {
        let dataPoints: {day: number, value: number}[] = [];
        let maxValue: number;

        if (dataKey === 'height' || dataKey === 'stressLevel') {
            dataPoints = history.map(p => ({ day: p.day, value: p[dataKey] }));
            maxValue = dataKey === 'height' ? Math.max(10, ...dataPoints.map(p => p.value)) : 100;
        } else {
            dataPoints = history.map(p => ({ day: p.day, value: p.substrate[dataKey] }));
            if (dataKey === 'ph') maxValue = 8;
            else if (dataKey === 'ec') maxValue = 3;
            else maxValue = 100;
        }

        const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);
        const scaleY = (val: number) => padding.top + (1 - val / maxValue) * (height - padding.top - padding.bottom);
        
        return dataPoints.map((point, i) => 
            `${i === 0 ? 'M' : 'L'} ${scaleX(point.day).toFixed(2)},${scaleY(point.value).toFixed(2)}`
        ).join(' ');
    };

    const xAxisLabelsCount = Math.min(maxDay, 5);
    const xAxisLabels = maxDay > 0 ? Array.from({ length: xAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxDay / xAxisLabelsCount))) : [0];
    const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);

    const growthPaths: PathConfig[] = [
        { d: createPath('height'), stroke: 'rgb(var(--color-primary-500))', strokeWidth: 2, label: `${t('plantsView.detailedView.height')} (${t('common.units.cm')})`, dash: false },
        { d: createPath('stressLevel'), stroke: 'rgb(var(--color-accent-500))', strokeWidth: 1.5, label: `${t('plantsView.detailedView.stress')} (%)`, dash: true },
    ];
    
    const substratePaths: PathConfig[] = [
        { d: createPath('ph'), stroke: 'rgb(250, 204, 21)', strokeWidth: 2, label: 'pH', dash: false },
        { d: createPath('ec'), stroke: 'rgb(249, 115, 22)', strokeWidth: 2, label: 'EC', dash: true },
        { d: createPath('moisture'), stroke: 'rgb(59, 130, 246)', strokeWidth: 1.5, label: `${t('plantsView.vitals.moisture')} (%)`, dash: false, opacity: 0.5 },
    ];

    const pathsToRender = view === 'growth' ? growthPaths : substratePaths;

    return (
        <div className="w-full h-full">
            <div className="flex justify-center gap-1 mb-2">
                <button onClick={() => setView('growth')} className={`px-2 py-0.5 text-xs rounded-md ${view === 'growth' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.history')}</button>
                <button onClick={() => setView('substrate')} className={`px-2 py-0.5 text-xs rounded-md ${view === 'substrate' ? 'bg-slate-700 font-semibold' : 'bg-slate-800'}`}>{t('plantsView.detailedView.vitals')}</button>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid opacity-50">
                    {xAxisLabels.map(label => (
                        <g key={`x-${label}`}>
                            <text x={scaleX(label)} y={height - padding.bottom + 15} textAnchor="middle" className="history-chart-labels" fill="currentColor" fontSize="8">{label}</text>
                        </g>
                    ))}
                </g>
                
                {pathsToRender.map((path, i) => (
                    <path key={i} d={path.d} fill="none" stroke={path.stroke} strokeWidth={path.strokeWidth} strokeDasharray={path.dash ? '3,3' : 'none'} opacity={path.opacity ?? 1} />
                ))}
            </svg>
             <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                {pathsToRender.map((path, i) => (
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