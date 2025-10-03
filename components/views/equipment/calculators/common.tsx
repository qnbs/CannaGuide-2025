import React, { useId } from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Input as PrimitiveInput, Select as PrimitiveSelect } from '@/components/ui/ThemePrimitives';

export const CalculatorSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-xl font-bold font-display text-primary-400">{title}</h3>
            <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; unit?: string; tooltip?: string }> = ({ label, unit, tooltip, ...props }) => {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1 flex items-center gap-1">
                {label}
                {tooltip && (
                    <span className="group relative">
                        <PhosphorIcons.Question className="w-4 h-4 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{tooltip}</span>
                    </span>
                )}
            </label>
            <div className="relative">
                {/* FIX: Use className prop to apply custom classes */}
                <PrimitiveInput id={id} {...props} className={props.className} />
                {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unit}</span>}
            </div>
        </div>
    );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: {value: string, label: string}[] }> = ({ label, options, ...props }) => {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
            <PrimitiveSelect id={id} options={options} {...props} />
        </div>
    );
};

export const ResultDisplay: React.FC<{ label: string; value: string; unit?: string; children?: React.ReactNode }> = ({ label, value, unit, children }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-primary-400 my-1">{value} <span className="text-xl">{unit}</span></p>
        {children}
    </div>
);
