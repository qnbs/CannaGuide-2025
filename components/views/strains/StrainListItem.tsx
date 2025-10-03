import React, { memo } from 'react';
import { Strain, StrainType, AppSettings, DifficultyLevel } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { LIST_GRID_CLASS } from './constants';
import { Button } from '@/components/common/Button';

interface StrainListItemProps {
    strain: Strain;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onSelect: (strain: Strain) => void;
    visibleColumns: AppSettings['strainsViewSettings']['visibleColumns'];
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    index: number;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-6 h-6 text-amber-400" />,
    [StrainType.Indica]: <IndicaIcon className="w-6 h-6 text-indigo-400" />,
    [StrainType.Hybrid]: <HybridIcon className="w-6 h-6 text-blue-400" />,
};

const typeClasses: Record<StrainType, string> = {
    [StrainType.Sativa]: 'text-amber-400',
    [StrainType.Indica]: 'text-indigo-400',
    [StrainType.Hybrid]: 'text-blue-400',
};

const DifficultyMeter: React.FC<{ difficulty: DifficultyLevel }> = ({ difficulty }) => {
    const level = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }[difficulty];
    return (
        <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-3 w-1.5 rounded-sm ${i < level ? 'bg-primary-400' : 'bg-slate-600'}`} />
            ))}
        </div>
    );
};


const StrainListItem: React.FC<StrainListItemProps> = memo(({ strain, isSelected, onToggleSelection, onSelect, visibleColumns, isUserStrain, onDelete, index, isFavorite, onToggleFavorite }) => {
    const { t } = useTranslation();
    
    return (
        <div 
            className={`${LIST_GRID_CLASS} p-3 rounded-lg transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-primary-900/40' : 'bg-slate-800/50 hover:bg-slate-700/50'}`} 
            onClick={() => onSelect(strain)}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(strain.id)}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                    aria-label={`Select ${strain.name}`}
                />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    {isUserStrain && <span title={t('strainsView.tabs.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                    <p className="font-bold text-slate-100 truncate">{strain.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 sm:hidden mt-1">
                    <span className={`font-semibold ${typeClasses[strain.type]}`}>{strain.type}</span>
                    <div className="w-px h-3 bg-slate-600"></div>
                    <div className="flex items-center gap-1" title="THC">
                        <PhosphorIcons.Lightning weight="fill" className="w-3 h-3 text-red-400" />
                        <span>{strain.thc?.toFixed(1)}%</span>
                    </div>
                     <div className="flex items-center gap-1" title="CBD">
                        <PhosphorIcons.Drop weight="fill" className="w-3 h-3 text-blue-400" />
                        <span>{strain.cbd?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title={t('strainsView.table.flowering')}>
                        <PhosphorIcons.ArrowClockwise className="w-3 h-3" />
                        <span>{strain.floweringTimeRange || strain.floweringTime}{t('common.units.weeks').substring(0,1)}</span>
                    </div>
                </div>
            </div>

            {visibleColumns.type && <div className="hidden sm:flex items-center" title={strain.type}>{typeIcons[strain.type]}</div>}
            {visibleColumns.thc && <div className="hidden sm:flex items-center font-mono text-sm">{strain.thc?.toFixed(1)}%</div>}
            {visibleColumns.cbd && <div className="hidden sm:flex items-center font-mono text-sm">{strain.cbd?.toFixed(1)}%</div>}
            {visibleColumns.floweringTime && <div className="hidden sm:flex items-center text-sm">{strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}</div>}
            {visibleColumns.yield && <div className="hidden sm:flex items-center text-sm">{t(`strainsView.addStrainModal.yields.${(strain.agronomic.yield || 'Medium').toLowerCase()}`)}</div>}

            <div className="flex items-center justify-start" title={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}>
                <DifficultyMeter difficulty={strain.agronomic.difficulty} />
            </div>

            <div className="flex gap-1 justify-end min-w-[5rem]" onClick={e => e.stopPropagation()}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`!p-1.5 favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                    onClick={onToggleFavorite} 
                    title={t('common.manageFavorites')}
                >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                </Button>
                {isUserStrain && (
                    <Button variant="danger" size="sm" className="!p-1.5" onClick={() => onDelete(strain.id)} title={t('common.delete')}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
});

export default StrainListItem;