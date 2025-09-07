import React from 'react';
import { Plant } from '../../../types';
import { Card } from '../../common/Card';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

interface GardenHealthProps {
    plants: Plant[];
}

export const GardenHealth: React.FC<GardenHealthProps> = ({ plants }) => {
    const { t } = useTranslations();

    const activePlantsCount = plants.length;
    if (activePlantsCount === 0) {
        return null; // Don't render if no active plants
    }

    const avgStress = activePlantsCount > 0 ? plants.reduce((sum, p) => sum + p.stressLevel, 0) / activePlantsCount : 0;
    const gardenHealth = Math.max(0, 100 - avgStress);

    let healthColor = 'text-green-400';
    let healthBg = 'bg-green-500/10';
    let healthIcon = <PhosphorIcons.Heart weight="fill" />;
    if (gardenHealth < 75) {
      healthColor = 'text-yellow-400';
      healthBg = 'bg-yellow-500/10';
      healthIcon = <PhosphorIcons.WarningCircle />;
    }
    if (gardenHealth < 50) {
      healthColor = 'text-red-400';
      healthBg = 'bg-red-500/10';
      healthIcon = <PhosphorIcons.WarningCircle weight="fill" />;
    }

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4 text-slate-100">{t('plantsView.summary.gardenHealth')}</h3>
            <div className={`p-4 ${healthBg} rounded-lg text-center`}>
                <div className={`w-12 h-12 mx-auto ${healthColor}`}>{healthIcon}</div>
                <p className={`text-4xl font-bold ${healthColor} mt-2`}>{gardenHealth.toFixed(0)}%</p>
            </div>
        </Card>
    );
};
