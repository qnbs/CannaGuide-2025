import React, { useCallback, useState, useId } from 'react'

// Define props using a discriminated union for type safety between range and single value modes
type RangeSliderProps = {
    min: number
    max: number
    step: number
    label: string
    unit: string
    color?: 'primary' | 'green' | 'blue'
} & (
    | { 
        singleValue?: false | undefined; 
        value: [number, number]; 
        onChange: (newValue: [number, number]) => void 
      }
    | { 
        singleValue: true; 
        value: number; 
        onChange: (newValue: number) => void 
      }
)

export const RangeSlider: React.FC<RangeSliderProps> = (props) => {
    const { min, max, step, label, unit, color = 'primary' } = props;
    const rangeId = useId();

    const colorMap = {
        primary: { active: 'rgb(var(--color-primary-600))', inactive: 'rgb(var(--color-primary-500))', bg: 'bg-primary-500' },
        green: { active: 'rgb(22, 163, 74)', inactive: 'rgb(34, 197, 94)', bg: 'bg-green-500' },
        blue: { active: 'rgb(37, 99, 235)', inactive: 'rgb(59, 130, 246)', bg: 'bg-blue-500' },
    };
    const { active, inactive, bg } = colorMap[color] || colorMap.primary;

    // --- SINGLE VALUE MODE ---
    if (props.singleValue) {
        const { value, onChange } = props;

        const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(Number(e.target.value));
        };
        
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const numValue = e.target.value === '' ? min : Number(e.target.value);
            if (!isNaN(numValue)) {
                onChange(numValue);
            }
        };

        const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            let numValue = Number(e.target.value);
            if (isNaN(numValue)) numValue = min;
            if (numValue < min) numValue = min;
            if (numValue > max) numValue = max;
            onChange(numValue);
        };

        const pos = max > min ? ((value - min) / (max - min)) * 100 : 0;

        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor={rangeId} className="text-sm font-semibold text-slate-300">
                        {label}
                    </label>
                     <div className="relative">
                        <input
                            type="number"
                            value={String(value)} // Use string to allow temporary empty state while typing
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            min={min}
                            max={max}
                            step={step}
                            className="w-24 text-right bg-slate-700/80 px-2 py-0.5 rounded-md ring-1 ring-inset ring-white/20 font-mono text-sm pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">{unit}</span>
                    </div>
                </div>
                <div className="relative h-4 flex items-center">
                    <div className="relative w-full h-1 bg-slate-600 rounded-full">
                        <div
                            className={`absolute h-1 ${bg} rounded-full`}
                            style={{ width: `${pos}%` }}
                        ></div>
                        <input
                            id={rangeId}
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value}
                            onChange={handleSliderChange}
                            className="range-slider-input absolute w-full -top-0.5 h-2 appearance-none bg-transparent"
                            style={{ '--thumb-color': active, '--thumb-scale': 1.1 } as React.CSSProperties}
                            aria-label={label}
                        />
                    </div>
                </div>
            </div>
        );
    } 
    // --- RANGE MODE ---
    else {
        const { value, onChange } = props;
        const [minZIndex, setMinZIndex] = useState(1);
        const [maxZIndex, setMaxZIndex] = useState(1);

        const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const newMinVal = Math.min(Number(e.target.value), value[1] - step);
            onChange([newMinVal, value[1]]);
        }, [onChange, value, step]);

        const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const newMaxVal = Math.max(Number(e.target.value), value[0] + step);
            onChange([value[0], newMaxVal]);
        }, [onChange, value, step]);
        
        const handleMinInteraction = () => { setMinZIndex(2); setMaxZIndex(1); };
        const handleMaxInteraction = () => { setMaxZIndex(2); setMinZIndex(1); };

        const minPos = ((value[0] - min) / (max - min)) * 100;
        const maxPos = ((value[1] - min) / (max - min)) * 100;
        const minIsActive = minZIndex > maxZIndex;
        const maxIsActive = maxZIndex > minZIndex;

        return (
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor={`${rangeId}-min`} className="text-sm font-semibold text-slate-300">
                        {label}
                    </label>
                    <span className="text-sm font-mono bg-slate-700 px-2 py-0.5 rounded-md ring-1 ring-inset ring-white/20">{`${value[0]}${unit} - ${value[1]}${unit}`}</span>
                </div>
                <div className="relative h-4 flex items-center">
                    <div className="relative w-full h-1 bg-slate-600 rounded-full">
                        <div
                            className={`absolute h-1 ${bg} rounded-full`}
                            style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                        ></div>
                        <input
                            id={`${rangeId}-min`}
                            name={`${rangeId}-min`}
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value[0]}
                            onChange={handleMinChange}
                            onMouseDown={handleMinInteraction}
                            onTouchStart={handleMinInteraction}
                            className="range-slider-input absolute w-full -top-0.5 h-2 appearance-none bg-transparent"
                            style={{ zIndex: minZIndex, '--thumb-color': minIsActive ? active : inactive, '--thumb-scale': minIsActive ? 1.2 : 1 } as React.CSSProperties}
                            aria-label={`${label} minimum`}
                        />
                        <input
                            id={`${rangeId}-max`}
                            name={`${rangeId}-max`}
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value[1]}
                            onChange={handleMaxChange}
                            onMouseDown={handleMaxInteraction}
                            onTouchStart={handleMaxInteraction}
                            className="range-slider-input absolute w-full -top-0.5 h-2 appearance-none bg-transparent"
                            style={{ zIndex: maxZIndex, '--thumb-color': maxIsActive ? active : inactive, '--thumb-scale': maxIsActive ? 1.2 : 1 } as React.CSSProperties}
                            aria-label={`${label} maximum`}
                        />
                    </div>
                </div>
            </div>
        );
    }
}