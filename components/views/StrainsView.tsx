import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Strain, View, SortDirection, Plant, PlantStage, AIResponse } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFavorites } from '@/hooks/useFavorites';
import { useStrainFilters } from '@/hooks/useStrainFilters';
import { useUserStrains } from '@/hooks/useUserStrains';
import { useExportsManager } from '@/hooks/useExportsManager';
import { useStrainTips } from '@/hooks/useStrainTips';
import { usePlants } from '@/hooks/usePlants';
import { useSettings } from '@/hooks/useSettings';
import { useNotifications } from '@/context/NotificationContext';
import { strainService } from '@/services/strainService';
import { exportService } from '@/services/exportService';

import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { StrainDetailModal } from '@/components/views/strains/StrainDetailModal';
import { AddStrainModal } from '@/components/views/strains/AddStrainModal';
import { ExportModal } from '@/components/views/strains/ExportModal';
import { ExportsManagerView } from '@/components/views/strains/ExportsManagerView';
import StrainGridItem from '@/components/views/strains/StrainGridItem';
import StrainListItem from '@/components/views/strains/StrainListItem';
import { LIST_GRID_CLASS } from '@/components/views/strains/constants';
import AdvancedFilterModal from '@/components/views/strains/AdvancedFilterModal';
import { StrainTipsView } from '@/components/views/strains/StrainTipsView';


type StrainViewTab = 'all' | 'my-strains' | 'favorites' | 'exports' | 'tips';

interface StrainsViewProps {
    setActiveView: (view: View) => void;
}

export const StrainsView: React.FC<StrainsViewProps> = ({ setActiveView }) => {
    const { t } = useTranslations();
    const { addNotification } = useNotifications();
    const { settings } = useSettings();
    const { favoriteIds, toggleFavorite } = useFavorites();
    const { userStrains, addUserStrain, updateUserStrain, deleteUserStrain, isUserStrain } = useUserStrains();
    const { savedExports, addExport, deleteExport, updateExport } = useExportsManager();
    const { savedTips, addTip, updateTip, deleteTip } = useStrainTips();
    const { plants, setPlants } = usePlants();

    const [allStrains, setAllStrains] = useState<Strain[]>([]);
    const [activeTab, setActiveTab] = useState<StrainViewTab>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(settings.strainsViewSettings.defaultViewMode);
    
    const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
    const [strainToEdit, setStrainToEdit] = useState<Strain | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        strainService.getAllStrains().then(strains => {
            setAllStrains(strains);
            // After initial load, if user-strains tab is active but empty, switch to 'all'
            if (activeTab === 'my-strains' && userStrains.length === 0) {
                setActiveTab('all');
            }
        }).catch(err => {
            console.error("Failed to load strains:", err);
            addNotification(t('strainsView.loadError'), 'error');
        });
    }, [t, userStrains.length, activeTab, addNotification]);

    const strainsToDisplay = useMemo(() => {
        const combinedStrains = [...allStrains, ...userStrains];
        const uniqueStrains = Array.from(new Map(combinedStrains.map(s => [s.id, s])).values());
        
        switch (activeTab) {
            case 'all': return uniqueStrains;
            case 'my-strains': return userStrains;
            case 'favorites': return uniqueStrains.filter(s => favoriteIds.has(s.id));
            default: return uniqueStrains;
        }
    }, [activeTab, allStrains, userStrains, favoriteIds]);

    const {
        sortedAndFilteredStrains,
        filterControls,
        filterState,
        isAdvancedFilterModalOpen,
        setIsAdvancedFilterModalOpen,
        tempFilterState,
        setTempFilterState,
        previewFilteredStrains,
        openAdvancedFilterModal,
        handleApplyAdvancedFilters,
    } = useStrainFilters(strainsToDisplay, favoriteIds, {
        key: settings.strainsViewSettings.defaultSortKey as any,
        direction: settings.strainsViewSettings.defaultSortDirection as SortDirection,
    });
    
    const handleToggleAll = () => {
        if (selectedIds.size === sortedAndFilteredStrains.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedAndFilteredStrains.map(s => s.id)));
        }
    };
    
    const handleToggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const handleExport = (source: 'selected' | 'favorites' | 'filtered' | 'all', format: 'pdf' | 'txt' | 'csv' | 'json') => {
        let strainsToExport: Strain[] = [];
        let exportName = `CannaGuide_Export_${new Date().toISOString().split('T')[0]}`;
        
        const sourceStrains = [...allStrains, ...userStrains];

        switch(source) {
            case 'selected': strainsToExport = sourceStrains.filter(s => selectedIds.has(s.id)); break;
            case 'favorites': strainsToExport = sourceStrains.filter(s => favoriteIds.has(s.id)); break;
            case 'filtered': strainsToExport = sortedAndFilteredStrains; break;
            case 'all': strainsToExport = strainsToDisplay; break;
        }

        if (strainsToExport.length === 0) {
            addNotification(t('common.noDataToExport'), 'error');
            return;
        }

        exportName = `${t('strainsView.exportModal.sources.' + source)}-${strainsToExport.length}`;
        const strainIds = strainsToExport.map(s => s.id);
        
        const savedExport = addExport({ name: exportName, source, format }, strainIds);
        const fileName = `${savedExport.name}-${savedExport.id.slice(-4)}`;

        switch (format) {
            case 'pdf': exportService.exportAsPDF(strainsToExport, fileName, t); break;
            case 'txt': exportService.exportAsTXT(strainsToExport, fileName, t); break;
            case 'csv': exportService.exportAsCSV(strainsToExport, fileName, t); break;
            case 'json': exportService.exportAsJSON(strainsToExport, fileName); break;
        }
        
        addNotification(t('common.successfullyExported', { count: strainsToExport.length, format: format.toUpperCase() }), 'success');
    };
    
    const handleStartGrow = (setup: any, strain: Strain) => {
        const emptySlotIndex = plants.findIndex(p => p === null);

        if (emptySlotIndex === -1) {
            addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
            setSelectedStrain(null);
            return;
        }

        const now = Date.now();
        const newPlant: Plant = {
            id: `${strain.id}-${now}`,
            name: strain.name,
            strain,
            stage: PlantStage.Seed,
            age: 0,
            height: 0,
            startedAt: now,
            lastUpdated: now,
            growSetup: setup,
            vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 },
            environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
            stressLevel: 0,
            problems: [],
            journal: [{ id: `start-${now}`, timestamp: now, type: 'SYSTEM', notes: `Started growing ${strain.name}` }],
            tasks: [],
            history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }],
        };

        setPlants(prevPlants => {
            const newPlants = [...prevPlants];
            // Re-find index inside updater for safety against concurrent updates
            const firstEmptyIndex = newPlants.findIndex(p => p === null);
            if (firstEmptyIndex !== -1) {
                 newPlants[firstEmptyIndex] = newPlant;
            }
            return newPlants;
        });
        
        addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
        setActiveView(View.Plants);
        setSelectedStrain(null);
    };

    const handleSaveTip = (strain: Strain, tip: AIResponse) => {
        addTip(strain, tip);
    };

    const allAromas = useMemo(() => Array.from(new Set(strainsToDisplay.flatMap(s => s.aromas || []))).sort(), [strainsToDisplay]);
    const allTerpenes = useMemo(() => Array.from(new Set(strainsToDisplay.flatMap(s => s.dominantTerpenes || []))).sort(), [strainsToDisplay]);

    const tabs = [
        { id: 'all', label: t('strainsView.tabs.allStrains'), icon: <PhosphorIcons.Leafy /> },
        { id: 'my-strains', label: t('strainsView.tabs.myStrains'), icon: <PhosphorIcons.Star weight="fill" /> },
        { id: 'favorites', label: t('strainsView.tabs.favorites'), icon: <PhosphorIcons.Heart /> },
        { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.ArchiveBox /> },
        { id: 'tips', label: t('strainsView.tabs.tips', { count: savedTips.length }), icon: <PhosphorIcons.LightbulbFilament /> },
    ];
    
    return (
        <div className="space-y-4">
            {selectedStrain && <StrainDetailModal strain={selectedStrain} onClose={() => setSelectedStrain(null)} isFavorite={favoriteIds.has(selectedStrain.id)} onToggleFavorite={toggleFavorite} onStartGrow={(setup) => handleStartGrow(setup, selectedStrain)} onSaveTip={handleSaveTip} />}
            {isAddModalOpen && <AddStrainModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setStrainToEdit(null); }} onAddStrain={(s) => { addUserStrain(s); setIsAddModalOpen(false); }} onUpdateStrain={(s) => { updateUserStrain(s); setIsAddModalOpen(false); setStrainToEdit(null); }} strainToEdit={strainToEdit} />}
            {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} selectionCount={selectedIds.size} favoritesCount={favoriteIds.size} filteredCount={sortedAndFilteredStrains.length} totalCount={strainsToDisplay.length} />}
            {isAdvancedFilterModalOpen && <AdvancedFilterModal isOpen={isAdvancedFilterModalOpen} onClose={() => setIsAdvancedFilterModalOpen(false)} onApply={handleApplyAdvancedFilters} tempFilterState={tempFilterState} setTempFilterState={setTempFilterState} allAromas={allAromas} allTerpenes={allTerpenes} count={previewFilteredStrains.length}/>}
            
            <Card>
                 <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={id => setActiveTab(id as StrainViewTab)} />
            </Card>

            {['all', 'my-strains', 'favorites'].includes(activeTab) && (
                 <Card>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                         <div className="relative flex-grow">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input type="text" placeholder={t('strainsView.searchPlaceholder')} value={filterState.searchTerm} onChange={e => filterControls.setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={openAdvancedFilterModal} variant="secondary"><PhosphorIcons.FunnelSimple className="w-4 h-4 mr-1.5"/>{t('strainsView.advancedFilters')}</Button>
                            <Button onClick={() => filterControls.setShowFavorites(!filterState.showFavorites)} variant={filterState.showFavorites ? 'primary' : 'secondary'}><PhosphorIcons.Heart weight={filterState.showFavorites ? 'fill' : 'regular'} className="w-4 h-4 mr-1.5"/>{t('strainsView.favoritesOnly')}</Button>
                            <Button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} variant="secondary" aria-label="Toggle view mode">{viewMode === 'list' ? <PhosphorIcons.GridFour /> : <PhosphorIcons.ListBullets />}</Button>
                             <div className="flex items-center gap-2">
                                <Button onClick={() => setIsExportModalOpen(true)}><PhosphorIcons.DownloadSimple className="w-4 h-4 mr-1"/> {t('common.export')}</Button>
                                <Button onClick={() => { setStrainToEdit(null); setIsAddModalOpen(true); }}><PhosphorIcons.PlusCircle className="w-4 h-4 mr-1"/> {t('strainsView.addStrain')}</Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
           
            {activeTab === 'exports' && <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} updateExport={updateExport} allStrains={strainsToDisplay} onOpenExportModal={() => setIsExportModalOpen(true)} />}
            {activeTab === 'tips' && <StrainTipsView savedTips={savedTips} deleteTip={deleteTip} updateTip={updateTip} />}

            {['all', 'my-strains', 'favorites'].includes(activeTab) && (
                 viewMode === 'list' ? (
                     <div className="space-y-2">
                        <div className={`${LIST_GRID_CLASS} text-xs uppercase font-semibold text-slate-400 px-3 py-2`}>
                             <input type="checkbox" checked={selectedIds.size === sortedAndFilteredStrains.length && sortedAndFilteredStrains.length > 0} onChange={handleToggleAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                            <div />
                            <button className="text-left" onClick={() => filterControls.handleSort('name')}>{t('strainsView.table.strain')}</button>
                            {settings.strainsViewSettings.visibleColumns.type && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('type')}>{t('strainsView.table.type')}</button>}
                            {settings.strainsViewSettings.visibleColumns.thc && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('thc')}>{t('strainsView.table.thc')}</button>}
                            {settings.strainsViewSettings.visibleColumns.cbd && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('cbd')}>{t('strainsView.table.cbd')}</button>}
                            {settings.strainsViewSettings.visibleColumns.floweringTime && <button className="hidden sm:inline" onClick={() => filterControls.handleSort('floweringTime')}>{t('strainsView.table.flowering')}</button>}
                            {settings.strainsViewSettings.visibleColumns.yield && <button className="hidden md:inline" onClick={() => filterControls.handleSort('yield')}>{t('strainsView.table.yield')}</button>}
                            <button onClick={() => filterControls.handleSort('difficulty')}>{t('strainsView.table.level')}</button>
                            <div>{t('common.actions')}</div>
                        </div>
                        {sortedAndFilteredStrains.map((strain, index) => <StrainListItem key={strain.id} strain={strain} isSelected={selectedIds.has(strain.id)} isFavorite={favoriteIds.has(strain.id)} onSelect={setSelectedStrain} onToggleSelection={handleToggleSelection} onToggleFavorite={toggleFavorite} visibleColumns={settings.strainsViewSettings.visibleColumns} isUserStrain={isUserStrain(strain.id)} onEdit={(s) => { setStrainToEdit(s); setIsAddModalOpen(true); }} onDelete={deleteUserStrain} index={index}/>)}
                     </div>
                 ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sortedAndFilteredStrains.map((strain, index) => <StrainGridItem key={strain.id} strain={strain} isFavorite={favoriteIds.has(strain.id)} onSelect={setSelectedStrain} onToggleFavorite={toggleFavorite} isUserStrain={isUserStrain(strain.id)} onEdit={(s) => { setStrainToEdit(s); setIsAddModalOpen(true); }} onDelete={deleteUserStrain} index={index}/>)}
                     </div>
                 )
            )}
        </div>
    );
};