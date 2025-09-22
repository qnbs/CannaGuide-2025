import React from 'react';
import { Strain } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';

interface StrainCompactItemProps {
    strain: Strain;
    onSelect: () => void;
}

export const StrainCompactItem: React.FC<StrainCompactItemProps> = React.memo(({ strain, onSelect }) => {
    const { t } = useTranslations();

    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];
    const typeClasses = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };

    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };

    return (
        <button
            onClick={onSelect}
            className="w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-slate-700/50 focus:outline-none focus:bg-slate-700"
            aria-label={`${t('common.select')} ${strain.name}`}
        >
            <TypeIcon className={`w-8 h-8 flex-shrink-0 ${typeClasses[strain.type]}`} />
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-100 truncate">{strain.name}</p>
                <p className="text-xs text-slate-400">{strain.type}</p>
            </div>
            <div className="flex-shrink-0 text-right">
                <p className="text-xs font-mono text-slate-200">{strain.thc.toFixed(1)}% THC</p>
                <div className="flex justify-end" title={difficultyLabels[strain.agronomic.difficulty]}>
                     <PhosphorIcons.Cannabis className={`w-3 h-3 ${strain.agronomic.difficulty === 'Easy' ? 'text-green-500' : strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'}`} />
                     <PhosphorIcons.Cannabis className={`w-3 h-3 ${strain.agronomic.difficulty === 'Medium' ? 'text-amber-500' : strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                     <PhosphorIcons.Cannabis className={`w-3 h-3 ${strain.agronomic.difficulty === 'Hard' ? 'text-red-500' : 'text-slate-700'}`} />
                </div>
            </div>
        </button>
    );
});