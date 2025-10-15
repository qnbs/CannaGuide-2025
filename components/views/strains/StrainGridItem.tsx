import React, { memo } from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice';
import { selectHasAvailableSlots } from '@/stores/selectors';

interface StrainGridItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    index: number;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-10 h-10" />,
    [StrainType.Indica]: <IndicaIcon className="w-10 h-10" />,
    [StrainType.Hybrid]: <HybridIcon className="w-10 h-10" />,
};

const StrainGridItem: React.FC<StrainGridItemProps> = memo(({ strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete, index, isFavorite, onToggleFavorite }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);

    const handleStartGrow = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(initiateGrowFromStrainList(strain));
    };

    return (
        <Card 
            className={`flex flex-col h-full text-center relative cursor-pointer !p-3 animate-fade-in-stagger ${isSelected ? 'ring-2 ring-primary-500 bg-primary-900/40' : ''}`}
            onClick={() => onSelect(strain)}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); onToggleSelection(strain.id); }}
                    onClick={(e) => e.stopPropagation()}
                    className="custom-checkbox self-end"
                    aria-label={`Select ${strain.name}`}
                />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="!p-1.5 rounded-full"
                    onClick={handleStartGrow}
                    disabled={!hasAvailableSlots}
                    aria-label={hasAvailableSlots ? t('strainsView.startGrowing') : t('plantsView.notifications.allSlotsFull')}
                >
                    <PhosphorIcons.Plant className="w-4 h-4" />
                </Button>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`!p-1.5 rounded-full favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                 >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                </Button>
                 {isUserStrain && (
                    <Button variant="danger" size="sm" className="!p-1.5 rounded-full" onClick={(e) => { e.stopPropagation(); onDelete(strain.id); }} aria-label={`Delete ${strain.name}`}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                )}
            </div>
            
            {isUserStrain && <span className="absolute top-2 left-2" title={t('strainsView.tabs.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-accent-400" /></span>}

            <div className="mx-auto mb-2">
                {typeIcons[strain.type]}
            </div>

            <h3 className="font-bold text-slate-100 truncate">{strain.name}</h3>
            <p className="text-xs text-slate-400 mb-2">{strain.type}</p>

            <div className="mt-auto text-xs grid grid-cols-1 gap-1 font-mono">
                <div className="bg-slate-700/50 rounded p-1">{t('strainsView.table.thc')}: {strain.thc?.toFixed(1)}%</div>
                <div className="bg-slate-700/50 rounded p-1">
                    {strain.floweringTimeRange || strain.floweringTime} w
                </div>
            </div>
        </Card>
    );
});

export default StrainGridItem;