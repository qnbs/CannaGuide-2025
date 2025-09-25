import React from 'react';
import { PlantHistoryEntry } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';

interface HistoryChartProps {
    history: PlantHistoryEntry[];
    idealHistory: PlantHistoryEntry[];
    idealVitalRanges: any[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
    const { t } = useTranslations();
    
    if (!history || history.length < 2) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm">{t('plantsView.detailedView.historyNoData')}</div>;
    }

    const width = 250;
    const height = 150;
    const padding = { top: 10, right: 10, bottom: 20, left: 25 };

    const maxDay = Math.max(1, ...history.map(h => h.day));
    const maxHeight = Math.max(10, ...history.map(h => h.height));

    const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);
    const scaleY = (heightValue: number) => padding.top + (1 - heightValue / maxHeight) * (height - padding.top - padding.bottom);
    
    const createPath = (data: PlantHistoryEntry[], dataKey: 'height' | 'stressLevel' | 'ph' | 'ec' | 'moisture') => {
        let maxValue: number;
        switch(dataKey) {
            case 'height': maxValue = maxHeight; break;
            case 'ph': maxValue = 8; break;
            case 'ec': maxValue = 3; break;
            default: maxValue = 100;
        }

        const scale = (val: number) => padding.top + (1 - val / maxValue) * (height - padding.top - padding.bottom);

        return data.map((point, i) => {
            const x = scaleX(point.day);
            let yVal;
            if (dataKey === 'height' || dataKey === 'stressLevel') {
                yVal = point[dataKey];
            } else {
                yVal = point.substrate[dataKey];
            }
            const y = scale(yVal);
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
                            <line x1={padding.left} y1={scaleY(label)} x2={width - padding.right} y2={scaleY(label)} strokeDasharray="2,2" stroke="currentColor" />
                            <text x={padding.left - 5} y={scaleY(label)} dy="0.32em" textAnchor="end" className="history-chart-labels" fill="currentColor" fontSize="8">{label}</text>
                        </g>
                    ))}
                    {xAxisLabels.map(label => (
                        <g key={`x-${label}`}>
                             <text x={scaleX(label)} y={height - padding.bottom + 15} textAnchor="middle" className="history-chart-labels" fill="currentColor" fontSize="8">{label}</text>
                        </g>
                    ))}
                </g>

                <path d={createPath(history, 'height')} fill="none" stroke="rgb(var(--color-primary-500))" strokeWidth="2" />
                <path d={createPath(history, 'stressLevel')} fill="none" stroke="rgb(var(--color-accent-500))" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>
             <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                 <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-0.5" style={{backgroundColor: 'rgb(var(--color-primary-500))'}}></div>
                    {`${t('plantsView.detailedView.height')} (${t('common.units.cm')})`}
                </span>
                 <span className="flex items-center gap-1.5">
                    <div className="w-2.5 h-0.5 border-t border-dashed" style={{borderColor: 'rgb(var(--color-accent-500))'}}></div>
                    {`${t('plantsView.detailedView.stress')} (${t('common.units.percent')})`}
                </span>
            </div>
        </div>
    );
};
