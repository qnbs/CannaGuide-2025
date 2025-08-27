import React from 'react';
import { Strain } from '../../../types';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

interface StrainListItemProps {
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

export const StrainListItem: React.FC<StrainListItemProps> = ({ strain, isSelected, onClick, isFavorite, onToggleFavorite, isSelectedForExport, onToggleSelection }) => {
  const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
  const difficulty = difficultyMap[strain.agronomic.difficulty];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(strain.id);
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(strain.id);
  }

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 flex items-start gap-3 relative ${
        isSelected
          ? 'bg-primary-100/50 dark:bg-primary-900/50 border-primary-500 shadow-lg'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-primary-400 dark:hover:border-primary-600'
      }`}
    >
        <div className="flex items-center h-full pt-1" onClick={handleCheckboxClick}>
            <input
                type="checkbox"
                checked={isSelectedForExport}
                onChange={() => {}} // onChange is handled by the parent div's onClick
                className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                aria-label={`Select ${strain.name} for export`}
            />
        </div>
        <div className="flex-grow flex flex-col gap-2">
            <button onClick={handleFavoriteClick} className={`favorite-btn-glow absolute top-2 right-2 p-1 text-slate-400 hover:text-red-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label="Favorit umschalten">
                <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
            </button>

            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white pr-8">{strain.name}</h3>
                <TypeIcon className="w-8 h-8 flex-shrink-0" />
            </div>
            <div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>THC</span>
                <span>{strain.thc}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5">
                <div 
                    className="bg-red-500 h-1.5 rounded-full thc-bar-glow" 
                    style={{ width: `${(strain.thc / 40) * 100}%` }}
                ></div>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1">
                    <span className={difficulty.color}>Schwierigkeit:</span>
                    <div className="flex">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <PhosphorIcons.Cannabis key={i} className={`w-3.5 h-3.5 ${i < difficulty.level ? difficulty.color : 'text-slate-300 dark:text-slate-600'}`} />
                    ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};