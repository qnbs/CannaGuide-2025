import React from 'react';

export const GaugeStat: React.FC<{
    label: string,
    value: number | string,
    unit: string,
    idealMin?: number,
    idealMax?: number,
    max: number,
    color: string,
    precision?: number,
}> = ({ label, value, unit, idealMin, idealMax, max, color, precision = 1 }) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const percentage = Math.min(100, Math.max(0, (numericValue / max) * 100));
    const isIdeal = idealMin !== undefined && idealMax !== undefined && numericValue >= idealMin && numericValue <= idealMax;

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-slate-300">{label}</span>
                <span className={`font-mono text-lg font-bold ${isIdeal ? 'text-green-400' : 'text-amber-400'}`}>
                    {typeof value === 'number' ? value.toFixed(precision) : value}
                    <span className="text-xs ml-1 text-slate-400 font-sans font-normal">{unit}</span>
                </span>
            </div>
            <div className="relative w-full bg-slate-700 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }}></div>
                {(idealMin !== undefined && idealMax !== undefined) && (
                    <div
                        className="absolute top-0 h-2.5 border-x-2 border-slate-900 opacity-50"
                        style={{
                            left: `${(idealMin / max) * 100}%`,
                            width: `${((idealMax - idealMin) / max) * 100}%`
                        }}
                        title={`Ideal: ${idealMin}-${idealMax}${unit}`}
                    ></div>
                )}
            </div>
        </div>
    );
};

export const StatItem: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode, fullWidth?: boolean }> = ({ icon, label, value, fullWidth = false }) => (
    <div className={`flex items-center gap-3 ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-700 rounded-lg text-primary-400">
            {icon}
        </div>
        <div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="font-semibold text-slate-100">{value}</p>
        </div>
    </div>
);