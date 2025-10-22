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

const Leaf: React.FC<{ y: number; size: number; direction: 'left' | 'right'; rotation: number; color: string }> = ({ y, size, direction, rotation, color }) => {
    const d = direction === 'left'
        ? `M12 ${y} C ${12 - size} ${y}, ${12 - size * 1.2} ${y - size * 0.8}, ${12 - size * 1.5} ${y - size * 1.2}`
        : `M12 ${y} C ${12 + size} ${y}, ${12 + size * 1.2} ${y - size * 0.8}, ${12 + size * 1.5} ${y - size * 1.2}`;

    return (
        <path
            d={d}
            stroke={color}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${rotation}, 12, ${y})`}
        />
    );
};

const Bud: React.FC<{ cx: number; cy: number; size: number; color: string }> = ({ cx, cy, size, color }) => (
    <g>
        <circle cx={cx} cy={cy} r={size} fill={color} />
        <circle cx={cx + size * 0.3} cy={cy - size * 0.5} r={size * 0.7} fill={color} opacity="0.8" />
        <circle cx={cx - size * 0.3} cy={cy - size * 0.5} r={size * 0.7} fill={color} opacity="0.8" />
    </g>
);

export const PlantVisualizer: React.FC<PlantVisualizerProps> = memo(({ plant, className }) => {
    const { stage, height, stressLevel, structuralModel, isTopped, biomass } = plant;
    const healthFactor = (100 - stressLevel) / 100;

    const isDryingOrCuring = [PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(stage);
    const leafColor = isDryingOrCuring ? `rgba(180, 160, 100, ${healthFactor})` : `rgba(var(--color-accent-500), ${mapRange(healthFactor, 0, 1, 0.4, 1)})`;
    const stemColor = isDryingOrCuring ? `rgba(130, 110, 70, ${healthFactor})` : `rgba(var(--color-primary-500), ${mapRange(healthFactor, 0, 1, 0.5, 1)})`;

    let scale = 1;
    let yOffset = 0;
    if (stage === PlantStage.Seed) { scale = 0.2; yOffset = 18; }
    else if (stage === PlantStage.Germination) { scale = 0.3; yOffset = 16; }
    else if (stage === PlantStage.Seedling) { scale = 0.5; yOffset = 12; }
    
    // Drying/Curing Visuals
    if (isDryingOrCuring) {
        if (stage === PlantStage.Drying) {
             return (
                 <div className={`group ${className}`}>
                    <svg viewBox="0 0 24 24" className="w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
                         <g transform="translate(12, 2) rotate(180)">
                            <path d="M12 22 V 10" stroke={stemColor} strokeWidth="1.5" strokeLinecap="round" />
                            <Bud cx={12} cy={12} size={3} color={leafColor} />
                            <Bud cx={11} cy={15} size={2.5} color={leafColor} />
                            <Bud cx={13} cy={15} size={2.5} color={leafColor} />
                        </g>
                        <line x1="4" y1="2" x2="20" y2="2" stroke="grey" strokeWidth="1" />
                    </svg>
                </div>
            );
        } else { // Curing / Finished
             return (
                 <div className={`group ${className}`}>
                    <svg viewBox="0 0 24 24" className="w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
                        <path d="M6 22 L 6 9 Q 6 5, 12 5 Q 18 5, 18 9 L 18 22 Z" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.1)" strokeWidth="1"/>
                        <rect x="5" y="3" width="14" height="3" rx="1" fill="grey" />
                        <Bud cx={10} cy={18} size={1.5} color={leafColor} />
                        <Bud cx={14} cy={19} size={1.2} color={leafColor} />
                        <Bud cx={12} cy={14} size={1.8} color={leafColor} />
                        <Bud cx={15} cy={15} size={1.4} color={leafColor} />
                    </svg>
                </div>
            );
        }
    }

    const stemBaseHeight = 20;
    const heightScale = Math.min(1.5, height / 80);
    const stemHeight = stage === PlantStage.Vegetative || stage === PlantStage.Flowering ? Math.max(8, stemBaseHeight * heightScale) : 4;
    const numNodes = Math.min(8, structuralModel.nodes);
    const leafDroop = mapRange(stressLevel, 50, 100, 0, 20);

    const stemPath = isTopped
        ? `M12 22 V${22 - stemHeight * 0.7} M12 ${22 - stemHeight * 0.7} L10 ${22 - stemHeight} M12 ${22 - stemHeight * 0.7} L14 ${22 - stemHeight}`
        : `M12 22 V${22 - stemHeight}`;

    const leaves = [];
    const topOffset = isTopped ? 0.7 : 1;
    for (let i = 1; i <= numNodes; i++) {
        const y = 22 - (i / numNodes) * stemHeight * topOffset;
        const leafSize = mapRange(i, 1, numNodes, 3, 8) * Math.min(1, healthFactor + 0.2);
        leaves.push(
            <g key={`pair-${i}`}>
                <Leaf y={y} size={leafSize} direction="left" rotation={leafDroop} color={leafColor} />
                <Leaf y={y} size={leafSize} direction="right" rotation={-leafDroop} color={leafColor} />
            </g>
        );
    }
    
    const showBuds = [PlantStage.Flowering, PlantStage.Harvest].includes(stage);
    const budColor = `rgba(var(--color-secondary-500), ${stage === PlantStage.Harvest ? 1 : 0.8})`;
    const budSize = mapRange(biomass.flowers, 0, 100, 0.5, 3);
    const buds = [];
    if (showBuds) {
        if(isTopped) {
            buds.push(<Bud key="bt1" cx={10} cy={22 - stemHeight} size={budSize * 1.2} color={budColor} />);
            buds.push(<Bud key="bt2" cx={14} cy={22 - stemHeight} size={budSize * 1.2} color={budColor} />);
        } else {
            buds.push(<Bud key="bt" cx={12} cy={22 - stemHeight} size={budSize * 1.5} color={budColor} />);
        }
        for (let i = 1; i <= numNodes; i++) {
            const y = 22 - (i / numNodes) * stemHeight * topOffset;
            buds.push(<Bud key={`bl-${i}`} cx={12} cy={y} size={budSize * (i / numNodes)} color={budColor} />);
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
                            <Leaf y={10} size={4} direction="left" rotation={leafDroop} color={leafColor} />
                            <Leaf y={10} size={4} direction="right" rotation={-leafDroop} color={leafColor} />
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