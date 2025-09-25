import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { StrainType } from '@/types';

interface StrainToolbarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    viewMode: 'list' | 'grid';
    onViewModeChange: (mode: 'list' | 'grid') => void;
    onExport: () => void;
    onAdd: () => void;
    showFavorites: boolean;
    onToggleFavorites: () => void;
    typeFilter: Set<StrainType>;
    onToggleTypeFilter: (type: StrainType) => void;
    onOpenDrawer: () => void;
    activeFilterCount: number;
    isAnyFilterActive: boolean;
    onClearAllFilters: () => void;
}

export const StrainToolbar: React.FC<StrainToolbarProps> = (props) => {
    const { t } = useTranslations();
    const { 
        searchTerm, onSearchTermChange, viewMode, onViewModeChange, onExport, onAdd, 
        showFavorites, onToggleFavorites, typeFilter, onToggleTypeFilter,
        onOpenDrawer, activeFilterCount, isAnyFilterActive, onClearAllFilters
    } = props;
    
    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="relative flex-grow">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder={t('strainsView.searchPlaceholder')} value={searchTerm} onChange={e => onSearchTermChange(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                     <div className="flex items-center bg-slate-800/60 border border-slate-700/80 rounded-lg p-1 gap-1">
                        <button onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')} title={t('strainsView.toggleView')} className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                            {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}
                        </button>
                    </div>
                    <Button onClick={onExport} variant="secondary" className="!py-2 !px-3">
                        <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-1.5" />
                        <span>{t('common.export')}</span>
                    </Button>
                    <Button onClick={onAdd} variant="primary" className="!py-2 !px-3">
                        <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />
                        <span>{t('strainsView.addStrain')}</span>
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex gap-2 items-center overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <button onClick={onToggleFavorites} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 ${showFavorites ? 'bg-primary-500/80 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                    <PhosphorIcons.Heart weight={showFavorites ? 'fill' : 'regular'} />
                    <span>{t('strainsView.favorites')}</span>
                </button>
                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                {(['Sativa', 'Indica', 'Hybrid'] as StrainType[]).map(type => (
                    <button key={type} onClick={() => onToggleTypeFilter(type)} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 ${typeFilter.has(type) ? 'bg-primary-500/80 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                        {t(`strainsView.${type.toLowerCase()}`)}
                    </button>
                ))}
                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                <button onClick={onOpenDrawer} className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors flex-shrink-0 bg-slate-800 text-slate-200 hover:bg-slate-700">
                    <PhosphorIcons.FunnelSimple />
                    <span>{t('strainsView.advancedFilters')}</span>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
                {isAnyFilterActive && (
                    <Button onClick={onClearAllFilters} variant="secondary" size="sm" className="ml-2 flex-shrink-0 !py-1 !px-2.5">
                        <PhosphorIcons.X className="w-4 h-4 mr-1" />
                        {t('common.all')}
                    </Button>
                )}
            </div>

            <div className="sm:hidden mt-4 flex items-center gap-2">
                <Button onClick={onAdd} variant="primary" className="flex-1">
                    <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1.5" />
                    <span>{t('strainsView.addStrain')}</span>
                </Button>
                <Button onClick={onExport} variant="secondary" className="flex-1">
                    <PhosphorIcons.DownloadSimple className="w-5 h-5 mr-1.5" />
                    <span>{t('common.export')}</span>
                </Button>
                 <Button onClick={() => onViewModeChange(viewMode === 'list' ? 'grid' : 'list')} title={t('strainsView.toggleView')} variant="secondary" className="p-2.5">
                     <span className="sr-only">{t('strainsView.toggleView')}</span>
                    {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}
                </Button>
            </div>
        </>
    );
};
