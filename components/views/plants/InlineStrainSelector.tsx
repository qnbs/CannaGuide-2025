import React, { useState, useEffect, useMemo } from 'react';
import { Strain, StrainType } from '@/types';
import { useAppSelector } from '@/stores/store';
import { strainService } from '@/services/strainService';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { selectUserStrains, selectFavoriteIds } from '@/stores/selectors';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';

interface InlineStrainSelectorProps {
  onClose: () => void;
  onSelectStrain: (strain: Strain) => void;
}

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({ difficulty }) => {
    const { t } = useTranslation();
    const difficultyMap = { Easy: 1, Medium: 2, Hard: 3 };
    const level = difficultyMap[difficulty] || 2;
    const color = { Easy: 'text-green-400', Medium: 'text-amber-400', Hard: 'text-red-400'}[difficulty];
    return (
        <div className="flex gap-0.5 items-center" title={t(`strainsView.difficulty.${difficulty.toLowerCase()}`)}>
            {[...Array(3)].map((_, i) => (
                <PhosphorIcons.Cannabis key={i} weight="fill" className={`w-4 h-4 ${i < level ? color : 'text-slate-600'}`} />
            ))}
        </div>
    );
};

const DetailedStrainSelectItem: React.FC<{ strain: Strain; onClick: () => void }> = ({ strain, onClick }) => {
    const { t } = useTranslation();
    const userStrains = useAppSelector(selectUserStrains);
    const isUserStrain = userStrains.some(s => s.id === strain.id);

    const typeClasses: Record<string, string> = { Sativa: 'text-amber-400', Indica: 'text-indigo-400', Hybrid: 'text-blue-400' };
    const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[strain.type];

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors flex items-center gap-4 ring-1 ring-inset ring-white/20"
        >
            <div className="flex-shrink-0">
                {TypeIcon && <TypeIcon className={`w-10 h-10 ${typeClasses[strain.type]}`} />}
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                    <p className="font-bold text-slate-100 truncate">{strain.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-x-4 text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1" title="THC">
                        <PhosphorIcons.Lightning className="w-3 h-3 text-red-400" />
                        <span>{strain.thc?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title="CBD">
                        <PhosphorIcons.Drop className="w-3 h-3 text-blue-400" />
                        <span>{strain.cbd?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1" title={t('strainsView.table.flowering')}>
                        <PhosphorIcons.ArrowClockwise className="w-3 h-3 text-slate-400" />
                        <span>{strain.floweringTimeRange || strain.floweringTime} {t('common.units.weeks')}</span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <DifficultyMeter difficulty={strain.agronomic.difficulty} />
                <div className="flex items-center gap-1 text-xs text-slate-400" title={t('strainsView.addStrainModal.yield')}>
                    <PhosphorIcons.Archive className="w-3 h-3" />
                    <span>{t(`strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400" title={t('strainsView.addStrainModal.height')}>
                    <PhosphorIcons.Ruler className="w-3 h-3" />
                    <span>{t(`strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`)}</span>
                </div>
            </div>
        </button>
    );
};

export const InlineStrainSelector: React.FC<InlineStrainSelectorProps> = ({ onClose, onSelectStrain }) => {
    const { t } = useTranslation();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userStrains = useAppSelector(selectUserStrains);
    const favorites = useAppSelector(selectFavoriteIds);

    useEffect(() => {
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            setIsLoading(false);
        });
    }, []);

    const filteredStrains = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        let strainsToShow = allStrains;

        if (searchTerm.trim() !== '') {
            strainsToShow = allStrains.filter(s =>
                s.name.toLowerCase().includes(lowerCaseSearch) ||
                s.type.toLowerCase().includes(lowerCaseSearch) ||
                (s.aromas || []).some(a => a.toLowerCase().includes(lowerCaseSearch))
            );
        }

        // Prioritize user strains and favorites
        strainsToShow.sort((a, b) => {
            const aIsUser = userStrains.some(s => s.id === a.id);
            const bIsUser = userStrains.some(s => s.id === b.id);
            const aIsFav = favorites.has(a.id);
            const bIsFav = favorites.has(b.id);
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;
            if (aIsFav && !bIsFav) return -1;
            if (!aIsFav && bIsFav) return 1;
            return a.name.localeCompare(b.name);
        });

        return strainsToShow.slice(0, 100); // Limit results for performance
    }, [searchTerm, allStrains, userStrains, favorites]);

    return (
        <Card className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="font-semibold text-primary-400">{t('plantsView.inlineSelector.title')}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                    <PhosphorIcons.X className="w-5 h-5" />
                </button>
            </div>
            <div className="relative mb-4 flex-shrink-0">
                <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('strainsView.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                {isLoading ? (
                    <SkeletonLoader count={5} />
                ) : (
                    <div className="space-y-1">
                        {filteredStrains.map(strain => (
                            <DetailedStrainSelectItem key={strain.id} strain={strain} onClick={() => onSelectStrain(strain)} />
                        ))}
                         {filteredStrains.length === 0 && (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                {t('strainsView.emptyStates.noResults.title')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};