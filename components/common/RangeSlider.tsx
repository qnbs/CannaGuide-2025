import React, { useCallback, useState } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step: number;
    value: number[];
    onChange: (newValue: number[]) => void;
    label: string;
    unit: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, step, value, onChange, label, unit }) => {
    
    // z-index state to determine which thumb is on top and visually active
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

    // When user interacts with a thumb, bring it to the front to ensure it's selectable
    const handleMinInteraction = () => {
        setMinZIndex(2);
        setMaxZIndex(1);
    };

    const handleMaxInteraction = () => {
        setMaxZIndex(2);
        setMinZIndex(1);
    };

    const minPos = ((value[0] - min) / (max - min)) * 100;
    const maxPos = ((value[1] - min) / (max - min)) * 100;

    // Visual feedback variables for CSS
    const minIsActive = minZIndex > maxZIndex;
    const maxIsActive = maxZIndex > minZIndex;
    const activeColor = '#2563eb';   // primary-600 (a bit darker/more saturated)
    const inactiveColor = '#3b82f6'; // primary-500
    const activeScale = 1.2;
    const inactiveScale = 1;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</label>
                <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md">{`${value[0]}${unit} - ${value[1]}${unit}`}</span>
            </div>
            <div className="relative h-4 flex items-center">
                <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-600 rounded-full">
                    <div 
                        className="absolute h-1 bg-primary-500 rounded-full"
                        style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                    ></div>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value[0]}
                        onChange={handleMinChange}
                        onMouseDown={handleMinInteraction}
                        onTouchStart={handleMinInteraction}
                        className="range-slider-input absolute w-full -top-0.5 h-2 appearance-none bg-transparent"
                        style={{
                            zIndex: minZIndex,
                            '--thumb-color': minIsActive ? activeColor : inactiveColor,
                            '--thumb-scale': minIsActive ? activeScale : inactiveScale,
                        } as React.CSSProperties}
                        aria-label={`${label} minimum`}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value[1]}
                        onChange={handleMaxChange}
                        onMouseDown={handleMaxInteraction}
                        onTouchStart={handleMaxInteraction}
                        className="range-slider-input absolute w-full -top-0.5 h-2 appearance-none bg-transparent"
                        style={{
                            zIndex: maxZIndex,
                            '--thumb-color': maxIsActive ? activeColor : inactiveColor,
                            '--thumb-scale': maxIsActive ? activeScale : inactiveScale,
                        } as React.CSSProperties}
                        aria-label={`${label} maximum`}
                    />
                </div>
            </div>
        </div>
    );
};