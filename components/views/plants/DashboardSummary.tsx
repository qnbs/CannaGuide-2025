import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { Plant } from '../../../types';

interface GardenVitalsProps { 
    plants: Plant[];
    openTasksCount: number;
    onWaterAll: () => void;
    onAdvanceDay: () => void;
}

export const GardenVitals: React.FC<GardenVitalsProps> = ({ plants, openTasksCount, onWaterAll, onAdvanceDay }) => {
    const { t } = useTranslations();
    
    const activePlantsCount = plants.length;
    const avgStress = activePlantsCount > 0 ? plants.reduce((sum, p) => sum + p.stressLevel, 0) / activePlantsCount : 0;
    const gardenHealth = Math.max(0, 100 - avgStress);

    const avgTemp = activePlantsCount > 0 ? plants.reduce((sum, p) => sum + p.environment.temperature, 0) / activePlantsCount : 0;
    const avgHumidity = activePlantsCount > 0 ? plants.reduce((sum, p) => sum + p.environment.humidity, 0) / activePlantsCount : 0;
    
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (gardenHealth / 100) * circumference;

    let healthColor = 'stroke-green-400';
    if (gardenHealth < 75) healthColor = 'stroke-yellow-400';
    if (gardenHealth < 50) healthColor = 'stroke-red-400';
    
    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-4">
                <PhosphorIcons.ChartPieSlice className="w-6 h-6"/>
                {t('plantsView.gardenVitals.title')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center">
                     <div className="relative w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="56" cy="56" />
                            <circle
                                className={`transition-all duration-500 ${healthColor}`}
                                strokeWidth="10"
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
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-3">
                            <p className="text-3xl font-bold">{gardenHealth.toFixed(0)}%</p>
                            <p className="text-xs text-slate-400 -mt-1">{t('plantsView.summary.gardenHealth')}</p>
                        </div>
                    </div>

                <div className="space-y-3 text-center">
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <p className="text-2xl font-bold text-primary-400">{activePlantsCount}</p>
                        <p className="text-xs text-slate-400">{t('plantsView.summary.activeGrows')}</p>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <p className="text-2xl font-bold text-primary-400">{openTasksCount}</p>
                        <p className="text-xs text-slate-400">{t('plantsView.summary.openTasks')}</p>
                    </div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <p className="text-lg font-bold">{activePlantsCount > 0 ? avgTemp.toFixed(1) : '--'}°C</p>
                        <p className="text-xs text-slate-400">{t('plantsView.gardenVitals.avgTemp')}</p>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg">
                        <p className="text-lg font-bold">{activePlantsCount > 0 ? avgHumidity.toFixed(1) : '--'}%</p>
                        <p className="text-xs text-slate-400">{t('plantsView.gardenVitals.avgHumidity')}</p>
                    </div>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-2">
                <Button onClick={onWaterAll} disabled={activePlantsCount === 0} className="flex-1" variant="secondary">
                    <PhosphorIcons.Drop className="inline w-5 h-5 mr-1.5"/>
                    {t('plantsView.summary.waterAll')}
                </Button>
                <Button onClick={onAdvanceDay} disabled={activePlantsCount === 0} className="flex-1">
                    <PhosphorIcons.ArrowClockwise className="inline w-5 h-5 mr-1.5"/>
                    {t('plantsView.summary.simulateNextDay')}
                </Button>
            </div>
        </Card>
    );
};