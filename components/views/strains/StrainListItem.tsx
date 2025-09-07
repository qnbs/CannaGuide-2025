


import React from 'react';
import { Strain } from '../../../types';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { Button } from '../../common/Button';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';

interface StrainListItemProps {
    strain: Strain;
    isSelected: boolean;
    isFavorite: boolean;
    onSelect: (strain: Strain) => void;
    onToggleSelection: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    isUserStrain?: boolean;
    onEdit?: (strain: Strain) => void;
    onDelete?: (id: string) => void;
}

const listGridClass = "grid grid-cols-[auto_auto_1fr_auto_auto] sm:grid-cols-[auto_auto_minmax(120px,2fr)_minmax(80px,1fr)_70px_70px_100px_100px_auto] md:grid-cols-[auto_auto_minmax(120px,2fr)_minmax(80px,1fr)_70px_70px_100px_120px_100px_auto] gap-x-2 md:gap-x-4 items-center";

const StrainListItem: React.FC<StrainListItemProps> = ({
    strain,
    isSelected,
    isFavorite,
    onSelect,
    onToggleSelection,
    onToggleFavorite,
    isUserStrain = false,
    onEdit,
    onDelete
}) => {
    const { t } = useTranslations();
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const TypeDisplay = () => {
        const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
        const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
        if (!TypeIcon) return null;
        return <TypeIcon className={`w-6 h-6 ${typeClasses[strain.type]}`} />;
    };


    return (
        <div
            onClick={() => onSelect(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(strain); } }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${strain.name}`}
            className={`${listGridClass} px-3 py-2.5 cursor-pointer transition-colors duration-150 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:bg-slate-700 border-b border-slate-800 last:border-b-0`}
        >
            <input
                type="checkbox"
                aria-label={`Select ${strain.name}`}
                checked={isSelected}
                onChange={() => onToggleSelection(strain.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 justify-self-center"
            />
            <button
                onClick={(e) => handleActionClick(e, () => onToggleFavorite(strain.id))}
                className={`favorite-btn-glow text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''} justify-self-center`}
                aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                aria-pressed={isFavorite}
            >
                <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
            </button>
            <div className="min-w-0">
                <p className="font-semibold text-slate-100 truncate">{strain.name}</p>
                 <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
            </div>

            <div className="hidden sm:flex" title={strain.typeDetails || strain.type}>
                <TypeDisplay />
            </div>
            <div className="hidden sm:flex font-mono text-slate-200">{strain.thc.toFixed(1)}%</div>
            <div className="hidden sm:flex font-mono text-slate-400">{strain.cbd.toFixed(1)}%</div>
            <div className="hidden sm:flex text-slate-200">{strain.floweringTime} {t('strainsView.weeks')}</div>
            
            <div className="hidden md:flex text-sm text-slate-300">
                {strain.agronomic.yieldDetails?.indoor || 'N/A'}
            </div>
            
            <div className="flex" aria-label={`Difficulty: ${difficultyLabels[strain.agronomic.difficulty]}`} title={difficultyLabels[strain.agronomic.difficulty]}>
                <div className="flex">
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                </div>
            </div>
            <div className="flex items-center justify-start">
                {isUserStrain && onEdit && onDelete && (
                    <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onEdit(strain))}>
                            <PhosphorIcons.PencilSimple className="w-4 h-4" />
                            <span className="sr-only">{t('common.edit')}</span>
                        </Button>
                        <Button variant="danger" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onDelete(strain.id))}>
                            <PhosphorIcons.TrashSimple className="w-4 h-4" />
                            <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(StrainListItem);