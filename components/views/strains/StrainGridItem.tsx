import React from 'react';
import { Strain } from '@/types';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { selectHasAvailableSlots } from '@/stores/selectors';
import { Card } from '@/components/common/Card';

interface StrainGridItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    index: number;
}

const StrainGridItem: React.FC<StrainGridItemProps> = ({ strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete, index }) => {
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

    const animationDelay = `${Math.min(index * 30, 500)}ms`;

    return (
        <Card className="flex flex-col text-center p-0 overflow-hidden animate-fade-in-stagger" style={{ animationDelay }}>
            <div className="absolute top-2 right-2 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(strain.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 rounded border-slate-500 bg-slate-800/50 text-primary-500 focus:ring-primary-500"
                />
            </div>
            <div onClick={() => onSelect(strain)} className="flex-grow p-3 cursor-pointer">
                {TypeIcon && <TypeIcon className={`w-12 h-12 mx-auto mb-2 ${typeClasses[strain.type]}`} />}
                <h3 className="font-bold text-slate-100 truncate">{strain.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{strain.type}</p>
                <div className="flex justify-center gap-3 text-xs font-mono">
                    <span>THC {strain.thc}%</span>
                    <span>CBD {strain.cbd}%</span>
                </div>
            </div>
            <div className="p-2 bg-slate-900/50 border-t border-slate-700/50 flex gap-1 justify-center">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); toggleFavorite(strain.id); }} aria-pressed={isFavorite} className={`favorite-btn-glow !p-1.5 ${isFavorite ? 'is-favorite' : ''}`}><PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" /></Button>
                <Button onClick={(e) => { e.stopPropagation(); initiateGrowFromStrainList(strain); }} disabled={!hasAvailableSlots} size="sm" className="!p-1.5" title={!hasAvailableSlots ? t('plantsView.notifications.allSlotsFull') : t('strainsView.startGrowing')}><PhosphorIcons.Plant className="w-4 h-4" /></Button>
                {isUserStrain && (<>
                    <Button variant="secondary" onClick={(e) => {e.stopPropagation(); openAddModal(strain)}} size="sm" className="!p-1.5"><PhosphorIcons.PencilSimple className="w-4 h-4" /></Button>
                    <Button variant="danger" onClick={(e) => {e.stopPropagation(); onDelete(strain.id)}} size="sm" className="!p-1.5"><PhosphorIcons.TrashSimple className="w-4 h-4" /></Button>
                </>)}
            </div>
        </Card>
    );
};

export default StrainGridItem;
