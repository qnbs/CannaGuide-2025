import React from 'react';
import { PlantHistoryEntry } from '../../../types';

interface HistoryChartProps {
    history: PlantHistoryEntry[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
    if (!history || history.length < 2) {
        return <div className="flex items-center justify-center h-full text-slate-500">Nicht genügend Daten für das Diagramm vorhanden.</div>;
    }

    const width = 250;
    const height = 150;
    const padding = { top: 10, right: 0, bottom: 20, left: 25 };

    const maxDay = Math.max(...history.map(h => h.day));
    
    const scaleX = (day: number) => padding.left + (day / maxDay) * (width - padding.left - padding.right);
    const scaleY = (value: number) => padding.top + (1 - value / 100) * (height - padding.top - padding.bottom);

    const createPath = (key: 'substrateMoisture' | 'ec' | 'stressLevel') => {
        return history.map((point, i) => {
            const x = scaleX(point.day);
            let value = 0;
            if (key === 'stressLevel') {
                value = point.stressLevel;
            } else if (key === 'substrateMoisture') {
                value = point.vitals.substrateMoisture;
            } else if (key === 'ec') {
                // EC is 0-3, scale it to 0-100 for the chart
                value = (point.vitals.ec / 3.0) * 100;
            }
            const y = scaleY(value);
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        }).join(' ');
    };
    
    const waterPath = createPath('substrateMoisture');
    const nutrientsPath = createPath('ec');
    const stressPath = createPath('stressLevel');
    
    const yAxisLabels = [0, 25, 50, 75, 100];
    const xAxisLabelsCount = Math.min(maxDay, 5);
    const xAxisLabels = Array.from({ length: xAxisLabelsCount + 1 }, (_, i) => Math.round(i * (maxDay / xAxisLabelsCount)));


    return (
        <div className="w-full h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <g className="history-chart-grid">
                    {yAxisLabels.map(label => (
                        <g key={label}>
                            <line x1={padding.left} y1={scaleY(label)} x2={width - padding.right} y2={scaleY(label)} strokeDasharray="2,2" />
                            <text x={padding.left - 5} y={scaleY(label)} dy="0.32em" textAnchor="end" className="history-chart-labels">{label}%</text>
                        </g>
                    ))}
                    {xAxisLabels.map(label => (
                        <g key={label}>
                             <line x1={scaleX(label)} y1={padding.top} x2={scaleX(label)} y2={height - padding.bottom} strokeDasharray="2,2" />
                             <text x={scaleX(label)} y={height - padding.bottom + 15} textAnchor="middle" className="history-chart-labels">{label}</text>
                        </g>
                    ))}
                </g>

                <path d={waterPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
                <path d={nutrientsPath} fill="none" stroke="#f59e0b" strokeWidth="2" />
                <path d={stressPath} fill="none" stroke="#ef4444" strokeWidth="2" />
            </svg>
            <div className="flex justify-center gap-4 text-xs mt-2">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div>Feuchtigkeit</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div>EC-Wert</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div>Stresslevel</span>
            </div>
        </div>
    );
};