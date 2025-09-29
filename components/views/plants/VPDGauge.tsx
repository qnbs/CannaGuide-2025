import React, { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';

interface VPDGaugeProps {
  temperature: number; // in Celsius
  humidity: number; // in %
}

// Calculates Saturated Vapor Pressure (SVP) in kPa
const calculateSVP = (temp: number): number => {
  return 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
};

export const VPDGauge: React.FC<VPDGaugeProps> = memo(({ temperature, humidity }) => {
    const { t } = useTranslation();
    
    const vpd = useMemo(() => {
        const svp = calculateSVP(temperature);
        return svp * (1 - (humidity / 100));
    }, [temperature, humidity]);

    // Define ideal ranges for different stages (in kPa)
    const idealRanges = {
        seedling: { min: 0.4, max: 0.8, color: 'text-blue-400' },
        vegetative: { min: 0.8, max: 1.2, color: 'text-green-400' },
        flowering: { min: 1.2, max: 1.6, color: 'text-purple-400' },
        late_flower: { min: 1.4, max: 1.8, color: 'text-orange-400' }
    };

    let status = 'Outside ideal range';
    let statusColor = 'text-slate-400';

    if (vpd >= idealRanges.seedling.min && vpd < idealRanges.seedling.max) {
        status = t('plantStages.SEEDLING');
        statusColor = idealRanges.seedling.color;
    } else if (vpd >= idealRanges.vegetative.min && vpd < idealRanges.vegetative.max) {
        status = t('plantStages.VEGETATIVE');
        statusColor = idealRanges.vegetative.color;
    } else if (vpd >= idealRanges.flowering.min && vpd < idealRanges.flowering.max) {
        status = t('plantStages.FLOWERING');
        statusColor = idealRanges.flowering.color;
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    // Map VPD from 0-2 kPa to the circle circumference
    const strokeDashoffset = circumference - (Math.min(vpd, 2) / 2) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="56" cy="56" />
                    <circle
                        className={`transition-all duration-500 ${statusColor}`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="56"
                        cy="56"
                    />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-2xl font-bold">{vpd.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 -mt-1">kPa</p>
                </div>
            </div>
            <p className={`text-sm font-semibold mt-2 ${statusColor}`}>{status}</p>
        </div>
    );
});