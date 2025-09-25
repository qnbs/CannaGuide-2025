import React from 'react';

interface AttributeDisplayProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export const AttributeDisplay: React.FC<AttributeDisplayProps> = ({ label, value, valueClassName = '' }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-slate-700/50 last:border-b-0">
      <span className="font-semibold text-slate-300">{label}:</span>
      <div className={`text-slate-100 text-left sm:text-right max-w-xs ${valueClassName}`}>{value || 'N/A'}</div>
    </div>
  );
};
