import React from 'react';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/ThemePrimitives';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { selectStrainsViewMode } from '@/stores/selectors';

interface StrainToolbarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    onExport: () => void;
    onAdd: () => void;
    onOpenDrawer: () => void;
    activeFilterCount: number;
}

export const StrainToolbar: React.FC<StrainToolbarProps> = (props) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const viewMode = useAppSelector(selectStrainsViewMode);
    const { 
        searchTerm, onSearchTermChange, onExport, onAdd, 
        onOpenDrawer, activeFilterCount
    } = props;
    
    return (
        <div className="space-y-4">
            {/* Desktop Toolbar */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="relative flex-grow">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input type="text" placeholder={t('strainsView.searchPlaceholder')} value={searchTerm} onChange={e => onSearchTermChange(e.target.value)} className="pl-10 pr-4 !py-2"/>
                </div>

                <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                       <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('list'))} className="!p-1.5" aria-label={t('strainsView.viewModes.list')}><PhosphorIcons.ListBullets className="w-5 h-5" /></Button>
                       <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => dispatch(setStrainsViewMode('grid'))} className="!p-1.5" aria-label={t('strainsView.viewModes.grid')}><PhosphorIcons.GridFour className="w-5 h-5" /></Button>
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

             {/* Mobile Toolbar */}
            <div className="sm:hidden flex items-center gap-2">
                <div className="relative flex-grow">
                    <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <Input type="text" placeholder={t('strainsView.searchPlaceholder')} value={searchTerm} onChange={e => onSearchTermChange(e.target.value)} className="pl-10 pr-4 !py-2"/>
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
