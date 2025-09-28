import React from 'react';
import { useAppSelector } from '@/stores/store';
import { selectHighlightedElement } from '@/stores/selectors';

interface VitalBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  highlightId?: string;
}

export const VitalBar: React.FC<VitalBarProps> = ({ label, value, min, max, unit = '', highlightId }) => {
  const highlightedElement = useAppSelector(selectHighlightedElement);
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const isIdeal = value >= min && value <= max;
  const isHighlighted = highlightedElement === highlightId;

  return (
    <div 
      className={`text-center p-2 rounded-lg transition-all duration-300 ${isHighlighted ? 'animate-pulse-glow' : ''}`}
      data-highlight-id={highlightId}
    >
      <p className="text-sm font-semibold text-slate-300">{label}</p>
      <div className="w-full bg-slate-700 rounded-full h-2.5 my-1">
        <div
          className={`h-2.5 rounded-full ${isIdeal ? 'bg-green-500' : 'bg-amber-500'}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs font-mono text-slate-400">{value.toFixed(1)}{unit}</p>
    </div>
  );
};