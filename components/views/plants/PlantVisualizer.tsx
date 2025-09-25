import React from 'react';
import { Plant } from '@/types';

interface PlantVisualizerProps {
    plant: Plant;
    className?: string;
}

export const PlantVisualizer: React.FC<PlantVisualizerProps> = ({ plant, className }) => {
    // This is a placeholder for a more complex visualizer.
    // For now, it just renders a simple representation.
    const { stage, height, stressLevel } = plant;
    const health = 1 - (stressLevel / 100);

    const baseColor = `rgba(74, 222, 128, ${0.4 + 0.6 * health})`;
    const stemColor = `rgba(139, 92, 246, ${0.5 + 0.5 * health})`;

    return (
        <svg viewBox="0 0 100 100" className={className} width="100%" height="100%">
            <defs>
                <linearGradient id="potGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A0522D" />
                    <stop offset="100%" stopColor="#8B4513" />
                </linearGradient>
            </defs>
            {/* Pot */}
            <path d="M 20 95 L 80 95 L 75 75 L 25 75 Z" fill="url(#potGradient)" />
            {/* Soil */}
            <rect x="25" y="75" width="50" height="5" fill="#5C4033" />

            {/* Plant Stem */}
            <line x1="50" y1="75" x2="50" y2={75 - (height / 2)} stroke={stemColor} strokeWidth="2" />

            {/* Leaves (simple representation) */}
            {Array.from({ length: Math.floor(height / 10) }).map((_, i) => (
                <g key={i} transform={`translate(50, ${75 - (i * 10)})`}>
                    <path d="M 0 0 C -10 -5, -20 -15, -25 -20 L 0 0" fill={baseColor} />
                    <path d="M 0 0 C 10 -5, 20 -15, 25 -20 L 0 0" fill={baseColor} />
                </g>
            ))}
        </svg>
    );
};
