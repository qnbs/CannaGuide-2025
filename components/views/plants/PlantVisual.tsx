import React from 'react';
// FIX: Correct import path for types.
import { PlantStage, JournalEntry, PlantProblem } from '../../../types';
import { PLANT_STAGE_DETAILS } from '../../../constants';

interface PlantVisualProps {
  stage: PlantStage;
  age: number;
  stress: number;
  water: number;
  trainingHistory?: JournalEntry[];
  problems: PlantProblem[];
}

const Leaf: React.FC<{ fingers: number; color: string; rotation: number; length: number; droop: number; hasNutrientBurn: boolean; }> = ({ fingers, color, rotation, length, droop, hasNutrientBurn }) => {
  const fingerAngle = 18;
  const startAngle = -((fingers - 1) / 2) * fingerAngle;

  const fingerPath = (l: number) => `M 0 0 C ${l*0.2} ${-l*0.3}, ${l*0.6} ${-l*0.8}, ${l*0.9} ${-l} L ${l*0.95} ${-l*0.95} L ${l} ${-l*0.9} C ${l*0.7} ${-l*0.7}, ${l*0.3} ${-l*0.2}, 0 0 z`;

  return (
    <g transform={`rotate(${rotation})`}>
      <g transform={`rotate(${droop}) scale(1, ${1 - droop/150})`} style={{ transition: 'transform 0.5s ease' }}>
        {Array.from({ length: fingers }).map((_, i) => {
           const angle = startAngle + i * fingerAngle;
           const currentLength = length * (1 - Math.abs(i - (fingers - 1) / 2) * 0.2);
          return (
             <g key={i} transform={`rotate(${angle})`}>
                <path
                  d={fingerPath(currentLength)}
                  fill={color}
                  style={{ transition: 'fill 0.5s ease' }}
                />
                {hasNutrientBurn && (
                  <path
                    d={`M ${currentLength*0.8} ${-currentLength*0.9} L ${currentLength} ${-currentLength*0.9} L ${currentLength*0.9} ${-currentLength} Z`}
                    fill="rgba(139, 69, 19, 0.7)"
                    style={{ transition: 'opacity 0.5s ease', opacity: 1 }}
                  />
                )}
             </g>
          )
        })}
      </g>
    </g>
  );
};


export const PlantVisual: React.FC<PlantVisualProps> = ({ stage, age, stress, water, trainingHistory = [], problems = [] }) => {
  const getScale = () => {
    switch (stage) {
      case PlantStage.Seed: return 0.2;
      case PlantStage.Germination: return 0.25 + (age / 5) * 0.1; // Age 1-5
      case PlantStage.Seedling: return 0.35 + ((age - 5) / 14) * 0.25; // Age 6-19
      case PlantStage.Vegetative: return 0.6 + ((age - 19) / 42) * 0.4; // Age 20-61
      case PlantStage.Flowering: return 1.0;
      case PlantStage.Harvest:
      case PlantStage.Drying:
      case PlantStage.Curing:
      case PlantStage.Finished:
        return 1.0;
      default: return 0.1;
    }
  };

  const isTopped = trainingHistory.some(e => e.details?.trainingType === 'Topping');
  const hasNutrientBurn = problems.some(p => p.type === 'NutrientBurn');

  const getLeafSets = () => {
    if (stage === PlantStage.Seed || stage === PlantStage.Germination) return 0;
    if (stage === PlantStage.Seedling) return 1;
    if (stage === PlantStage.Vegetative) return Math.min(isTopped ? 7 : 5, 1 + Math.floor((age - 19) / 8));
    if (stage === PlantStage.Flowering || stage === PlantStage.Harvest) return isTopped ? 8 : 6;
    return 0;
  }
  
  const getFingersPerLeaf = (setIndex: number) => {
      const progression = Math.floor(age / 10);
      if (setIndex === 0) return Math.min(3, 1 + progression);
      if (setIndex === 1) return Math.min(5, progression);
      if (setIndex < 4) return Math.min(7, progression-1);
      return 7;
  }
  
  const scale = getScale();
  const leafSets = getLeafSets();
  
  const colorInterpolator = (t: number) => {
      const h1 = 120, s1 = 80, l1 = 30; // Healthy green
      const h2 = 50, s2 = 40, l2 = 40; // Stressed yellow/brown
      const h = h1 + t * (h2 - h1);
      const s = s1 + t * (s2 - s1);
      const l = l1 + t * (l2 - l1);
      return `hsl(${h}, ${s}%, ${l}%)`;
  }
  const leafColor = colorInterpolator(stress / 100);

  const hasBuds = stage === PlantStage.Flowering || stage === PlantStage.Harvest;
  const budDevelopment = hasBuds ? (age - (PLANT_STAGE_DETAILS[PlantStage.Vegetative].duration + PLANT_STAGE_DETAILS[PlantStage.Seedling].duration + PLANT_STAGE_DETAILS[PlantStage.Germination].duration)) / PLANT_STAGE_DETAILS[PlantStage.Flowering].duration : 0;

  const stemHeight = isTopped ? 35 : 45;
  const isDrooping = water < 20 && stage !== PlantStage.Drying && stage !== PlantStage.Curing;

  const leafElements = Array.from({ length: leafSets }).map((_, i) => {
      const yPos = (stemHeight / leafSets) * i;
      const rotation = i % 2 === 0 ? 90 + (i*10) : -90 - (i*10);
      const fingers = getFingersPerLeaf(i);
      const droop = isDrooping ? (i % 2 === 0 ? 25 : -25) : 0;
      return (
        <g key={i} transform={`translate(0, ${stemHeight - yPos - 10})`}>
          <Leaf fingers={fingers} color={leafColor} rotation={rotation} length={20 + i*3} droop={droop} hasNutrientBurn={hasNutrientBurn} />
        </g>
      )
  });
  
  const budElements = hasBuds ? Array.from({length: 5 + leafSets}).map((_, i) => {
      const yPos = (stemHeight / (5+leafSets)) * i;
      const xPos = i > 0 ? (i%2 === 0 ? -1 : 1) * (2 + Math.random() * 2 * budDevelopment) : 0;
      const baseRadius = 1 + budDevelopment * 8;
      const pistilCount = Math.floor(budDevelopment * 10);
      return (
          <g key={i} transform={`translate(${xPos}, ${stemHeight - yPos -5}) scale(${Math.max(0.2, 1-yPos/stemHeight)})`}>
              <circle r={baseRadius} fill={leafColor} opacity="0.7" />
              {Array.from({length: pistilCount}).map((_, p) => {
                  const angle = p * (360 / pistilCount) + i*20;
                  return <line key={p} x1="0" y1="0" x2={baseRadius} y2="0" transform={`rotate(${angle})`} stroke="white" strokeWidth="0.5" opacity="0.9" />
              })}
          </g>
      )
  }) : null;

  return (
    <div className="w-full h-48 md:h-full flex items-center justify-center">
      <svg viewBox="-50 -5 100 60" className="w-full h-full">
        {stage !== PlantStage.Seed && stage !== PlantStage.Drying && stage !== PlantStage.Curing && (
          <g transform={`scale(${scale}) translate(0, 50) scale(1, -1)`} style={{ transition: 'transform 0.5s ease' }}>
            <path d={`M 0 0 Q -5 ${stemHeight * 0.5}, 0 ${stemHeight}`} stroke="#5a452c" strokeWidth="3" fill="none" />
             {isTopped && <path d={`M -5 ${stemHeight+2} L 5 ${stemHeight-2}`} stroke="#4a3a20" strokeWidth="1.5" />}
             {leafElements}
             {budElements}
          </g>
        )}
        {stage === PlantStage.Seed && <circle cx="0" cy="25" r="5" fill="#8B4513" />}
        {(stage === PlantStage.Drying || stage === PlantStage.Curing) && 
            <g transform="scale(0.8) translate(0, 25)">
                 <path d="M-15,0 L-5,-20 L0,-15 L5,-20 L15,0 L5,10 L0,5 L-5,10 Z" fill="#7C4700"/>
            </g>
        }
      </svg>
    </div>
  );
};
