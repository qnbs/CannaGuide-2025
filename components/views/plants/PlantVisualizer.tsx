import React, { memo } from 'react';
import { Plant, PlantStage } from '@/types';

interface PlantVisualizerProps {
    plant: Plant;
    className?: string;
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export const PlantVisualizer: React.FC<PlantVisualizerProps> = memo(({ plant, className }) => {
    const { stage, height, stressLevel } = plant;
    const health = 1 - (stressLevel / 100);

    const baseColor = `rgba(var(--color-accent-500), ${mapRange(health, 0, 1, 0.4, 1)})`;
    const stemColor = `rgba(var(--color-primary-500), ${mapRange(health, 0, 1, 0.5, 1)})`;

    const stageScale = {
        [PlantStage.Seed]: 0.1,
        [PlantStage.Germination]: 0.15,
        [PlantStage.Seedling]: 0.25,
        [PlantStage.Vegetative]: Math.min(1, 0.3 + (height / 80)),
        [PlantStage.Flowering]: 1,
        [PlantStage.Harvest]: 1,
        [PlantStage.Drying]: 0.9,
        [PlantStage.Curing]: 0.9,
        [PlantStage.Finished]: 0.9,
    }[stage];

    const showBuds = [PlantStage.Flowering, PlantStage.Harvest].includes(stage);
    const budColor = `rgba(var(--color-secondary-500), ${stage === PlantStage.Harvest ? 1 : 0.8})`;

    const stem = <path d="M12 22 V2" stroke={stemColor} strokeWidth="1.5" strokeLinecap="round" />;
    
    const leaves = [
        <path key="l1" d="M12 18 C 8 18, 4 16, 2 12" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
        <path key="r1" d="M12 18 C 16 18, 20 16, 22 12" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
        <path key="l2" d="M12 14 C 7 14, 3 12, 1 7" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
        <path key="r2" d="M12 14 C 17 14, 21 12, 23 7" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
        <path key="l3" d="M12 10 C 8 10, 5 8, 3 4" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
        <path key="r3" d="M12 10 C 16 10, 19 8, 21 4" stroke={baseColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
    ];

    const buds = [
        <circle key="b1" cx="12" cy="2" r="2" fill={budColor} />,
        <circle key="b2" cx="10" cy="5" r="1.5" fill={budColor} />,
        <circle key="b3" cx="14" cy="5" r="1.5" fill={budColor} />,
        <circle key="b4" cx="8" cy="9" r="1.5" fill={budColor} />,
        <circle key="b5" cx="16" cy="9" r="1.5" fill={budColor} />,
    ];

    return (
        <svg viewBox="0 0 24 24" className={className} style={{ transition: 'transform 0.5s ease' }}>
            <g transform={`scale(${stageScale}) translate(0, ${24 - 24 * stageScale})`}>
                {stem}
                {leaves}
                {showBuds && buds}
            </g>
        </svg>
    );
});