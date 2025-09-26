import React from 'react';
import { Plant } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface PostHarvestTabProps {
    plant: Plant;
}

export const PostHarvestTab: React.FC<PostHarvestTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const postHarvestData = plant.postHarvest;

    const stats = [
        { label: 'Wet Weight', value: postHarvestData?.wetWeight, unit: 'g', icon: <PhosphorIcons.Drop /> },
        { label: 'Dry Weight', value: postHarvestData?.dryWeight, unit: 'g', icon: <PhosphorIcons.Leafy /> },
        { label: 'Yield per Watt', value: postHarvestData?.yieldPerWatt, unit: 'g/W', icon: <PhosphorIcons.Sun /> },
        { label: 'Quality Rating', value: postHarvestData?.qualityRating, unit: '/10', icon: <PhosphorIcons.Star /> },
    ];

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">Post-Harvest Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <Card key={stat.label} className="text-center bg-slate-800">
                        <div className="text-3xl text-primary-400 mx-auto w-12 h-12 flex items-center justify-center">
                            {stat.icon}
                        </div>
                        <p className="text-2xl font-bold mt-2">{stat.value?.toFixed(2) ?? '--'}<span className="text-base font-normal">{stat.unit}</span></p>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                    </Card>
                ))}
            </div>
        </Card>
    );
};
