import React from 'react';
import { Plant } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';

interface CombinedHistoryChartProps {
    plants: Plant[];
}

const plantColors = ['#3b82f6', '#10b981', '#f97316'];

export const CombinedHistoryChart: React.FC<CombinedHistoryChartProps> = ({ plants }) => {
    const { t } = useTranslations();
    
    const activePlants = plants.filter(p => p && p.history && p.history.length > 1);

    if (activePlants.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('plantsView.detailedView.historyNoData')}</div>;
    }
    
    const width = 250;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 20, left: 25 };
    
    const maxDay = Math.max(1, ...activePlants.flatMap(p => p.history.map(h => h.day)));
    const maxHeight = Math.max(10, ...activePlants.flatMap(p => p.history.map(h => h.height)));

    const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);
    const scaleY = (heightValue: number) => padding.top + (1 - heightValue / maxHeight) * (height - padding.top - padding.bottom);

    const createPath = (plant: Plant) => {
        return plant.history.map((point, i) => {
            const x = scaleX(point.day);
            const y = scaleY(point.height);
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
    };

    const yAxisLabelsCount = 4;
    const yAxisLabels = Array.from({ length: yAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxHeight / yAxisLabelsCount)));
    const xAxisLabelsCount = Math.min(maxDay, 4);
    const xAxisLabels = maxDay > 0 ? Array.from({ length: xAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxDay / xAxisLabelsCount))) : [0];

    return (
        <div className="w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid opacity-50">
                    {yAxisLabels.map(label => (
                        <g key={`y-${label}`}>
                            <line x1={padding.left} y1={scaleY(label)} x2={width - padding.right} y2={scaleY(label)} strokeDasharray="2,2" />
                            <text x={padding.left - 5} y={scaleY(label)} dy="0.32em" textAnchor="end" className="history-chart-labels">{label}</text>
                        </g>
                    ))}
                    {xAxisLabels.map(label => (
                        <g key={`x-${label}`}>
                             <text x={scaleX(label)} y={height - padding.bottom + 15} textAnchor="middle" className="history-chart-labels">{label}</text>
                        </g>
                    ))}
                </g>

                {activePlants.map((plant, index) => (
                    <path key={plant.id} d={createPath(plant)} fill="none" stroke={plantColors[index % plantColors.length]} strokeWidth="2" />
                ))}
            </svg>
            <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                {activePlants.map((plant, index) => (
                     <span key={plant.id} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: plantColors[index % plantColors.length]}}></div>
                        {plant.name}
                    </span>
                ))}
            </div>
        </div>
    );
};