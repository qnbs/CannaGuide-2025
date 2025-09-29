import React, { memo } from 'react';
import { Strain, StrainType, AppSettings } from '@/types';
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
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-6 h-6 text-amber-400" />,
    [StrainType.Indica]: <IndicaIcon className="w-6 h-6 text-indigo-400" />,
    [StrainType.Hybrid]: <HybridIcon className="w-6 h-6 text-blue-400" />,
};

const StrainListItem: React.FC<StrainListItemProps> = memo(({ strain, isSelected, onToggleSelection, onSelect, visibleColumns, isUserStrain, onDelete, index }) => {
    const { t } = useTranslation();

    const difficultyMap: Record<string, { color: string, icon: React.ReactNode }> = {
        Easy: { color: 'text-green-400', icon: <PhosphorIcons.Leafy /> },
        Medium: { color: 'text-amber-400', icon: <PhosphorIcons.Plant /> },
        Hard: { color: 'text-red-400', icon: <PhosphorIcons.GameController /> },
    };
    
    return (
        <div 
            className={`${LIST_GRID_CLASS} p-3 rounded-lg transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-primary-900/40' : 'bg-slate-800/50 hover:bg-slate-700/50'}`} 
            onClick={() => onSelect(strain)}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
                    {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" title={t('strainsView.tabs.myStrains')} />}
                    <p className="font-bold text-slate-100 truncate">{strain.name}</p>
                </div>
                <p className="text-xs text-slate-400 truncate sm:hidden">{strain.type}</p>
            </div>

            {visibleColumns.type && <div className="hidden sm:flex items-center justify-center" title={strain.type}>{typeIcons[strain.type]}</div>}
            {visibleColumns.thc && <div className="hidden sm:flex items-center font-mono text-sm">{strain.thc?.toFixed(1)}%</div>}
            {visibleColumns.cbd && <div className="hidden sm:flex items-center font-mono text-sm">{strain.cbd?.toFixed(1)}%</div>}
            {visibleColumns.floweringTime && <div className="hidden sm:flex items-center text-sm">{strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}</div>}
            {visibleColumns.yield && <div className="hidden md:flex items-center text-sm">{t(`strainsView.addStrainModal.yields.${(strain.agronomic.yield || 'Medium').toLowerCase()}`)}</div>}

            <div className="flex items-center text-sm">
                <span className={`${difficultyMap[strain.agronomic.difficulty]?.color} mr-1.5`}>{difficultyMap[strain.agronomic.difficulty]?.icon}</span>
                <span className="hidden md:inline">{t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}</span>
            </div>

            <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                {isUserStrain && (
                    <Button variant="danger" size="sm" className="!p-1.5" onClick={() => onDelete(strain.id)}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
});

export default StrainListItem;
