import React, { memo } from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';
import { useAppDispatch } from '@/stores/store';
import { initiateGrowFromStrainList } from '@/stores/slices/uiSlice';

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
    [StrainType.Sativa]: <SativaIcon className="w-full h-full" />,
    [StrainType.Indica]: <IndicaIcon className="w-full h-full" />,
    [StrainType.Hybrid]: <HybridIcon className="w-full h-full" />,
};

export const StrainListItem: React.FC<StrainListItemProps> = memo(({
    strain, onSelect, isSelected, onToggleSelection, isUserStrain,
    style, isFavorite, onToggleFavorite
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            style={style}
            className={`bg-slate-800/80 rounded-lg transition-all duration-200 animate-fade-in-stagger ${isSelected ? 'bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-slate-700/50'}`}
            role="row"
            aria-selected={isSelected}
            onClick={() => onSelect(strain)}
        >
            <div className="p-2 grid grid-cols-[auto_28px_1fr_auto] sm:grid-cols-[auto_28px_1fr_55px_55px_55px_auto] items-center gap-x-2">
                {/* Checkbox */}
                <div onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(strain.id)}
                        className="custom-checkbox"
                        aria-label={`Select ${strain.name}`}
                    />
                </div>

                {/* Type Icon */}
                <div className="w-7 h-7 flex-shrink-0">
                    {typeIcons[strain.type]}
                </div>

                {/* Name & Type */}
                <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span className="truncate">{strain.name}</span>
                        {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" />}
                    </p>
                    <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
                </div>

                {/* Desktop-only Stats */}
                <div className="hidden sm:flex flex-col items-center justify-center text-xs font-mono text-slate-300">
                    <span className="font-semibold">{strain.thc?.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-500">THC</span>
                </div>
                 <div className="hidden sm:flex flex-col items-center justify-center text-xs font-mono text-slate-300">
                    <span className="font-semibold">{strain.cbd?.toFixed(1)}%</span>
                     <span className="text-[10px] text-slate-500">CBD</span>
                </div>
                 <div className="hidden sm:flex flex-col items-center justify-center text-xs font-mono text-slate-300">
                    <span className="font-semibold">{strain.floweringTimeRange || strain.floweringTime}</span>
                    <span className="text-[10px] text-slate-500">wks</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="!p-1.5"
                        onClick={(e) => handleActionClick(e, () => dispatch(initiateGrowFromStrainList(strain)))}
                        title={t('strainsView.startGrowing')}
                        aria-label={t('strainsView.startGrowing')}
                    >
                        <PhosphorIcons.Plant className="w-5 h-5 text-primary-300" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-1.5 transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`}
                        onClick={(e) => handleActionClick(e, onToggleFavorite)}
                        title={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                        aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    >
                        <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
});