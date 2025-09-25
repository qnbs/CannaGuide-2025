import React from 'react';
import { Plant, PlantShoot, PlantNode } from '@/types';

interface PlantVisualizerProps {
    plant: Plant;
    className?: string;
}

const SHOOT_COLOR = '#8B5CF6'; // A purple stem color
const LEAF_COLOR = '#22C55E'; // A vibrant green

const SvgShoot: React.FC<{ shoot: PlantShoot, parentX: number, parentY: number }> = ({ shoot, parentX, parentY }) => {
    // Base line for the shoot itself
    const endX = parentX + shoot.length * Math.sin(shoot.angle * Math.PI / 180);
    const endY = parentY - shoot.length * Math.cos(shoot.angle * Math.PI / 180);

    return (
        <g>
            <line x1={parentX} y1={parentY} x2={endX} y2={endY} stroke={SHOOT_COLOR} strokeWidth="2" strokeLinecap="round" />
            
            {/* Render nodes along this shoot */}
            {shoot.nodes.map(node => {
                const nodeX = parentX + node.position * (endX - parentX);
                const nodeY = parentY + node.position * (endY - parentY);
                return <SvgNode key={node.id} node={node} x={nodeX} y={nodeY} />;
            })}
        </g>
    );
};

const SvgNode: React.FC<{ node: PlantNode, x: number, y: number }> = ({ node, x, y }) => {
    // A simple representation for a leaf at each node
    const leafSize = 5 * node.lightExposure; // Leaf size depends on light
    
    return (
        <g>
            <circle cx={x} cy={y} r="1.5" fill={SHOOT_COLOR} />
            {/* Simple leaves */}
            <path d={`M${x},${y} Q${x - leafSize},${y - leafSize} ${x - (leafSize * 2)},${y}`} stroke={LEAF_COLOR} fill="none" strokeWidth="1" />
            <path d={`M${x},${y} Q${x + leafSize},${y - leafSize} ${x + (leafSize * 2)},${y}`} stroke={LEAF_COLOR} fill="none" strokeWidth="1" />

            {/* Recursively render shoots originating from this node */}
            {node.shoots.map(shoot => (
                <SvgShoot key={shoot.id} shoot={shoot} parentX={x} parentY={y} />
            ))}
        </g>
    );
};


export const PlantVisualizer: React.FC<PlantVisualizerProps> = ({ plant, className }) => {
    if (!plant.structuralModel) {
        return <div>No structural data available.</div>;
    }

    const { structuralModel } = plant;
    
    // Determine viewBox to fit the plant dynamically
    const allPoints: { x: number, y: number }[] = [];
    const traverse = (shoot: PlantShoot, parentX: number, parentY: number) => {
        const endX = parentX + shoot.length * Math.sin(shoot.angle * Math.PI / 180);
        const endY = parentY - shoot.length * Math.cos(shoot.angle * Math.PI / 180);
        allPoints.push({ x: parentX, y: parentY }, { x: endX, y: endY });

        shoot.nodes.forEach(node => {
            const nodeX = parentX + node.position * (endX - parentX);
            const nodeY = parentY + node.position * (endY - parentY);
            allPoints.push({x: nodeX, y: nodeY});
            node.shoots.forEach(childShoot => traverse(childShoot, nodeX, nodeY));
        });
    };

    traverse(structuralModel, 50, 100);

    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    
    const viewBoxWidth = Math.max(50, (maxX - minX) * 1.2);
    const viewBoxHeight = Math.max(50, (100 - minY) * 1.1);
    const viewBoxX = minX - (viewBoxWidth - (maxX - minX)) / 2;
    const viewBoxY = minY - viewBoxHeight * 0.05;

    return (
        <svg viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`} className={className} width="100%" height="100%">
            <defs>
                <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A0522D" />
                    <stop offset="100%" stopColor="#8B4513" />
                </linearGradient>
            </defs>
            {/* Pot */}
            <path d="M 40 100 L 60 100 L 58 90 L 42 90 Z" fill="url(#potGradient)" />
            {/* Soil */}
            <rect x="42" y="90" width="16" height="2" fill="#5C4033" />

            {/* Render the main stem */}
            <SvgShoot shoot={structuralModel} parentX={50} parentY={90} />
        </svg>
    );
};
