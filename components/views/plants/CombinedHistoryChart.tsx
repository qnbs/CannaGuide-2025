import React from 'react';
import { Plant, PlantHistoryEntry } from '../../../types';
import { useTranslations } from '../../../hooks/useTranslations';

interface CombinedHistoryChartProps {
    plants: Plant[];
}

const lineColors = ['#34d399', '#f59e0b', '#60a5fa']; // emerald, amber, blue

export const CombinedHistoryChart: React.FC<CombinedHistoryChartProps> = ({ plants }) => {
    const { t } = useTranslations();
    
    if (!plants || plants.length === 0) {
        return <div className="flex items-center justify-center h-full text-slate-500">{t('plantsView.detailedView.historyNoData')}</div>;
    }

    const width = 250;
    const height = 150;
    const padding = { top: 10, right: 0, bottom: 20, left: 25 };

    const allHistory = plants.flatMap(p => p.history);
    if(allHistory.length < 2) {
         return <div className="flex items-center justify-center h-full text-slate-500">{t('plantsView.detailedView.historyNoData')}</div>;
    }

    const maxDay = Math.max(...allHistory.map(h => h.day), 1);
    const maxHeight = Math.max(...allHistory.map(h => h.height), 10);
    
    const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);
    const scaleY = (heightValue: number) => padding.top + (1 - heightValue / maxHeight) * (height - padding.top - padding.bottom);

    const createPath = (history: PlantHistoryEntry[]) => {
        if (history.length === 0) return '';
        return history
            .sort((a,b) => a.day - b.day)
            .map((point, i) => {
                const x = scaleX(point.day);
                const y = scaleY(point.height);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
            }).join(' ');
    };
    
    const yAxisLabelsCount = 5;
    const yAxisLabels = Array.from({ length: yAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxHeight / yAxisLabelsCount)));
    const xAxisLabelsCount = Math.min(maxDay, 5);
    const xAxisLabels = Array.from({ length: xAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxDay / xAxisLabelsCount)));


    return (
        <div className="w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid">
                    {yAxisLabels.map(label => (
                        <g key={`y-${label}`}>
                            <line x1={padding.left} y1={scaleY(label)} x2={width - padding.right} y2={scaleY(label)} strokeDasharray="2,2" />
                            <text x={padding.left - 5} y={scaleY(label)} dy="0.32em" textAnchor="end" className="history-chart-labels">{label}cm</text>
                        </g>
                    ))}
                    {xAxisLabels.map(label => (
                        <g key={`x-${label}`}>
                             <line x1={scaleX(label)} y1={padding.top} x2={scaleX(label)} y2={height - padding.bottom} strokeDasharray="2,2" />
                             <text x={scaleX(label)} y={height - padding.bottom + 15} textAnchor="middle" className="history-chart-labels">{label}</text>
                        </g>
                    ))}
                     <text x={(width + padding.left - padding.right) / 2} y={height - padding.bottom + 20} textAnchor="middle" dy="1em" className="history-chart-labels font-semibold">{t('common.days')}</text>
                </g>

                {plants.map((plant, index) => (
                    <path key={plant.id} d={createPath(plant.history)} fill="none" stroke={lineColors[index % lineColors.length]} strokeWidth="2" />
                ))}
            </svg>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                {plants.map((plant, index) => (
                    <span key={plant.id} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: lineColors[index % lineColors.length] }}></div>
                        {plant.name}
                    </span>
                ))}
            </div>
        </div>
    );
};