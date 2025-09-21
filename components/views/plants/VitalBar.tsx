import React from 'react';

interface VitalBarProps {
    label: string;
    value: number;
    min: number;
    max: number;
    idealMin: number;
    idealMax: number;
    unit: string;
    colorClass: string;
}

export const VitalBar: React.FC<VitalBarProps> = ({ label, value, min, max, idealMin, idealMax, unit, colorClass }) => {
    const valuePercent = ((value - min) / (max - min)) * 100;
    const idealMinPercent = ((idealMin - min) / (max - min)) * 100;
    const idealWidthPercent = ((idealMax - idealMin) / (max - min)) * 100;

    const isIdeal = value >= idealMin && value <= idealMax;

    return (
        <div>
            <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="font-semibold text-slate-300">{label}</span>
                <span className={`font-mono ${isIdeal ? 'text-green-400' : 'text-amber-400'}`}>{value.toFixed(1)}{unit}</span>
            </div>
            <div className="relative h-2 w-full bg-slate-700 rounded-full">
                <div 
                    className="absolute top-0 left-0 h-full bg-slate-600/50 rounded-full"
                    style={{ left: `${idealMinPercent}%`, width: `${idealWidthPercent}%` }}
                    title={`Ideal: ${idealMin}-${idealMax}${unit}`}
                ></div>
                <div 
                    className={`absolute top-0 left-0 h-full rounded-full ${colorClass} transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, valuePercent))}%` }}
                ></div>
            </div>
        </div>
    );
};
