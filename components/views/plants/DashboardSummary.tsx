

import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { Plant } from '../../../types';

interface DashboardSummaryProps { 
    plants: Plant[], 
    openTasksCount: number, 
    onWaterAll: () => void,
    onAdvanceDay: () => void,
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ plants, openTasksCount, onWaterAll, onAdvanceDay }) => {
    const { t } = useTranslations();
    
    const activePlantsCount = plants.length;
    const avgStress = activePlantsCount > 0 ? plants.reduce((sum, p) => sum + p.stressLevel, 0) / activePlantsCount : 0;
    const gardenHealth = Math.max(0, 100 - avgStress);

    let healthColor = 'text-green-400';
    if (gardenHealth < 75) healthColor = 'text-yellow-400';
    if (gardenHealth < 50) healthColor = 'text-red-400';

    return (
        <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary-400">{activePlantsCount}</p>
                    <p className="text-sm text-slate-400">{t('plantsView.summary.activeGrows')}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary-400">{openTasksCount}</p>
                    <p className="text-sm text-slate-400">{t('plantsView.summary.openTasks')}</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <p className={`text-3xl font-bold ${healthColor}`}>{gardenHealth.toFixed(0)}%</p>
                    <p className="text-sm text-slate-400">{t('plantsView.summary.gardenHealth')}</p>
                </div>
                 <div className="col-span-2 md:col-span-1 p-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Button onClick={onWaterAll} disabled={activePlantsCount === 0} className="w-full" variant="secondary">
                        <PhosphorIcons.Drop className="inline w-5 h-5 mr-1.5"/>
                        {t('plantsView.summary.waterAll')}
                    </Button>
                    <Button onClick={onAdvanceDay} disabled={activePlantsCount === 0} className="w-full">
                        <PhosphorIcons.ArrowClockwise className="inline w-5 h-5 mr-1.5"/>
                        {t('plantsView.summary.simulateNextDay')}
                    </Button>
                </div>
            </div>
        </Card>
    )
}