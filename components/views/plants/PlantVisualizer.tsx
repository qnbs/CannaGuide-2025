import React, { memo } from 'react';
import { Plant, PlantStage } from '@/types';

interface PlantVisualizerProps {
    plant: Plant;
    className?: string;
}

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    if (inMin === inMax) return outMin;
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export const PlantVisualizer: React.FC<PlantVisualizerProps> = memo(({ plant, className }) => {
    const { stage, height, stressLevel, structuralModel, isTopped, biomass } = plant;
    const healthFactor = (100 - stressLevel) / 100;

    const isDrying = [PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(stage);
    const leafColor = isDrying ? `rgba(180, 160, 100, ${healthFactor})` : `rgba(var(--color-accent-500), ${mapRange(healthFactor, 0, 1, 0.4, 1)})`;
    const stemColor = isDrying ? `rgba(130, 110, 70, ${healthFactor})` : `rgba(var(--color-primary-500), ${mapRange(healthFactor, 0, 1, 0.5, 1)})`;

    let scale = 1;
    let yOffset = 0;
    if (stage === PlantStage.Seed) { scale = 0.2; yOffset = 18; }
    else if (stage === PlantStage.Germination) { scale = 0.3; yOffset = 16; }
    else if (stage === PlantStage.Seedling) { scale = 0.5; yOffset = 12; }
    else if (isDrying) { scale = 0.9; yOffset = 2; }
    
    const stemBaseHeight = 20;
    const heightScale = Math.min(1, height / 100);
    const stemHeight = stage === PlantStage.Vegetative || stage === PlantStage.Flowering ? Math.max(8, stemBaseHeight * heightScale) : 4;
    const numLeafPairs = Math.min(6, Math.floor(structuralModel.nodes / 2));

    const stemPath = isTopped
        ? `M12 22 V${22 - stemHeight * 0.7} M12 ${22 - stemHeight * 0.7} L10 ${22 - stemHeight} M12 ${22 - stemHeight * 0.7} L14 ${22 - stemHeight}`
        : `M12 22 V${22 - stemHeight}`;

    const leaves = [];
    const topOffset = isTopped ? 0.7 : 1;
    for (let i = 1; i <= numLeafPairs; i++) {
        const y = 22 - (i / numLeafPairs) * stemHeight * topOffset;
        const leafSize = mapRange(i, 1, numLeafPairs, 3, 8);
        leaves.push(
            <path key={`l-${i}`} d={`M12 ${y} C ${12 - leafSize} ${y}, ${12 - leafSize*1.2} ${y - leafSize * 0.8}, ${12 - leafSize*1.5} ${y-leafSize*1.2}`} stroke={leafColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />,
            <path key={`r-${i}`} d={`M12 ${y} C ${12 + leafSize} ${y}, ${12 + leafSize*1.2} ${y - leafSize * 0.8}, ${12 + leafSize*1.5} ${y-leafSize*1.2}`} stroke={leafColor} fill="none" strokeWidth="1.5" strokeLinecap="round" />
        );
    }
    
    const showBuds = [PlantStage.Flowering, PlantStage.Harvest].includes(stage);
    const budColor = `rgba(var(--color-secondary-500), ${stage === PlantStage.Harvest ? 1 : 0.8})`;
    const budSize = mapRange(biomass.flowers, 0, 100, 0.5, 2.5);
    const buds = [];
    if (showBuds) {
        if(isTopped) {
            buds.push(<circle key="bt1" cx="10" cy={22 - stemHeight} r={budSize * 1.2} fill={budColor} />);
            buds.push(<circle key="bt2" cx="14" cy={22 - stemHeight} r={budSize * 1.2} fill={budColor} />);
        } else {
            buds.push(<circle key="bt" cx="12" cy={22 - stemHeight} r={budSize * 1.5} fill={budColor} />);
        }
        for (let i = 1; i <= numLeafPairs; i++) {
            const y = 22 - (i / numLeafPairs) * stemHeight * topOffset;
            buds.push(<circle key={`bl-${i}`} cx={12} cy={y} r={budSize * (i / numLeafPairs)} fill={budColor} />);
        }
    }

    if (stage === PlantStage.Seed || stage === PlantStage.Germination) {
        return (
             <div className={`group ${className}`}>
                <svg viewBox="0 0 24 24" className="w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
                    <g transform={`scale(${scale}) translate(0, ${yOffset})`}>
                       {stage === PlantStage.Seed ? (
                           <path d="M12 16 A 4 2 0 0 0 12 12 A 4 2 0 0 0 12 16 Z" fill="#A16207"/>
                       ) : (
                           <>
                            <path d="M12 16 A 4 2 0 0 0 12 12 A 4 2 0 0 0 12 16 Z" fill="#A16207" opacity="0.6"/>
                            <path d="M12 14 V10" stroke={stemColor} strokeWidth="2" strokeLinecap="round"/>
                            <path d="M12 10 C 10 10 8 9 7 7" stroke={leafColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            <path d="M12 10 C 14 10 16 9 17 7" stroke={leafColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                           </>
                       )}
                    </g>
                </svg>
            </div>
        );
    }

    return (
        <div className={`group ${className}`}>
            <svg viewBox="0 0 24 24" className="w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
                <g transform={`scale(${scale}) translate(0, ${yOffset})`}>
                    <path d={stemPath} stroke={stemColor} strokeWidth="1.5" strokeLinecap="round" />
                    {leaves}
                    {buds}
                </g>
            </svg>
        </div>
    );
});