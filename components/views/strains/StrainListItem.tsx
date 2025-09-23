import React, { useId } from 'react';
import { Strain } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { LIST_GRID_CLASS } from '@/components/views/strains/constants';
import { useAppStore } from '@/stores/useAppStore';
import { selectHasAvailableSlots } from '@/stores/selectors';

interface StrainListItemProps {
    strain: Strain;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    visibleColumns: Record<string, boolean>;
    isUserStrain?: boolean;
    onDelete?: (id: string) => void;
    index: number;
}

const StrainListItem: React.FC<StrainListItemProps> = ({
    strain,
    isSelected,
    onToggleSelection,
    visibleColumns,
    isUserStrain = false,
    onDelete,
    index,
}) => {
    const { t } = useTranslations();
    const { 
        toggleFavorite,
        selectStrain,
        initiateGrow,
        openAddModal,
    } = useAppStore(state => ({
        toggleFavorite: state.toggleFavorite,
        selectStrain: state.selectStrain,
        initiateGrow: state.initiateGrow,
        openAddModal: state.openAddModal,
    }));
    
    const isFav = useAppStore(state => state.favoriteIds.has(strain.id));
    const hasAvailableSlots = useAppStore(selectHasAvailableSlots);
    const checkboxId = useId();

    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const TypeDisplay = () => {
        const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
        const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
        if (!TypeIcon) return null;
        return <TypeIcon className={`w-6 h-6 ${typeClasses[strain.type]}`} />;
    };

    return (
        <div
            onClick={() => selectStrain(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStrain(strain); } }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${strain.name}`}
            className={`${LIST_GRID_CLASS} group glass-pane rounded-lg transition-all duration-200 cursor-pointer odd:bg-slate-800/20 hover:!bg-slate-700/50 hover:!border-primary-500/80 animate-fade-in-stagger`}
            style={{ 
                animationDelay: `${Math.min(index, 10) * 20}ms`,
                contentVisibility: 'auto',
                containIntrinsicSize: '72px'
             }}
        >
            <div className="flex items-center justify-center px-3 py-3">
                <input
                    id={checkboxId}
                    name={`select-${strain.id}`}
                    type="checkbox"
                    aria-label={`Select ${strain.name}`}
                    checked={isSelected}
                    onChange={() => onToggleSelection(strain.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
            </div>
            <div className="min-w-0 px-3 py-3 text-sm">
                <p className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                     {isUserStrain && <span title={t('strainsView.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                    {strain.name}
                </p>
                 <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
            </div>
            {visibleColumns.type && <div className="hidden sm:flex items-center px-3 py-3 text-sm" title={strain.typeDetails || strain.type}><TypeDisplay /></div>}
            {visibleColumns.thc && <div className="hidden sm:flex items-center px-3 py-3 text-sm font-mono text-slate-200">{strain.thc.toFixed(1)}%</div>}
            {visibleColumns.cbd && <div className="hidden sm:flex items-center px-3 py-3 text-sm font-mono text-slate-400">{strain.cbd.toFixed(1)}%</div>}
            {visibleColumns.floweringTime && <div className="hidden sm:flex items-center px-3 py-3 text-sm text-slate-200">{strain.floweringTime} {t('common.units.weeks')}</div>}
            {visibleColumns.yield && <div className="hidden sm:flex items-center px-3 py-3 text-sm text-slate-300">{strain.agronomic.yieldDetails?.indoor || 'N/A'}</div>}
            <div className="flex items-center px-3 py-3" aria-label={`Difficulty: ${difficultyLabels[strain.agronomic.difficulty]}`} title={difficultyLabels[strain.agronomic.difficulty]}>
                <div className="flex">
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                </div>
            </div>
            <div className="flex items-center justify-end px-3 py-3">
                <div className="flex gap-1">
                    <div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}>
                        <Button variant="secondary" size="sm" className={`!p-1.5 ${hasAvailableSlots ? 'animate-pulse' : ''}`} onClick={(e) => handleActionClick(e, () => initiateGrow(strain))} disabled={!hasAvailableSlots}>
                            <PhosphorIcons.Plant className="w-4 h-4" />
                            <span className="sr-only">{t('strainsView.startGrowing')}</span>
                        </Button>
                    </div>
                    {isUserStrain && onDelete && (
                        <>
                            <Button variant="secondary" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => openAddModal(strain))}>
                                <PhosphorIcons.PencilSimple className="w-4 h-4" />
                                <span className="sr-only">{t('common.edit')}</span>
                            </Button>
                            <Button variant="danger" size="sm" className="!p-1.5" onClick={(e) => { e.stopPropagation(); onDelete(strain.id); }}>
                                <PhosphorIcons.TrashSimple className="w-4 h-4" />
                                <span className="sr-only">{t('common.delete')}</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(StrainListItem);