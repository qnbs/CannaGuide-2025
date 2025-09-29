import React, { memo } from 'react';
import { Strain } from '@/types';
// FIX: Replace Zustand store with Redux hooks and selectors
import { useAppSelector } from '@/stores/store';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { selectUserStrains } from '@/stores/selectors';

interface StrainCompactItemProps {
    strain: Strain;
    onClick: () => void;
}

export const StrainCompactItem: React.FC<StrainCompactItemProps> = memo(({ strain, onClick }) => {
    const { t } = useTranslation();
    const userStrains = useAppSelector(selectUserStrains);
    const isUserStrain = userStrains.some(s => s.id === strain.id);

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-2 rounded-md hover:bg-slate-700/50 transition-colors flex items-center gap-3"
        >
            {isUserStrain && (
                <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-100 truncate">{strain.name}</p>
                <p className="text-xs text-slate-400">{strain.type}</p>
            </div>
        </button>
    );
});