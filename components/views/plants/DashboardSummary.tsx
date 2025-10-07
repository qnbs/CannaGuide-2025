import React, { memo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectGardenHealthMetrics } from '@/stores/selectors';
import { waterAllPlants } from '@/stores/slices/simulationSlice';

interface GardenVitalsProps {
    openTasksCount: number;
}

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
    <div className="text-center">
        <div className="text-primary-400 mx-auto w-8 h-8 flex items-center justify-center">{icon}</div>
        <p className="text-2xl font-bold font-display text-slate-100">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
    </div>
);

export const GardenVitals: React.FC<GardenVitalsProps> = memo(({ openTasksCount }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { gardenHealth, activePlantsCount, avgTemp, avgHumidity } = useAppSelector(selectGardenHealthMetrics);
    const hasActiveGrows = activePlantsCount > 0;

    const handleWaterAll = () => {
        dispatch(waterAllPlants());
    };

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-300 mb-4">{t('plantsView.gardenVitals.title')}</h3>
            <div className="grid grid-cols-4 gap-4 my-4">
                <Stat icon={<PhosphorIcons.Heart weight="fill" />} value={`${Math.round(gardenHealth)}%`} label={t('plantsView.summary.gardenHealth')} />
                <Stat icon={<PhosphorIcons.Plant />} value={activePlantsCount.toString()} label={t('plantsView.summary.activeGrows')} />
                <Stat icon={<PhosphorIcons.Thermometer />} value={`${avgTemp.toFixed(1)}°`} label={t('plantsView.gardenVitals.avgTemp')} />
                <Stat icon={<PhosphorIcons.Drop />} value={`${avgHumidity.toFixed(1)}%`} label={t('plantsView.gardenVitals.avgHumidity')} />
            </div>
             <div className="mt-4 border-t border-slate-700 pt-4">
                <Button onClick={handleWaterAll} variant="secondary" disabled={!hasActiveGrows} className="w-full">
                    <PhosphorIcons.Drop className="w-5 h-5 mr-1"/> {t('plantsView.summary.waterAll')}
                </Button>
            </div>
        </Card>
    );
});

export { GardenVitals as DashboardSummary };