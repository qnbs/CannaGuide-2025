import React from 'react';
import { Plant, StructuralModel } from '../../../types';

interface PlantVisualizerProps {
    plant: Plant;
    className?: string;
}

const SHOOT_WIDTH = 2; // Base width for shoots

// A simple function to map a value from one range to another
const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const renderStructuralModel = (model: StructuralModel, health: number) => {
    const healthFactor = health / 100;
    const baseColor = `rgba(74, 222, 128, ${mapRange(healthFactor, 0, 1, 0.4, 1)})`; // Fades to less vibrant green
    const stemColor = `rgba(139, 92, 246, ${mapRange(healthFactor, 0, 1, 0.5, 1)})`; // Purple stem

    const elements: React.ReactNode[] = [];
    const nodePositions: { x: number, y: number }[] = [];
    let currentY = 0;

    // First, calculate node positions based on main stem shoots
    model.nodes.forEach((node, index) => {
        const mainShoot = model.shoots.find(s => s.nodeIndex === index && s.isMain);
        if (mainShoot) {
            currentY += mainShoot.length;
        }
        nodePositions.push({ x: 0, y: -currentY });
    });

    model.shoots.forEach((shoot, index) => {
        const startNodePos = nodePositions[shoot.nodeIndex] || { x: 0, y: 0 };
        const endX = startNodePos.x + Math.sin(shoot.angle * (Math.PI / 180)) * shoot.length;
        const endY = startNodePos.y - Math.cos(shoot.angle * (Math.PI / 180)) * shoot.length;
        
        elements.push(
            <line
                key={`shoot-${shoot.id}`}
                x1={startNodePos.x}
                y1={startNodePos.y}
                x2={endX}
                y2={endY}
                stroke={shoot.isMain ? stemColor : baseColor}
                strokeWidth={SHOOT_WIDTH}
                strokeLinecap="round"
            />
        );
    });

    return elements;
};


export const PlantVisualizer: React.FC<PlantVisualizerProps> = ({ plant, className }) => {
     const height = plant.structuralModel.shoots.reduce((max, shoot) => Math.max(max, shoot.length), 5);

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
             <svg viewBox={`-50 -${height * 1.1} 100 ${height * 1.1}`} className="w-full h-full">
                {renderStructuralModel(plant.structuralModel, plant.health)}
            </svg>
        </div>
    );
};