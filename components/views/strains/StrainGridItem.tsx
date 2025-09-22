import React from 'react';
import { Strain } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/stores/useAppStore';

interface StrainGridItemProps {
    strain: Strain;
    isUserStrain?: boolean;
    onDelete?: (id: string) => void;
    index: number;
}

const StrainGridItem: React.FC<StrainGridItemProps> = ({
    strain,
    isUserStrain = false,
    onDelete,
    index,
}) => {
    const { t } = useTranslations();
    const { 
        isFavorite,
        toggleFavorite,
        selectStrain,
        initiateGrow,
        openAddModal,
        hasAvailableSlots,
    } = useAppStore(state => ({
        isFavorite: state.favoriteIds.has(strain.id),
        toggleFavorite: state.toggleFavorite,
        selectStrain: state.selectStrain,
        initiateGrow: state.initiateGrow,
        openAddModal: state.openAddModal,
        hasAvailableSlots: state.plants.some(p => p === null),
    }));
    
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-500', Indica: 'text-indigo-500', Hybrid: 'text-blue-500' };

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <Card 
            className="flex flex-col h-full cursor-pointer group relative hover:border-primary-500/50 transition-all p-3 animate-fade-in-stagger"
            style={{ animationDelay: `${index * 30}ms` }}
            onClick={() => selectStrain(strain)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStrain(strain); } }}
            role="button"
            tabIndex={0}
            aria-label={`View details for ${strain.name}`}
        >
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 {isUserStrain && onDelete && (
                    <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => openAddModal(strain))} aria-label={t('common.edit')}>
                            <PhosphorIcons.PencilSimple className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm" className="!p-1.5" onClick={(e) => handleActionClick(e, () => onDelete(strain.id))} aria-label={t('common.delete')}>
                             <PhosphorIcons.TrashSimple className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                 <div title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}>
                    <button
                        onClick={(e) => handleActionClick(e, () => initiateGrow(strain))}
                        disabled={!hasAvailableSlots}
                        className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={t('strainsView.startGrowing')}
                    >
                        <PhosphorIcons.Plant className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={(e) => handleActionClick(e, () => toggleFavorite(strain.id))}
                    className={`favorite-btn-glow p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''}`}
                    aria-label={isFavorite ? `Remove ${strain.name} from favorites` : `Add ${strain.name} to favorites`}
                    aria-pressed={isFavorite}
                >
                    <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-grow flex flex-col justify-between text-center">
                <div className="flex-grow">
                    <TypeIcon className={`w-12 h-12 mx-auto mb-2 ${typeClasses[strain.type]}`} />
                    <h3 className="font-bold text-base text-slate-100 truncate flex items-center justify-center gap-1">
                        {isUserStrain && <span title={t('strainsView.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                        {strain.name}
                    </h3>
                    <p className="text-xs text-slate-300">{strain.type}</p>
                </div>
                
                <div className="mt-4 text-xs space-y-2">
                    <div className="flex justify-around items-center">
                        <span className="font-semibold">{t('strainsView.table.thc')}: {strain.thc.toFixed(1)}%</span>
                        <span className="font-semibold">{t('strainsView.table.cbd')}: {strain.cbd.toFixed(1)}%</span>
                    </div>
                     <div className="flex justify-center items-center gap-2" title={t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`)}>
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                        <PhosphorIcons.Cannabis className={`w-4 h-4 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default React.memo(StrainGridItem);
