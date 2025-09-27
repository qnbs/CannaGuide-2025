import React from 'react';
// FIX: Changed import paths to be relative
import { Strain, SortKey, AppSettings } from '../../../types';
import { SativaIcon, IndicaIcon, HybridIcon } from '../../icons/StrainTypeIcons';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { Button } from '../../common/Button';
import { useTranslations } from '../../../hooks/useTranslations';
import { useAppStore } from '../../../stores/useAppStore';
import { LIST_GRID_CLASS } from './constants';
import { selectHasAvailableSlots } from '../../../stores/selectors';

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

const DifficultyBar: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({ difficulty }) => {
    const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
    const level = difficultyMap[difficulty] || 2;
    return (
        <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-1.5 h-3 rounded-sm ${i < level ? 'bg-primary-400' : 'bg-slate-600'}`}></div>
            ))}
        </div>
    );
};

const StrainListItem: React.FC<StrainListItemProps> = ({ strain, isSelected, onToggleSelection, onSelect, visibleColumns, isUserStrain, onDelete, index }) => {
    const { t } = useTranslations();
    const { toggleFavorite, isFavorite, openAddModal, initiateGrowFromStrainList } = useAppStore(state => ({
        toggleFavorite: state.toggleFavorite,
        isFavorite: state.favoriteIds.has(strain.id),
        openAddModal: state.openAddModal,
        initiateGrowFromStrainList: state.initiateGrowFromStrainList,
    }));
    const hasAvailableSlots = useAppStore(selectHasAvailableSlots);

    const typeClasses: Record<string, string> = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(strain.id);
    };
    
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openAddModal(strain);
    };
    
    const animationDelay = `${Math.min(index * 50, 500)}ms`;

    return (
        <div
            onClick={() => onSelect(strain)}
            className={`${LIST_GRID_CLASS} glass-pane rounded-lg p-3 cursor-pointer group animate-fade-in-stagger`}
            style={{ animationDelay }}
        >
            <div className="flex items-center justify-center">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(strain.id)} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
                {isUserStrain && <span title={t('strainsView.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                <div className="truncate">
                    <p className="font-semibold text-slate-100 truncate">{strain.name}</p>
                    <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
                </div>
            </div>
            {visibleColumns.type && (
                <div className="hidden sm:flex items-center justify-center" title={strain.type}>
                    {TypeIcon && <TypeIcon className={`w-6 h-6 ${typeClasses[strain.type]}`} />}
                </div>
            )}
            {visibleColumns.thc && <div className="hidden sm:block font-mono text-sm">{strain.thc?.toFixed(1)}%</div>}
            {visibleColumns.cbd && <div className="hidden sm:block font-mono text-sm">{strain.cbd?.toFixed(1)}%</div>}
            {visibleColumns.floweringTime && <div className="hidden sm:block text-sm">{strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}</div>}
            {visibleColumns.yield && <div className="hidden md:block text-sm">{strain.agronomic.yieldDetails?.indoor || 'N/A'}</div>}
            <div className="flex items-center gap-1 text-sm">
                <DifficultyBar difficulty={strain.agronomic.difficulty} />
                <span className="hidden sm:inline">{t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}</span>
            </div>
            <div className="flex gap-1 justify-end items-center">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); toggleFavorite(strain.id); }} aria-pressed={isFavorite} className={`favorite-btn-glow !p-1.5 ${isFavorite ? 'is-favorite' : ''}`}>
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
                </Button>
                <Button onClick={(e) => { e.stopPropagation(); initiateGrowFromStrainList(strain); }} disabled={!hasAvailableSlots} size="sm" className="!p-1.5" title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}>
                    <PhosphorIcons.Plant className="w-4 h-4" />
                </Button>
                {isUserStrain && (
                    <>
                        <Button variant="secondary" onClick={handleEditClick} size="sm" className="!p-1.5"><PhosphorIcons.PencilSimple className="w-4 h-4" /></Button>
                        <Button variant="danger" onClick={handleDeleteClick} size="sm" className="!p-1.5"><PhosphorIcons.TrashSimple className="w-4 h-4" /></Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StrainListItem;
