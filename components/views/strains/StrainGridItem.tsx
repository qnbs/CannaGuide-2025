import React, { memo } from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';
import { useAppDispatch } from '@/stores/store';
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice';

interface StrainGridItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    index: number;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon />,
    [StrainType.Indica]: <IndicaIcon />,
    [StrainType.Hybrid]: <HybridIcon />,
};

const typeClasses: Record<StrainType, string> = {
    [StrainType.Sativa]: 'text-accent-400',
    [StrainType.Indica]: 'text-secondary-400',
    [StrainType.Hybrid]: 'text-primary-400',
};


const StrainGridItem: React.FC<StrainGridItemProps> = memo(({ strain, onSelect, isSelected, onToggleSelection, isUserStrain, index, isFavorite, onToggleFavorite }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <Card 
            className={`flex flex-col h-full text-center relative cursor-pointer !p-3 animate-fade-in-stagger ${isSelected ? 'ring-2 ring-primary-500 bg-primary-900/40' : ''}`}
            onClick={() => onSelect(strain)}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                 <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(strain.id)}
                    className="custom-checkbox"
                    aria-label={`Select ${strain.name}`}
                />
            </div>
            
            {isUserStrain && <span className="absolute top-2 left-2" title={t('strainsView.tabs.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400" /></span>}

            <div className={`mx-auto mb-2 w-12 h-12 ${typeClasses[strain.type]}`}>
                {typeIcons[strain.type]}
            </div>

            <h3 className="font-bold text-slate-100 truncate">{strain.name}</h3>
            <p className="text-xs text-slate-400 mb-2">{strain.type}</p>

            <div className="mt-auto text-xs grid grid-cols-2 gap-2 font-mono">
                <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1">{strain.thc?.toFixed(1)}%</div>
                <div className="bg-slate-800/70 rounded p-1 flex items-center justify-center gap-1"><PhosphorIcons.ArrowClockwise className="w-3 h-3" />{strain.floweringTimeRange || strain.floweringTime} w</div>
            </div>

            <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 z-10">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`!p-1.5 rounded-full favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={(e) => handleActionClick(e, onToggleFavorite)}
                    aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                 >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
});

export default StrainGridItem;