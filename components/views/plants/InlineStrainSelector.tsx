import React, { useState, useEffect, useMemo } from 'react';
import { Strain } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { strainService } from '@/services/strainService';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface InlineStrainSelectorProps {
  onClose: () => void;
  onSelectStrain: (strain: Strain) => void;
}

const StrainCompactItem: React.FC<{ strain: Strain; onClick: () => void }> = ({ strain, onClick }) => {
    const isUserStrain = useAppStore(state => state.userStrains.some(s => s.id === strain.id));
    return (
        <button
            onClick={onClick}
            className="w-full text-left p-2 rounded-md hover:bg-slate-700/50 transition-colors flex items-center gap-3"
        >
            {isUserStrain && <PhosphorIcons.Star weight="fill" className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-slate-100 truncate">{strain.name}</p>
                <p className="text-xs text-slate-400">{strain.type}</p>
            </div>
        </button>
    );
};

export const InlineStrainSelector: React.FC<InlineStrainSelectorProps> = ({ onClose, onSelectStrain }) => {
    const { t } = useTranslations();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userStrains = useAppStore(state => state.userStrains);
    const favorites = useAppStore(state => state.favoriteIds);

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
            <p className="text-sm text-slate-400 mb-4 flex-shrink-0">{t('plantsView.inlineSelector.subtitle')}</p>
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
                            <StrainCompactItem key={strain.id} strain={strain} onClick={() => onSelectStrain(strain)} />
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
