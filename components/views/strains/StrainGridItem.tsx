

import React from 'react';
// FIX: Correct import path for types.
import { Strain } from '../../../types';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { Card } from '../../common/Card';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { Button } from '../../common/Button';

interface StrainGridItemProps {
    strain: Strain;
    isFavorite: boolean;
    onSelect: (strain: Strain) => void;
    onToggleFavorite: (id: string) => void;
    isUserStrain?: boolean;
    onEdit?: (strain: Strain) => void;
    onDelete?: (id: string) => void;
    index: number;
}

const StrainGridItem: React.FC<StrainGridItemProps> = ({
    strain,
    isFavorite,
    onSelect,
    onToggleFavorite,
    isUserStrain = false,
    onEdit,
    onDelete,
    index,
}) => {
    const { t } = useTranslations();
    
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-500', Indica: 'text-indigo-500', Hybrid: 'text-blue-500' };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <Card 
            className="flex flex-col h-full cursor-pointer group relative hover:border-primary-500/50 transition-all p-3 animate-fade-in-stagger"
            style={{ animationDelay: `${index * 30}ms` }}
            onClick={() => onSelect(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(strain); } }}
            role="button"
            tabIndex={0}
        >
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                 {isUserStrain && onEdit && onDelete && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onEdit(strain))} aria-label={t('common.edit')}>
                            <PhosphorIcons.PencilSimple className="w-4 h-4" />
                            <span className="sr-only">{t('common.edit')}</span>
                        </Button>
                        <Button variant="danger" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onDelete(strain.id))} aria-label={t('common.delete')}>
                            <PhosphorIcons.TrashSimple className="w-4 h-4" />
                             <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                    </div>
                )}
                <button
                    onClick={(e) => handleActionClick(e, () => onToggleFavorite(strain.id))}
                    className={`favorite-btn-glow p-1 rounded-full bg-slate-700 text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''}`}
                    aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    aria-pressed={isFavorite}
                >
                    {/* FIX: Correct weight prop type to allow 'fill' or 'regular' */}
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-grow flex flex-col justify-between text-center">
                <div className="flex-grow">
                    <TypeIcon className={`w-12 h-12 mx-auto mb-2 ${typeClasses[strain.type]}`} />
                    <h3 className="font-bold text-base text-slate-100 truncate">{strain.name}</h3>
                    <p className="text-xs text-slate-300">{strain.type}</p>
                </div>
                
                <div className="mt-4 text-xs space-y-2">
                    <div className="flex justify-around items-center">
                        <span className="font-semibold">{t('strainsView.table.thc')}: {strain.thc.toFixed(1)}%</span>
                        <span className="font-semibold">{t('strainsView.table.cbd')}: {strain.cbd.toFixed(1)}%</span>
                    </div>
                     <div className="flex justify-center items-center gap-2" title={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}>
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default React.memo(StrainGridItem);