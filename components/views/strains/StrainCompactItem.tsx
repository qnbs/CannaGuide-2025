import React from 'react';
import { Strain } from '../../../types';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

interface StrainCompactItemProps {
  strain: Strain;
  isSelected: boolean;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (strainId: string) => void;
  isSelectedForExport: boolean;
  onToggleSelection: (strainId: string) => void;
}

const difficultyMap: Record<Strain['agronomic']['difficulty'], { level: number; color: string }> = {
  Easy: { level: 1, color: 'text-green-500' },
  Medium: { level: 2, color: 'text-amber-500' },
  Hard: { level: 3, color: 'text-red-500' },
};

export const StrainCompactItem: React.FC<StrainCompactItemProps> = React.memo(({ strain, isSelected, onClick, isFavorite, onToggleFavorite, isSelectedForExport, onToggleSelection }) => {
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(strain.id);
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(strain.id);
  }

  const difficulty = difficultyMap[strain.agronomic.difficulty];

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-x-3 items-center px-2 py-2 cursor-pointer transition-colors duration-150 text-sm ${
        isSelected
          ? 'bg-primary-100/50 dark:bg-primary-900/50'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/70'
      }`}
    >
        <div onClick={handleCheckboxClick}>
            <input
                type="checkbox"
                checked={isSelectedForExport}
                onChange={() => {}}
                className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500"
                aria-label={`Select ${strain.name} for export`}
            />
        </div>
        <button onClick={handleFavoriteClick} className={`favorite-btn-glow text-slate-400 hover:text-red-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label="Favorit umschalten">
            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{strain.name}</span>
          <div title={strain.type}>
            {{ 
                Sativa: <SativaIcon className="w-4 h-4 text-amber-500"/>, 
                Indica: <IndicaIcon className="w-4 h-4 text-indigo-500"/>, 
                Hybrid: <HybridIcon className="w-4 h-4 text-blue-500"/>
            }[strain.type]}
          </div>
        </div>
        
        <span className="font-mono text-center w-10">{strain.thc.toFixed(1)}%</span>
        
        <span className="text-center w-10">{strain.floweringTime}w</span>
        
        <div className="flex justify-center w-12">
            <div className="flex" title={strain.agronomic.difficulty}>
            {Array.from({ length: 3 }).map((_, i) => (
                <PhosphorIcons.Cannabis key={i} className={`w-3.5 h-3.5 ${i < difficulty.level ? difficulty.color : 'text-slate-300 dark:text-slate-600'}`} />
            ))}
            </div>
        </div>
    </div>
  );
});