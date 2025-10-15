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
    [StrainType.Sativa]: <SativaIcon className="w-8 h-8" />,
    [StrainType.Indica]: <IndicaIcon className="w-8 h-8" />,
    [StrainType.Hybrid]: <HybridIcon className="w-8 h-8" />,
};

export const StrainListItem: React.FC<StrainListItemProps> = memo(({
    strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete,
    style, isFavorite, onToggleFavorite
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const handleStartGrow = (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(initiateGrowFromStrainList(strain));
    };

    const handleToggleFav = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite();
    };

    return (
        <div
            style={style}
            className={`bg-slate-800 rounded-xl transition-all duration-200 animate-fade-in-stagger ${isSelected ? 'bg-primary-900/20 ring-2 ring-primary-500' : 'hover:bg-slate-700/50'}`}
            role="row"
            aria-selected={isSelected}
        >
            {/* --- Mobile View (< sm) --- */}
            <div className="p-3 sm:hidden">
                <div className="flex items-center gap-x-3">
                    <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelection(strain.id)}
                            className="custom-checkbox"
                            aria-label={`Select ${strain.name}`}
                        />
                    </div>
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => onSelect(strain)}>{typeIcons[strain.type]}</div>
                    <div className="min-w-0 flex-grow cursor-pointer" onClick={() => onSelect(strain)}>
                        <p className="font-bold text-slate-100 flex items-center gap-2">
                            <span className="truncate">{strain.name}</span>
                            {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-accent-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                        </p>
                        <p className="text-sm text-slate-400">{strain.type}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`!p-2 transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`}
                            onClick={handleToggleFav}
                            title={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                            aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                        >
                            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 pl-[52px]"> {/* 52px = 20px checkbox + 12px gap + 32px icon */}
                    <div className="text-sm text-slate-300 font-semibold">
                        THC: {strain.thc?.toFixed(1)}%
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="!p-2 text-primary-300 hover:text-white flex items-center gap-1"
                        onClick={handleStartGrow}
                        title={t('strainsView.startGrowing')}
                        aria-label={t('strainsView.startGrowing')}
                    >
                        <PhosphorIcons.Cannabis className="w-5 h-5" />
                        <span className="text-xs">{t('strainsView.startGrowing')}</span>
                    </Button>
                </div>
            </div>

            {/* --- Desktop View (sm and up) --- */}
            <div className="hidden sm:grid p-3 grid-cols-[auto_auto_1fr_auto_auto] items-center gap-x-4">
                <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(strain.id)}
                        className="custom-checkbox"
                        aria-label={`Select ${strain.name}`}
                    />
                </div>
                <div className="flex-shrink-0 cursor-pointer" onClick={() => onSelect(strain)}>{typeIcons[strain.type]}</div>
                <div className="min-w-0 cursor-pointer" onClick={() => onSelect(strain)}>
                    <p className="font-bold text-slate-100 flex items-center gap-2">
                        <span className="truncate">{strain.name}</span>
                        {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-accent-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                    </p>
                    <p className="text-sm text-slate-400">{strain.type}</p>
                </div>
                <div className="text-sm text-slate-300 font-semibold cursor-pointer" onClick={() => onSelect(strain)}>
                    {strain.thc?.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="!p-2 text-primary-300 hover:text-white"
                        onClick={handleStartGrow}
                        title={t('strainsView.startGrowing')}
                        aria-label={t('strainsView.startGrowing')}
                    >
                        <PhosphorIcons.Cannabis className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-2 transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`}
                        onClick={handleToggleFav}
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