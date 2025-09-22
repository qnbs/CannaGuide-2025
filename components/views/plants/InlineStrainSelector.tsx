import React, { useState, useEffect, useMemo } from 'react';
import { Strain } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { strainService } from '@/services/strainService';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { StrainCompactItem } from './StrainCompactItem';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface InlineStrainSelectorProps {
    onClose: () => void;
    onSelectStrain: (strain: Strain) => void;
}

export const InlineStrainSelector: React.FC<InlineStrainSelectorProps> = ({ onClose, onSelectStrain }) => {
    const { t } = useTranslations();
    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        strainService.getAllStrains()
            .then(strains => {
                setAllStrains(strains);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load strains for selector:", err);
                setIsLoading(false);
            });
    }, []);

    const filteredStrains = useMemo(() => {
        if (!query) return allStrains;
        const lowerCaseQuery = query.toLowerCase();
        return allStrains.filter(strain => strain.name.toLowerCase().includes(lowerCaseQuery));
    }, [query, allStrains]);

    return (
        <Card className="h-full flex flex-col animate-fade-in">
            <div className="flex-shrink-0">
                <h3 className="font-semibold text-primary-300">{t('plantsView.inlineSelector.title')}</h3>
                <p className="text-sm text-slate-400 mb-3">{t('plantsView.inlineSelector.subtitle')}</p>
                <div className="relative">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('strainsView.searchPlaceholder')}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto mt-3 pr-2 min-h-0">
                {isLoading ? (
                    <SkeletonLoader count={5} containerClassName="space-y-2" className="h-12 bg-slate-800 rounded-lg"/>
                ) : (
                    <div className="space-y-1">
                        {filteredStrains.map(strain => (
                            <StrainCompactItem 
                                key={strain.id} 
                                strain={strain} 
                                onSelect={() => onSelectStrain(strain)} 
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="flex-shrink-0 mt-3 pt-3 border-t border-slate-700/50">
                <Button variant="secondary" onClick={onClose} className="w-full">
                    {t('common.cancel')}
                </Button>
            </div>
        </Card>
    );
};