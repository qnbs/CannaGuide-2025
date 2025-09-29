import React, { memo } from 'react';
import { Strain, StrainType } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { Button } from '@/components/common/Button';

interface StrainGridItemProps {
    strain: Strain;
    onSelect: (strain: Strain) => void;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isUserStrain: boolean;
    onDelete: (id: string) => void;
    index: number;
}

const typeIcons: Record<StrainType, React.ReactNode> = {
    [StrainType.Sativa]: <SativaIcon className="w-10 h-10 text-amber-400" />,
    [StrainType.Indica]: <IndicaIcon className="w-10 h-10 text-indigo-400" />,
    [StrainType.Hybrid]: <HybridIcon className="w-10 h-10 text-blue-400" />,
};

const StrainGridItem: React.FC<StrainGridItemProps> = memo(({ strain, onSelect, isSelected, onToggleSelection, isUserStrain, onDelete, index }) => {
    const { t } = useTranslation();

    return (
        <Card 
            className={`flex flex-col h-full text-center relative cursor-pointer ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            onClick={() => onSelect(strain)}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(strain.id)}
                    className="h-4 w-4 rounded border-slate-500 bg-slate-700/50 text-primary-500 focus:ring-primary-500"
                    aria-label={`Select ${strain.name}`}
                />
                 {isUserStrain && (
                    <Button variant="danger" size="sm" className="!p-1" onClick={() => onDelete(strain.id)}>
                        <PhosphorIcons.TrashSimple className="w-3 h-3" />
                    </Button>
                )}
            </div>
            
            {isUserStrain && <PhosphorIcons.Star weight="fill" className="absolute top-2 left-2 w-4 h-4 text-amber-400" title={t('strainsView.tabs.myStrains')} />}

            <div className="mx-auto mb-2">
                {typeIcons[strain.type]}
            </div>

            <h3 className="font-bold text-slate-100 truncate">{strain.name}</h3>
            <p className="text-xs text-slate-400 mb-2">{strain.type}</p>

            <div className="mt-auto text-xs grid grid-cols-2 gap-x-2 gap-y-1 font-mono">
                <div className="bg-slate-700/50 rounded p-1">THC: {strain.thc?.toFixed(1)}%</div>
                <div className="bg-slate-700/50 rounded p-1">CBD: {strain.cbd?.toFixed(1)}%</div>
                <div className="bg-slate-700/50 rounded p-1 col-span-2">
                    {strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}
                </div>
            </div>
        </Card>
    );
});

export default StrainGridItem;
