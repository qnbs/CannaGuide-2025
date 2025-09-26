import React, { memo } from 'react';
import { Plant } from '@/types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { selectGardenHealthMetrics } from '@/stores/selectors';

interface GardenVitalsProps {
    openTasksCount: number;
    onWaterAll: () => void;
}

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
    <div className="text-center">
        <div className="text-2xl text-primary-400 mx-auto w-10 h-10 flex items-center justify-center">{icon}</div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
    </div>
);

export const GardenVitals: React.FC<GardenVitalsProps> = memo(({ openTasksCount, onWaterAll }) => {
    const { t } = useTranslations();
    const { gardenHealth, activePlantsCount, avgTemp, avgHumidity } = useAppStore(state => selectGardenHealthMetrics(state));
    const hasActiveGrows = activePlantsCount > 0;

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400">{t('plantsView.gardenVitals.title')}</h3>
            <div className="grid grid-cols-4 gap-4 my-4">
                <Stat icon={<PhosphorIcons.Heart weight="fill" />} value={`${Math.round(gardenHealth)}%`} label={t('plantsView.summary.gardenHealth')} />
                <Stat icon={<PhosphorIcons.Plant />} value={activePlantsCount.toString()} label={t('plantsView.summary.activeGrows')} />
                <Stat icon={<PhosphorIcons.Thermometer />} value={`${avgTemp.toFixed(1)}°`} label={t('plantsView.gardenVitals.avgTemp')} />
                <Stat icon={<PhosphorIcons.Drop />} value={`${avgHumidity.toFixed(1)}%`} label={t('plantsView.gardenVitals.avgHumidity')} />
            </div>
             <div className="mt-4">
                <Button onClick={onWaterAll} variant="secondary" disabled={!hasActiveGrows} className="w-full">
                    <PhosphorIcons.Drop className="w-5 h-5 mr-1"/> {t('plantsView.summary.waterAll')}
                </Button>
            </div>
        </Card>
    );
});

export { GardenVitals as DashboardSummary };