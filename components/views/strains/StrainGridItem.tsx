import React from 'react';
import { Strain } from '../../../types';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

interface StrainGridItemProps {
  strain: Strain;
  isSelected: boolean;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: (strainId: string) => void;
  isSelectedForExport: boolean;
  onToggleSelection: (strainId: string) => void;
}

const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
    Easy: 'Einfach',
    Medium: 'Mittel',
    Hard: 'Schwer',
};

export const StrainGridItem: React.FC<StrainGridItemProps> = ({ strain, isSelected, onClick, isFavorite, onToggleFavorite, isSelectedForExport, onToggleSelection }) => {
  const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
  
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
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 flex flex-col gap-2 relative ${
        isSelected
          ? 'bg-primary-100/50 dark:bg-primary-900/50 border-primary-500 shadow-lg'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-primary-400 dark:hover:border-primary-600'
      }`}
    >
        <div className="absolute top-2 left-2" onClick={handleCheckboxClick}>
            <input
                type="checkbox"
                checked={isSelectedForExport}
                onChange={() => {}} // onChange is handled by the parent div's onClick
                className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-800"
                aria-label={`Select ${strain.name} for export`}
            />
        </div>
        <button onClick={handleFavoriteClick} className={`favorite-btn-glow absolute top-2 right-2 p-1 text-slate-400 hover:text-red-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label="Favorit umschalten">
            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
        </button>

        <div className="flex justify-between items-start pt-6">
            <h3 className="font-bold text-base text-slate-800 dark:text-white pr-8 leading-tight">{strain.name}</h3>
            <TypeIcon className="w-8 h-8 flex-shrink-0" />
        </div>
        <div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>THC</span>
                <span>{strain.thc}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full thc-bar-glow" style={{ width: `${(strain.thc / 40) * 100}%` }}></div>
            </div>
        </div>
         <div className="flex items-center justify-between text-xs font-semibold mt-auto pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1" title={`Schwierigkeit: ${difficultyLabels[strain.agronomic.difficulty]}`}>
                <PhosphorIcons.Plant className="w-4 h-4 text-green-500"/>
                <span>{difficultyLabels[strain.agronomic.difficulty]}</span>
            </div>
             <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <div title={`Blütezeit: ${strain.floweringTime} Wochen`}>
                     <PhosphorIcons.Timer className="w-4 h-4"/>
                </div>
            </div>
        </div>
    </div>
  );
};