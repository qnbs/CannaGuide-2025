import React from 'react';
import { Strain } from '../../../types';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface StrainListItemProps {
    strain: Strain;
    isSelected: boolean;
    isFavorite: boolean;
    onSelect: (strain: Strain) => void;
    onToggleSelection: (id: string) => void;
    onToggleFavorite: (id: string) => void;
}

const StrainListItem: React.FC<StrainListItemProps> = ({
    strain,
    isSelected,
    isFavorite,
    onSelect,
    onToggleSelection,
    onToggleFavorite
}) => {
    const { t } = useTranslations();
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    // Stop propagation for checkbox and favorite button to prevent row selection
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            onClick={() => onSelect(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(strain); } }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${strain.name}`}
            className={`grid grid-cols-[auto_auto_1fr_90px] gap-x-3 items-center px-2 py-2.5 cursor-pointer transition-colors duration-150 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:bg-slate-50 dark:hover:bg-slate-700`}
        >
            <input
                type="checkbox"
                aria-label={`Select ${strain.name}`}
                checked={isSelected}
                onChange={() => onToggleSelection(strain.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
            <button
                onClick={(e) => handleActionClick(e, () => onToggleFavorite(strain.id))}
                className={`favorite-btn-glow text-slate-400 hover:text-red-400 ${isFavorite ? 'is-favorite' : ''}`}
                aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                aria-pressed={isFavorite}
            >
                <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
            </button>
            <div className="min-w-0">
                <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{strain.name}</span>
            </div>
            <div className="flex justify-center" aria-label={`Difficulty: ${difficultyLabels[strain.agronomic.difficulty]}`} title={difficultyLabels[strain.agronomic.difficulty]}>
                <div className="flex">
                    {strain.agronomic.difficulty === 'Easy' && (
                        <>
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-green-500" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        </>
                    )}
                    {strain.agronomic.difficulty === 'Medium' && (
                        <>
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-amber-500" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-amber-500" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        </>
                    )}
                    {strain.agronomic.difficulty === 'Hard' && (
                        <>
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                            <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(StrainListItem);