import React, { memo } from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { LIST_GRID_CLASS } from './constants';
import { Button } from '@/components/common/Button';

interface StrainListItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    visibleColumns: Record<string, boolean>;
    style?: React.CSSProperties;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-6 h-6 text-amber-400" />,
    [StrainType.Indica]: <IndicaIcon className="w-6 h-6 text-indigo-400" />,
    [StrainType.Hybrid]: <HybridIcon className="w-6 h-6 text-blue-400" />,
};

export const StrainListItem: React.FC<StrainListItemProps> = memo(({
    strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete,
    visibleColumns, style, isFavorite, onToggleFavorite
}) => {
    const { t } = useTranslation();

    const difficultyMap = {
        Easy: 'bg-green-500/20 text-green-300',
        Medium: 'bg-amber-500/20 text-amber-300',
        Hard: 'bg-red-500/20 text-red-300',
    };

    return (
        <div
            style={style}
            className={`${LIST_GRID_CLASS} glass-pane rounded-lg p-3 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-primary-900/40' : 'hover:bg-slate-800/60'}`}
            onClick={() => onSelect(strain)}
        >
            <div className="flex items-center justify-center">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelection(strain.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700/50 text-primary-500 focus:ring-primary-500"
                    aria-label={`Select ${strain.name}`}
                />
            </div>

            <div className="min-w-0">
                <p className="font-bold text-slate-100 truncate flex items-center gap-2">
                    {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                    {strain.name}
                </p>
                <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
            </div>

            {visibleColumns.type && (
                <div className="hidden sm:flex items-center justify-center" title={strain.type}>
                    {typeIcons[strain.type]}
                </div>
            )}
            
            {visibleColumns.thc && <p className="hidden sm:block text-sm font-mono">{strain.thc?.toFixed(1)}%</p>}
            {visibleColumns.cbd && <p className="hidden sm:block text-sm font-mono">{strain.cbd?.toFixed(1)}%</p>}
            {visibleColumns.floweringTime && <p className="hidden sm:block text-sm">{strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}</p>}
            
            {visibleColumns.yield && (
                <p className="hidden md:block text-sm">
                    {t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`)}
                </p>
            )}

            {visibleColumns.difficulty && (
                <div className="flex items-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${difficultyMap[strain.agronomic.difficulty]}`}>
                        {t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}
                    </span>
                </div>
            )}

            <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`!p-1 rounded-full favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={onToggleFavorite} 
                    title={t('common.manageFavorites')}
                >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                </Button>
                {isUserStrain && (
                    <Button variant="danger" size="sm" className="!p-1 rounded-full" onClick={() => onDelete(strain.id)} title={t('common.delete')}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
});
