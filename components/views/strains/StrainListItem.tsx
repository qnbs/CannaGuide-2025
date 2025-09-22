import React, { useId } from 'react';
import { Strain } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { LIST_GRID_CLASS } from '@/components/views/strains/constants';

interface StrainListItemProps {
    strain: Strain;
    isSelected: boolean;
    isFavorite: boolean;
    onSelect: (strain: Strain) => void;
    onToggleSelection: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    visibleColumns: Record<string, boolean>;
    isUserStrain?: boolean;
    onEdit?: (strain: Strain) => void;
    onDelete?: (id: string) => void;
    index: number;
}

const StrainListItem: React.FC<StrainListItemProps> = ({
    strain,
    isSelected,
    isFavorite,
    onSelect,
    onToggleSelection,
    onToggleFavorite,
    visibleColumns,
    isUserStrain = false,
    onEdit,
    onDelete,
    index,
}) => {
    const { t } = useTranslations();
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
            onClick={() => onSelect(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(strain); } }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${strain.name}`}
            className={`${LIST_GRID_CLASS} glass-pane rounded-lg transition-all duration-200 cursor-pointer hover:!border-primary-500/80 hover:bg-slate-700/50 animate-fade-in-stagger`}
            style={{ animationDelay: `${index * 30}ms` }}
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
            <div className="flex items-center justify-center px-3 py-3">
                <button
                    onClick={(e) => handleActionClick(e, () => onToggleFavorite(strain.id))}
                    className={`favorite-btn-glow text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''}`}
                    aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    aria-pressed={isFavorite}
                >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                </button>
            </div>
            <div className="min-w-0 px-3 py-3 text-sm">
                <p className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                     {/* FIX: The `title` prop is not valid on the `PhosphorIcons.Star` component. Moved it to a wrapping `span` element to provide a tooltip for accessibility. */}
                     {isUserStrain && <span title={t('strainsView.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                    {strain.name}
                </p>
                 <p className="text-xs text-slate-400 sm:hidden">{strain.type}</p>
            </div>
            {visibleColumns.type && <div className="hidden sm:flex items-center px-3 py-3 text-sm" title={strain.typeDetails || strain.type}><TypeDisplay /></div>}
            {visibleColumns.thc && <div className="hidden sm:flex items-center px-3 py-3 text-sm font-mono text-slate-200">{strain.thc.toFixed(1)}%</div>}
            {visibleColumns.cbd && <div className="hidden sm:flex items-center px-3 py-3 text-sm font-mono text-slate-400">{strain.cbd.toFixed(1)}%</div>}
            {visibleColumns.floweringTime && <div className="hidden sm:flex items-center px-3 py-3 text-sm text-slate-200">{strain.floweringTime} {t('common.units.weeks')}</div>}
            {visibleColumns.yield && <div className="hidden md:flex items-center px-3 py-3 text-sm text-slate-300">{strain.agronomic.yieldDetails?.indoor || 'N/A'}</div>}
            {visibleColumns.difficulty && <div className="flex items-center px-3 py-3" aria-label={`Difficulty: ${difficultyLabels[strain.agronomic.difficulty]}`} title={difficultyLabels[strain.agronomic.difficulty]}>
                <div className="flex">
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                    <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                </div>
            </div>}
            <div className="flex items-center justify-start px-3 py-3">
                {isUserStrain && onEdit && onDelete && (
                    <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onEdit(strain))}>
                            <PhosphorIcons.PencilSimple className="w-4 h-4" />
                            <span className="sr-only">{t('common.edit')}</span>
                        </Button>
                        <Button variant="danger" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onDelete(strain.id))}>
                            <PhosphorIcons.TrashSimple className="w-4 h-4" />
                            <span className="sr-only">{t('common.delete')}</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(StrainListItem);