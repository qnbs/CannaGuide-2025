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

const typeClasses: Record<StrainType, string> = {
    [StrainType.Sativa]: 'text-accent-400',
    [StrainType.Indica]: 'text-secondary-400',
    [StrainType.Hybrid]: 'text-primary-400',
};

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({ difficulty }) => {
    const { t } = useTranslation();
    const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
    const level = difficultyMap[difficulty] || 2;
    const color = { Easy: 'text-secondary-400', Medium: 'text-amber-400', Hard: 'text-danger'}[difficulty];
    return (
        <div className="flex gap-0.5 items-center" title={t(`strainsView.difficulty.${difficulty.toLowerCase()}`)}>
             <span className="mr-1 text-slate-300">{t(`strainsView.difficulty.${difficulty.toLowerCase()}`)}</span>
            {[...Array(3)].map((_, i) => (
                <PhosphorIcons.Cannabis key={i} weight="fill" className={`w-4 h-4 ${i < level ? color : 'text-slate-600'}`} />
            ))}
        </div>
    );
};

export const StrainListItem: React.FC<StrainListItemProps> = memo(({
    strain, onSelect, isSelected, onToggleSelection, isUserStrain,
    style, isFavorite, onToggleFavorite
}) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    
    const TypeIcon = typeIcons[strain.type];

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            style={style}
            className={`bg-slate-800/60 rounded-lg transition-all duration-200 cursor-pointer ring-1 ring-inset ring-white/20 ${isSelected ? 'bg-primary-900/30 ring-2 !ring-primary-500' : 'hover:bg-slate-700/50'}`}
            role="button"
            tabIndex={0}
            aria-selected={isSelected}
            onClick={() => onSelect(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(strain) }}
        >
            <div className="p-3 grid grid-cols-[auto_40px_1fr_auto] sm:grid-cols-[auto_40px_minmax(0,2.5fr)_repeat(3,minmax(0,1fr))_auto] items-center gap-x-4">
                {/* Checkbox */}
                <div onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(strain.id)}
                        className="custom-checkbox flex-shrink-0"
                        aria-label={`Select ${strain.name}`}
                    />
                </div>

                {/* Type Icon */}
                <div className={`w-8 h-8 flex-shrink-0 ${typeClasses[strain.type]}`}>
                    {TypeIcon}
                </div>

                {/* Name & Main Stats */}
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                        {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                        <p className="font-bold text-slate-100 truncate">{strain.name}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 sm:hidden">
                        {strain.thc?.toFixed(1)}% THC | {strain.floweringTime} wks
                    </p>
                </div>
                
                {/* Desktop stats */}
                <div className="hidden sm:flex items-center gap-1.5 font-mono text-sm" title="THC">
                    <span className="font-sans text-red-400/80 font-bold text-lg">*</span>
                    <span>{strain.thc?.toFixed(1)}%</span>
                </div>
                 <div className="hidden sm:flex items-center gap-1.5 font-mono text-sm" title="CBD">
                    <PhosphorIcons.Drop weight="fill" className="w-3.5 h-3.5 text-blue-400/80" />
                    <span>{strain.cbd?.toFixed(1)}%</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 font-mono text-sm" title={t('strainsView.table.flowering')}>
                    <PhosphorIcons.ArrowClockwise className="w-3.5 h-3.5" />
                    <span>{strain.floweringTimeRange || strain.floweringTime}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="!p-2"
                        onClick={(e) => handleActionClick(e, () => dispatch(initiateGrowFromStrainList(strain)))}
                        title={t('strainsView.startGrowing')}
                        aria-label={t('strainsView.startGrowing')}
                    >
                        <PhosphorIcons.Plant className="w-5 h-5 text-primary-300" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`!p-2 transition-colors favorite-btn-glow ${isFavorite ? 'is-favorite' : 'text-slate-400 hover:text-white'}`}
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