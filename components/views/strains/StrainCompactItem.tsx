import React, { memo } from 'react';
import { Strain } from '@/types';
import { useAppSelector } from '@/stores/store';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { selectUserStrains } from '@/stores/selectors';

interface StrainCompactItemProps {
    strain: Strain;
    onClick: () => void;
}

export const StrainCompactItem: React.FC<StrainCompactItemProps> = memo(({ strain, onClick }) => {
    const userStrains = useAppSelector(selectUserStrains);
    const isUserStrain = userStrains.some(s => s.id === strain.id);
    const safeName = typeof strain.name === 'string' && strain.name.trim() !== '' ? strain.name : 'Unknown Strain';
    const safeType = strain.type === 'Sativa' || strain.type === 'Indica' || strain.type === 'Hybrid' ? strain.type : 'Hybrid';

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-2 rounded-md hover:bg-slate-700/50 transition-colors flex items-center gap-3 ring-1 ring-inset ring-white/20"
        >
            {isUserStrain && (
                <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-100 truncate">{safeName}</p>
                <p className="text-xs text-slate-400">{safeType}</p>
            </div>
        </button>
    );
});

StrainCompactItem.displayName = 'StrainCompactItem';
