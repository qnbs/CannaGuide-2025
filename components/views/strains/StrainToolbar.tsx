import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/stores/store';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { StrainType } from '@/types';
import { SearchBar } from '@/components/common/SearchBar';

interface StrainToolbarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    onExport: () => void;
    onAdd: () => void;
    onOpenDrawer: () => void;
    activeFilterCount: number;
    viewMode: 'list' | 'grid';
    typeFilter: StrainType[];
    onToggleTypeFilter: (type: StrainType) => void;
    isAnyFilterActive: boolean;
    onResetFilters: () => void;
}

export const StrainToolbar: React.FC<StrainToolbarProps> = (props) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { 
        searchTerm, onSearchTermChange, onOpenDrawer, activeFilterCount, viewMode, typeFilter, onToggleTypeFilter, isAnyFilterActive, onResetFilters
    } = props;
    
    const typeOptions: { value: StrainType, label: string }[] = [
        { value: StrainType.Sativa, label: t('strainsView.sativa') },
        { value: StrainType.Indica, label: t('strainsView.indica') },
        { value: StrainType.Hybrid, label: t('strainsView.hybrid') },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex-grow">
                    <SearchBar
                        placeholder={t('strainsView.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                    />
                </div>
                <Button onClick={onOpenDrawer} variant="secondary" className="relative !p-2.5">
                    <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold ring-2 ring-slate-800">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                 <Button 
                    onClick={() => dispatch(setStrainsViewMode(viewMode === 'list' ? 'grid' : 'list'))} 
                    variant="secondary" 
                    className="!p-2.5"
                    title={t('strainsView.toggleView')}
                >
                    {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5"/> : <PhosphorIcons.ListBullets className="w-5 h-5"/>}
                </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                {typeOptions.map(opt => (
                    <Button 
                        key={opt.value} 
                        variant={typeFilter.includes(opt.value) ? 'primary' : 'secondary'}
                        onClick={() => onToggleTypeFilter(opt.value)}
                        size="sm"
                        className="flex-1"
                    >
                        {opt.label}
                    </Button>
                ))}
                {isAnyFilterActive && (
                    <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                        <PhosphorIcons.X className="w-4 h-4 mr-1" />
                        {t('strainsView.resetFilters')}
                    </Button>
                )}
            </div>
        </div>
    );
};