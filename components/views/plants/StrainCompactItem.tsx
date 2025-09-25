import React from 'react';
import { Strain } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { useAppStore } from '@/stores/useAppStore';

interface StrainCompactItemProps {
    strain: Strain;
    onSelect: () => void;
}

export const StrainCompactItem: React.FC<StrainCompactItemProps> = React.memo(({ strain, onSelect }) => {
    const { t } = useTranslations();
    const { isFavorite, isUserStrain } = useAppStore(state => ({
        isFavorite: state.favoriteIds.has(strain.id),
        isUserStrain: state.userStrains.some(s => s.id === strain.id)
    }));

    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };

    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    const difficultyMap = {
        Easy: { level: 1, color: 'text-green-500' },
        Medium: { level: 2, color: 'text-amber-500' },
        Hard: { level: 3, color: 'text-red-500' },
    };
    const { level, color } = difficultyMap[strain.agronomic?.difficulty || 'Medium'];

    return (
        <button
            onClick={onSelect}
            className="w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`${t('common.select')} ${strain.name}`}
        >
            {TypeIcon ? (
                 <TypeIcon className={`w-8 h-8 flex-shrink-0 ${typeClasses[strain.type]}`} />
            ) : (
                <div className="w-8 h-8 flex-shrink-0 bg-slate-700 rounded-full" />
            )}
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-100 truncate flex items-center gap-1.5">
                    {isUserStrain && <span title={t('strainsView.myStrains')}><PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" /></span>}
                    {isFavorite && <span title={t('strainsView.favorites')}><PhosphorIcons.Heart weight="fill" className="w-4 h-4 text-red-500/80 flex-shrink-0" /></span>}
                    <span>{strain.name}</span>
                </p>
                <p className="text-xs text-slate-400">{strain.type}</p>
            </div>
            <div className="flex-shrink-0 text-right">
                <p className="text-xs font-mono text-slate-200">{strain.thc.toFixed(1)}% THC</p>
                <div className="flex justify-end" title={difficultyLabels[strain.agronomic?.difficulty || 'Medium']}>
                    {[...Array(3)].map((_, i) => (
                        <PhosphorIcons.Cannabis key={i} className={`w-3 h-3 ${i < level ? color : 'text-slate-700'}`} />
                    ))}
                </div>
            </div>
        </button>
    );
});

StrainCompactItem.displayName = 'StrainCompactItem';