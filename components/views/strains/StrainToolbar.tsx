import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/ThemePrimitives';
import { useAppDispatch } from '@/stores/store';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { StrainType } from '@/types';
import { SegmentedControl } from '@/components/common/SegmentedControl';

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
    
    // Hide the "Reset" button if the only active filter is a single type toggle, as it's redundant.
    const isOnlyOneTypeFilterActive =
        searchTerm.trim() === '' &&
        activeFilterCount === 0 &&
        typeFilter.length === 1 &&
        isAnyFilterActive; // Ensure it's actually active

    const shouldShowResetButton = isAnyFilterActive && !isOnlyOneTypeFilterActive;


    return (
        <div className="space-y-4">
            {/* NEW Desktop Toolbar - Compact Layout */}
            <div className="hidden sm:flex items-center gap-4">
                {/* Search Bar with Clear Button */}
                <div className="relative flex-grow min-w-[250px] max-w-xs">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder={t('strainsView.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="pl-10 pr-10 !py-2"
                    />
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5 rounded-full absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => onSearchTermChange('')}
                            aria-label={t('strainsView.clearSearch')}
                        >
                            <PhosphorIcons.X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Type Filters */}
                <SegmentedControl
                    options={[
                        { value: 'Sativa', label: t('strainsView.sativa') },
                        { value: 'Indica', label: t('strainsView.indica') },
                        { value: 'Hybrid', label: t('strainsView.hybrid') },
                    ]}
                    value={typeFilter}
                    onToggle={onToggleTypeFilter}
                    buttonClassName="!py-1"
                />

                {/* Spacer to push remaining items to the right */}
                <div className="ml-auto flex items-center gap-2">
                    {/* Advanced Filters Button */}
                    <Button onClick={onOpenDrawer} variant="secondary" className="relative !py-2">
                        <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                        {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{activeFilterCount}</span>}
                    </Button>

                    {/* Reset Filters Button (conditional) */}
                    {shouldShowResetButton && <Button variant="ghost" onClick={onResetFilters} className="!py-2">{t('strainsView.resetFilters')}</Button>}

                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>

                    {/* View Toggles */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('list'))} className="!p-1.5" aria-label={t('strainsView.viewModes.list')}><PhosphorIcons.ListBullets className="w-5 h-5" /></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('grid'))} className="!p-1.5" aria-label={t('strainsView.viewModes.grid')}><PhosphorIcons.GridFour className="w-5 h-5" /></Button>
                    </div>

                    {/* Action Buttons */}
                    <Button onClick={onExport} variant="secondary" className="!py-2 !px-3" title={t('common.export')}>
                        <PhosphorIcons.DownloadSimple className="w-5 h-5" />
                    </Button>
                    <Button onClick={onAdd} variant="primary" className="!py-2 !px-3" title={t('strainsView.addStrain')}>
                        <PhosphorIcons.PlusCircle className="w-5 h-5" />
                    </Button>
                </div>
            </div>

             {/* Mobile Toolbar */}
            <div className="sm:hidden flex items-center gap-2">
                <div className="relative flex-grow">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input type="text" placeholder={t('strainsView.searchPlaceholder')} value={searchTerm} onChange={e => onSearchTermChange(e.target.value)} className="pl-10 pr-10 !py-2"/>
                     {searchTerm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="!p-1.5 rounded-full absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => onSearchTermChange('')}
                            aria-label={t('strainsView.clearSearch')}
                        >
                            <PhosphorIcons.X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={onOpenDrawer} variant="secondary" className="relative !p-2.5">
                        <PhosphorIcons.FunnelSimple className="w-5 h-5"/>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                     <Button onClick={() => dispatch(setStrainsViewMode(viewMode === 'list' ? 'grid' : 'list'))} title={t('strainsView.toggleView')} variant="secondary" className="!p-2.5">
                        <span className="sr-only">{t('strainsView.toggleView')}</span>
                        {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListBullets className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};