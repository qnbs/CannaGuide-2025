import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface DashboardSummaryProps { 
    activePlantsCount: number, 
    openTasksCount: number, 
    onStartGrow: () => void,
    onWaterAll: () => void
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ activePlantsCount, openTasksCount, onStartGrow, onWaterAll }) => {
    const { t } = useTranslations();
    return (
        <Card>
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">{t('plantsView.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{t('plantsView.welcome')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{activePlantsCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('plantsView.summary.activeGrows')}</p>
                </div>
                <div className="p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{openTasksCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('plantsView.summary.openTasks')}</p>
                </div>
                 <div className="p-3 flex items-center justify-center">
                    <Button onClick={onWaterAll} variant="secondary" disabled={activePlantsCount === 0} className="w-full">
                        <PhosphorIcons.Drop className="inline w-5 h-5 mr-1.5"/>
                        {t('plantsView.summary.waterAll')}
                    </Button>
                </div>
                 <div className="p-3 flex items-center justify-center">
                    <Button onClick={onStartGrow} disabled={activePlantsCount >= 3} className="w-full">
                        <PhosphorIcons.PlusCircle className="inline w-5 h-5 mr-1.5"/>
                        {t('plantsView.summary.addPlant')}
                    </Button>
                </div>
            </div>
        </Card>
    )
}