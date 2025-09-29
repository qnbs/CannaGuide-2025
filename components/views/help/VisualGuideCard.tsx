import React from 'react';
import { Card } from '@/components/common/Card';

interface VisualGuideCardProps {
  guideId: string;
  title: string;
  description: string;
}

const GuideVisuals: React.FC<{ guideId: string }> = ({ guideId }) => {
    switch (guideId) {
        case 'topping':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .scissors { stroke: #9ca3af; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; animation: cut-action 3s ease-in-out infinite; }
                    @keyframes cut-action {
                      0%, 20%, 100% { transform: translate(60px, 20px) rotate(30deg); }
                      40% { transform: translate(45px, 25px) rotate(10deg); }
                      50% { transform: translate(45px, 25px) rotate(10deg) scale(0.95); }
                      60%, 80% { transform: translate(60px, 20px) rotate(30deg); }
                    }
                    .cut-line { stroke: #ef4444; stroke-width: 1.5; stroke-dasharray: 3 3; animation: appear-cut 3s ease-in-out infinite; opacity: 0; }
                    @keyframes appear-cut {
                      40% { opacity: 0; }
                      50% { opacity: 1; }
                      60% { opacity: 0; }
                    }
                    .top-part { animation: fall-off 3s ease-in-out infinite; transform-origin: 50px 30px; opacity: 1; }
                    @keyframes fall-off {
                      0%, 50% { transform: rotate(0deg) translateY(0); opacity: 1; }
                      70% { transform: rotate(45deg) translate(20px, 20px); opacity: 0; }
                      100% { transform: rotate(0deg) translateY(0); opacity: 1; }
                    }
                  `}</style>
                  <g>
                    <path className="plant-stem" d="M50 90 V 30" />
                    <path className="plant-leaf" d="M50 60 C 40 55, 30 65, 30 70 Q 40 68, 50 60 Z" />
                    <path className="plant-leaf" d="M50 60 C 60 55, 70 65, 70 70 Q 60 68, 50 60 Z" />
                    <path className="plant-leaf" d="M50 45 C 42 40, 35 48, 35 52 Q 43 50, 50 45 Z" />
                    <path className="plant-leaf" d="M50 45 C 58 40, 65 48, 65 52 Q 57 50, 50 45 Z" />
                  </g>
                  <g className="top-part">
                     <path className="plant-leaf" d="M50 30 C 45 25, 40 30, 40 33 Q 45 32, 50 30 Z" />
                    <path className="plant-leaf" d="M50 30 C 55 25, 60 30, 60 33 Q 55 32, 50 30 Z" />
                  </g>
                  <line className="cut-line" x1="40" y1="30" x2="60" y2="30" />
                  <g className="scissors">
                    <circle cx="0" cy="10" r="5" />
                    <circle cx="0" cy="-10" r="5" />
                    <line x1="0" y1="10" x2="20" y2="0" />
                    <line x1="0" y1="-10" x2="20" y2="0" />
                    <line x1="20" y1="0" x2="35" y2="-5" />
                    <line x1="20" y1="0" x2="35" y2="5" />
                  </g>
                </svg>
            );
        case 'lst':
             return (
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .lst-tie { stroke: #fb923c; stroke-width: 1.5; fill: none; stroke-linecap: round; }
                    .branch { animation: bend-branch 4s ease-in-out infinite; transform-origin: 50px 70px; }
                    @keyframes bend-branch {
                      0%, 100% { transform: rotate(0deg); }
                      50%, 70% { transform: rotate(-45deg); }
                    }
                  `}</style>
                  <path className="plant-stem" d="M50 90 V 70" />
                  <g className="branch">
                    <path className="plant-stem" d="M50 70 C 60 70, 70 60, 70 50" />
                    <path className="plant-leaf" d="M70 50 C 65 45, 75 40, 78 42 Q 72 48, 70 50 Z" />
                  </g>
                  <path className="lst-tie" d="M70 50 C 75 65, 85 75, 90 70" />
                  <line className="lst-tie" x1="90" y1="70" x2="90" y2="90" />
                </svg>
            );
        case 'defoliation':
            return (
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .plant-leaf { fill: #4d7c0f; }
                    .pluck-leaf { animation: pluck-action 3s ease-in-out infinite; transform-origin: 30px 70px; opacity: 1; }
                    @keyframes pluck-action {
                      0%, 30% { transform: translateY(0); opacity: 1; }
                      50% { transform: translateY(20px) rotate(30deg); opacity: 0; }
                      100% { transform: translateY(0); opacity: 1; }
                    }
                  `}</style>
                  <path className="plant-stem" d="M50 90 V 50" />
                  <path className="plant-leaf" d="M50 60 C 60 55, 70 65, 70 70 Q 60 68, 50 60 Z" />
                  <path className="plant-leaf pluck-leaf" d="M50 60 C 40 55, 30 65, 30 70 Q 40 68, 50 60 Z" />
                </svg>
            );
        case 'harvesting':
            return (
                 <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <style>{`
                    .plant-stem { stroke: #84cc16; stroke-width: 2; fill: none; }
                    .bud { fill: #a855f7; }
                    .scissors { stroke: #9ca3af; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; animation: harvest-cut 4s ease-in-out infinite; }
                    @keyframes harvest-cut {
                      0%, 30%, 100% { transform: translate(70px, 70px) rotate(45deg); }
                      50% { transform: translate(45px, 85px) rotate(0deg); }
                      55% { transform: translate(45px, 85px) rotate(0deg) scale(0.95); }
                      70% { transform: translate(70px, 70px) rotate(45deg); }
                    }
                    .cut-line { stroke: #ef4444; stroke-width: 1.5; stroke-dasharray: 3 3; animation: appear-harvest-cut 4s ease-in-out infinite; opacity: 0; }
                     @keyframes appear-harvest-cut {
                      50% { opacity: 0; }
                      55% { opacity: 1; }
                      60% { opacity: 0; }
                    }
                  `}</style>
                  <path className="plant-stem" d="M50 90 V 30" />
                  <circle className="bud" cx="50" cy="35" r="10" />
                  <circle className="bud" cx="45" cy="50" r="8" />
                  <circle className="bud" cx="55" cy="50" r="8" />
                  <line className="cut-line" x1="40" y1="90" x2="60" y2="90" />
                  <g className="scissors">
                    <circle cx="0" cy="10" r="5" />
                    <circle cx="0" cy="-10" r="5" />
                    <line x1="0" y1="10" x2="20" y2="0" />
                    <line x1="0" y1="-10" x2="20" y2="0" />
                    <line x1="20" y1="0" x2="35" y2="-5" />
                    <line x1="20" y1="0" x2="35" y2="5" />
                  </g>
                </svg>
            );
        default:
            return null;
    }
};


export const VisualGuideCard: React.FC<VisualGuideCardProps> = ({ guideId, title, description }) => {
  return (
    <Card className="flex flex-col h-full">
      <div className="w-full h-32 bg-slate-800/50 rounded-md mb-4 flex items-center justify-center overflow-hidden">
        <GuideVisuals guideId={guideId} />
      </div>
      <h3 className="font-bold text-primary-300">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 flex-grow">{description}</p>
    </Card>
  );
};