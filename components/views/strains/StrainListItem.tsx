import React, { memo, useCallback } from 'react';
import { Strain, StrainType, DifficultyLevel } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectHasAvailableSlots } from '@/stores/selectors';
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice';
import { Card } from '@/components/common/Card';

interface StrainListItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    style?: React.CSSProperties;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-8 h-8 text-amber-400" />,
    [StrainType.Indica]: <IndicaIcon className="w-8 h-8 text-indigo-400" />,
    [StrainType.Hybrid]: <HybridIcon className="w-8 h-8 text-blue-400" />,
};

const Stat: React.FC<{ value: React.ReactNode; className?: string }> = ({ value, className }) => (
    <div className={`hidden sm:flex items-center justify-center text-sm font-mono text-slate-200 ${className || ''}`}>
        {value}
    </div>
);

const DifficultyRating: React.FC<{ difficulty: DifficultyLevel }> = ({ difficulty }) => {
    const { t } = useTranslation();
    const level = { Easy: 1, Medium: 2, Hard: 3 }[difficulty];
    const color = { Easy: 'text-green-400', Medium: 'text-amber-400', Hard: 'text-red-400' }[difficulty];
    return (
        <div className="flex gap-0.5 items-center justify-center" title={t(`strainsView.difficulty.${difficulty.toLowerCase()}`)}>
            {[...Array(3)].map((_, i) => (
                <PhosphorIcons.Cannabis key={i} weight="fill" className={`w-4 h-4 ${i < level ? color : 'text-slate-600'}`} />
            ))}
        </div>
    );
};

const gridLayout = "grid items-center gap-x-4 grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_minmax(0,2.5fr)_repeat(6,minmax(0,1fr))_auto]";

export const StrainListItem: React.FC<StrainListItemProps> = memo(({
    strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete,
    style, isFavorite, onToggleFavorite
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);

    const handleStartGrow = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(initiateGrowFromStrainList(strain));
    };

    return (
        <Card
            style={style}
            className={`!py-2 !px-0 cursor-pointer transition-all duration-200 animate-fade-in-stagger ${isSelected ? 'bg-primary-900/40 ring-2 ring-primary-500' : ''}`}
            onClick={() => onSelect(strain)}
            aria-label={`View details for ${strain.name}`}
        >
            <div className={gridLayout}>
                {/* Checkbox */}
                <div className="flex-shrink-0 pl-4" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(strain.id)}
                        className="h-5 w-5"
                        aria-label={`Select ${strain.name}`}
                    />
                </div>

                {/* Main Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">{typeIcons[strain.type]}</div>
                    <div className="min-w-0">
                        <p className="font-bold text-slate-100 truncate flex items-center gap-2">
                            {strain.name}
                            {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                        </p>
                        <p className="text-xs text-slate-400">{strain.type}</p>
                    </div>
                </div>
                
                {/* Mobile-only Actions (moved for grid layout) */}
                <div className="flex items-center gap-0 ml-auto pr-2 sm:hidden">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="!p-2 rounded-full"
                        onClick={handleStartGrow}
                        disabled={!hasAvailableSlots}
                        aria-label={hasAvailableSlots ? `${t('strainsView.startGrowing')} ${strain.name}` : t('plantsView.notifications.allSlotsFull')}
                    >
                        <PhosphorIcons.Plant className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`!p-2 rounded-full favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                        aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    >
                        <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                    </Button>
                </div>

                {/* Desktop-only stats */}
                <Stat value={strain.type} />
                <Stat value={`${strain.thc?.toFixed(1)}%`} />
                <Stat value={`${strain.cbd?.toFixed(1)}%`} />
                <Stat value={`${strain.floweringTimeRange || strain.floweringTime} w`} />
                <Stat value={t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`)} />
                <Stat value={<DifficultyRating difficulty={strain.agronomic.difficulty} />} />
                
                {/* Desktop-only Actions */}
                <div className="hidden sm:flex items-center gap-0 ml-auto pr-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="!p-2 rounded-full"
                        onClick={handleStartGrow}
                        disabled={!hasAvailableSlots}
                        aria-label={hasAvailableSlots ? `${t('strainsView.startGrowing')} ${strain.name}` : t('plantsView.notifications.allSlotsFull')}
                    >
                        <PhosphorIcons.Plant className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`!p-2 rounded-full favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                        aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    >
                        <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                    </Button>
                    {isUserStrain && (
                        <Button variant="ghost" size="sm" className="!p-2 text-red-400 hover:bg-red-500/20 rounded-full" onClick={(e) => { e.stopPropagation(); onDelete(strain.id); }} aria-label={`Delete ${strain.name}`}>
                            <PhosphorIcons.TrashSimple className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
});