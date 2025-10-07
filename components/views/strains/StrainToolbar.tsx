import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/stores/store';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { StrainType } from '@/types';
import { SegmentedControl } from '@/components/common/SegmentedControl';
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
        searchTerm, onSearchTermChange, onExport, onAdd, 
        onOpenDrawer, activeFilterCount, viewMode, typeFilter,
        onToggleTypeFilter, isAnyFilterActive, onResetFilters
    } = props;
    
    const isOnlyOneTypeFilterActive =
        searchTerm.trim() === '' &&
        activeFilterCount === 0 &&
        typeFilter.length === 1 &&
        isAnyFilterActive; 

    const shouldShowResetButton = isAnyFilterActive && !isOnlyOneTypeFilterActive;


    return (
        <div className="space-y-4">
            {/* Desktop Toolbar - Compact Layout */}
            <div className="hidden sm:flex items-center gap-4">
                 <div className="flex-grow min-w-[250px] max-w-xs">
                    <SearchBar
                        placeholder={t('strainsView.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                    />
                </div>
                
                <Button onClick={onOpenDrawer} variant="secondary" className="relative !py-2.5">
                    <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                    {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{activeFilterCount}</span>}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('list'))} className="!p-1.5" aria-label={t('strainsView.viewModes.list')}><PhosphorIcons.ListBullets className="w-5 h-5" /></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('grid'))} className="!p-1.5" aria-label={t('strainsView.viewModes.grid')}><PhosphorIcons.GridFour className="w-5 h-5" /></Button>
                    </div>

                    <Button onClick={onExport} variant="secondary" className="!py-2.5 !px-3" title={t('common.export')}>
                        <PhosphorIcons.DownloadSimple className="w-5 h-5" />
                    </Button>
                    <Button onClick={onAdd} variant="primary" className="!py-2.5 !px-3" title={t('strainsView.addStrain')}>
                        <PhosphorIcons.PlusCircle className="w-5 h-5" />
                    </Button>
                </div>
            </div>

             {/* Mobile Toolbar */}
            <div className="sm:hidden space-y-4">
                <div className="flex items-center gap-2">
                    <div className="flex-grow">
                        <SearchBar
                            placeholder={t('strainsView.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => onSearchTermChange(e.target.value)}
                        />
                    </div>
                    <Button onClick={onOpenDrawer} variant="secondary" className="relative !p-2.5">
                        <PhosphorIcons.FunnelSimple className="w-5 h-5"/>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
             <SegmentedControl
                options={[
                    { value: 'Sativa', label: t('strainsView.sativa') },
                    { value: 'Indica', label: t('strainsView.indica') },
                    { value: 'Hybrid', label: t('strainsView.hybrid') },
                ]}
                value={typeFilter}
                onToggle={onToggleTypeFilter}
            />
        </div>
    );
};