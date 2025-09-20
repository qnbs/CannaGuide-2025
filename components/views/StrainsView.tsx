import React, { useState, useCallback, useEffect, useId, useMemo } from 'react';
import { Strain, PlantStage, View, GrowSetup, ExportSource, ExportFormat, Plant, SortDirection } from '../../types';
import { GrowSetupModal } from './plants/GrowSetupModal';
import { useNotifications } from '../../context/NotificationContext';
import { useFavorites } from '../../hooks/useFavorites';
import { ExportModal } from './strains/ExportModal';
import { exportService } from '../../services/exportService';
import { AddStrainModal } from './strains/AddStrainModal';
import { useExportsManager } from '../../hooks/useExportsManager';
import { ExportsManagerView } from './strains/ExportsManagerView';
import { useTranslations } from '../../hooks/useTranslations';
import { SkeletonLoader } from '../common/SkeletonLoader';
import StrainListItem from './strains/StrainListItem';
import StrainGridItem from './strains/StrainGridItem';
import { useStrainFilters, SortKey } from '../../hooks/useStrainFilters';
import { strainService } from '../../services/strainService';
import { Tabs } from '../common/Tabs';
import { usePlants } from '../../hooks/usePlants';
import { storageService } from '../../services/storageService';
import StrainDetailModal from './strains/StrainDetailModal';
import AdvancedFilterModal from './strains/AdvancedFilterModal';
import { Button } from '../common/Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useSettings } from '../../hooks/useSettings';
import { LIST_GRID_CLASS } from './strains/constants';

type StrainViewTab = 'all' | 'user' | 'exports';
type ViewMode = 'list' | 'grid';

const USER_STRAINS_KEY = 'user_added_strains';

interface StrainsViewProps {
  setActiveView: (view: View) => void;
}

export const StrainsView: React.FC<StrainsViewProps> = ({ setActiveView }) => {
  const { t } = useTranslations();
  const { settings } = useSettings();
  const { addNotification } = useNotifications();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { savedExports, addExport, deleteExport } = useExportsManager();
  const { plants, setPlants } = usePlants();
  const searchInputId = useId();
  const selectAllId = useId();
  
  const [baseStrains, setBaseStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userStrains, setUserStrains] = useState<Strain[]>(() => 
    storageService.getItem(USER_STRAINS_KEY, [])
  );

  useEffect(() => {
    const fetchStrains = async () => {
      try {
        setIsLoading(true);
        const fetchedStrains = await strainService.getAllStrains();
        setBaseStrains(fetchedStrains);
        setError(null);
      } catch (err) {
        setError(t('strainsView.noStrainsFound.fetchError'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStrains();
  }, [t]);

  const translatedBaseStrains = useMemo(() => {
    return baseStrains.map(strain => ({
        ...strain,
        description: t(`strainsData.${strain.id}.description`),
        typeDetails: t(`strainsData.${strain.id}.typeDetails`),
        genetics: t(`strainsData.${strain.id}.genetics`),
        aromas: t(`strainsData.${strain.id}.aromas`),
        dominantTerpenes: t(`strainsData.${strain.id}.dominantTerpenes`),
    }));
  }, [baseStrains, t]);

  const combinedStrains = React.useMemo(() => 
    [...translatedBaseStrains, ...userStrains].sort((a, b) => a.name.localeCompare(b.name)),
    [translatedBaseStrains, userStrains]
  );
  
  const [activeTab, setActiveTab] = useState<StrainViewTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(settings.strainsViewSettings.defaultViewMode);
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [strainToGrow, setStrainToGrow] = useState<Strain | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddStrainModalOpen, setIsAddStrainModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [strainToEdit, setStrainToEdit] = useState<Strain | null>(null);
  
  const strainsToDisplay = React.useMemo(() => 
    (activeTab === 'all' ? combinedStrains : userStrains), 
    [activeTab, combinedStrains, userStrains]
  );

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
      handleApplyAdvancedFilters
  } = useStrainFilters(strainsToDisplay, favoriteIds, {
      key: settings.strainsViewSettings.defaultSortKey,
      direction: settings.strainsViewSettings.defaultSortDirection
  });

  const allTerpenes = React.useMemo(() => Array.from(new Set(combinedStrains.flatMap(s => s.dominantTerpenes || []))).sort(), [combinedStrains]);
  const allAromas = React.useMemo(() => Array.from(new Set(combinedStrains.flatMap(s => s.aromas || []))).sort(), [combinedStrains]);

  const handleStartGrowingRequest = (strain: Strain) => {
    setStrainToGrow(strain);
    setIsSetupModalOpen(true);
  };

  const handleAddStrain = (newStrain: Strain) => {
    const updatedUserStrains = [...userStrains, newStrain];
    storageService.setItem(USER_STRAINS_KEY, updatedUserStrains);
    setUserStrains(updatedUserStrains);
    setIsAddStrainModalOpen(false);
    addNotification(t('strainsView.addStrainModal.addStrainSuccess', { name: newStrain.name }), 'success');
    setActiveTab('user');
  };

  const handleUpdateStrain = (updatedStrain: Strain) => {
    const updatedUserStrains = userStrains.map(s => s.id === updatedStrain.id ? updatedStrain : s);
    storageService.setItem(USER_STRAINS_KEY, updatedUserStrains);
    setUserStrains(updatedUserStrains);
    setIsAddStrainModalOpen(false);
    setStrainToEdit(null);
    addNotification(t('strainsView.addStrainModal.editSuccess', { name: updatedStrain.name }), 'success');
  };

  const handleDeleteStrain = (strainId: string) => {
      const strainToDelete = userStrains.find(s => s.id === strainId);
      if (strainToDelete && window.confirm(t('strainsView.deleteStrainConfirm', { name: strainToDelete.name }))) {
          const updatedUserStrains = userStrains.filter(s => s.id !== strainId);
          storageService.setItem(USER_STRAINS_KEY, updatedUserStrains);
          setUserStrains(updatedUserStrains);
          addNotification(t('strainsView.deleteStrainSuccess', { name: strainToDelete.name }), 'success');
      }
  };

  const openEditStrainModal = (strain: Strain) => {
      setStrainToEdit(strain);
      setIsAddStrainModalOpen(true);
  };
  
  const handleStartGrowingConfirm = (setup: GrowSetup) => {
    if (!strainToGrow) return;
    const firstEmptySlot = plants.findIndex(p => p === null);
    if (firstEmptySlot === -1) {
      addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
      return;
    }
    const now = Date.now();
    const initialVitals = { substrateMoisture: 80, ph: 6.5, ec: 0.2 };
    const newPlant: Plant = {
      id: `${strainToGrow.id}-${now}`, name: strainToGrow.name, strain: strainToGrow, stage: PlantStage.Seed, age: 0, height: 0, startedAt: now, lastUpdated: now, growSetup: setup, vitals: initialVitals, stressLevel: 0,
      environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
      problems: [],
      journal: [{ id: `sys-${now}`, timestamp: now, type: 'SYSTEM', notes: `${t('plantsView.notifications.startSuccess', { name: strainToGrow.name })}` }],
      tasks: [], history: [{ day: 0, vitals: initialVitals, stressLevel: 0, height: 0 }],
    };
    const newPlants = [...plants];
    newPlants[firstEmptySlot] = newPlant;
    setPlants(newPlants);
    setStrainToGrow(null);
    setIsSetupModalOpen(false);
    setSelectedStrain(null);
    setActiveView(View.Plants);
    addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
  };

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  }, []);

  const toggleSelectAll = () => setSelectedIds(prev => prev.size === sortedAndFilteredStrains.length ? new Set() : new Set(sortedAndFilteredStrains.map(s => s.id)));

  const handleExport = (source: ExportSource, format: ExportFormat) => {
    let dataToExport: Strain[] = [];
    const filename = `cannabis-strains-${source}-${new Date().toISOString().split('T')[0]}`;
    switch(source) {
        case 'selected': dataToExport = combinedStrains.filter(s => selectedIds.has(s.id)); break;
        case 'favorites': dataToExport = combinedStrains.filter(s => favoriteIds.has(s.id)); break;
        case 'filtered': dataToExport = sortedAndFilteredStrains; break;
        case 'all': dataToExport = combinedStrains; break;
    }
    if (dataToExport.length === 0) { addNotification(t('common.noDataToExport'), 'error'); return; }

    if (!window.confirm(t('strainsView.exportModal.exportConfirm', { count: dataToExport.length, format: format.toUpperCase() }))) {
        return;
    }

    addExport({ name: filename, format, source }, dataToExport.map(s => s.id));
    
    switch(format) {
        case 'json': exportService.exportAsJSON(dataToExport, filename); break;
        case 'csv': exportService.exportAsCSV(dataToExport, filename); break;
        case 'pdf': exportService.exportAsPDF(dataToExport, filename, t); break;
        case 'txt': exportService.exportAsTXT(dataToExport, filename, t); break;
    }
    addNotification(t('common.successfullyExported', { count: dataToExport.length, format: format.toUpperCase() }), 'success');
  };
  
  const tableHeaders = useMemo(() => ([
      { key: 'name', label: t('strainsView.table.name'), visible: true },
      { key: 'type', label: t('strainsView.table.type'), visible: settings.strainsViewSettings.visibleColumns.type },
      { key: 'thc', label: t('strainsView.table.thc'), visible: settings.strainsViewSettings.visibleColumns.thc },
      { key: 'cbd', label: t('strainsView.table.cbd'), visible: settings.strainsViewSettings.visibleColumns.cbd },
      { key: 'floweringTime', label: t('strainsView.table.flowering'), visible: settings.strainsViewSettings.visibleColumns.floweringTime },
      { key: 'yield', label: t('strainsView.addStrainModal.yield'), visible: settings.strainsViewSettings.visibleColumns.yield },
      { key: 'difficulty', label: t('strainsView.table.level'), visible: settings.strainsViewSettings.visibleColumns.difficulty },
  ].filter(h => h.visible)), [t, settings.strainsViewSettings.visibleColumns]);


  const tabs = useMemo(() => [
    { id: 'all', label: t('strainsView.tabs.all'), icon: <PhosphorIcons.Leafy /> },
    { id: 'user', label: t('strainsView.tabs.user', { count: userStrains.length }), icon: <PhosphorIcons.Cube /> },
    { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }), icon: <PhosphorIcons.DownloadSimple /> },
  ], [t, userStrains.length, savedExports.length]);

  const memoizedToggleFavorite = useCallback(toggleFavorite, [toggleFavorite]);

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="space-y-2 p-1">
                <SkeletonLoader count={12} className="h-14 w-full" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">{error}</div>;
    }

    return (
        <>
            {activeTab === 'exports' ? (
                <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} allStrains={combinedStrains} />
            ) : (
                <div className="flex flex-col flex-grow min-h-0">
                    <div className="glass-pane rounded-lg flex flex-col flex-grow min-h-0">
                        {viewMode === 'list' && (
                             <div className={`${LIST_GRID_CLASS} sticky top-0 z-10 px-3 py-2 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase flex-shrink-0`}>
                                <input id={selectAllId} name="select-all" type="checkbox" aria-label="Select all" checked={selectedIds.size > 0 && selectedIds.size === sortedAndFilteredStrains.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500 justify-self-center"/>
                                <div aria-hidden="true" className="justify-self-center"><PhosphorIcons.Heart className="w-5 h-5"/></div>
                                {tableHeaders.map((header) => (
                                    <button
                                        key={header.key}
                                        onClick={() => !['yield'].includes(header.key) && filterControls.handleSort(header.key as SortKey)}
                                        className={`flex items-center gap-1 justify-start ${['yield'].includes(header.key) ? 'cursor-default' : ''}`}
                                    >
                                        {header.label}
                                        {filterState.sort.key === header.key && (filterState.sort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3"/> : <PhosphorIcons.ArrowDown className="w-3 h-3"/>)}
                                    </button>
                                ))}
                                <div className="text-left">{activeTab === 'user' ? t('common.actions') : ''}</div>
                            </div>
                        )}

                        <div className="flex-grow min-h-0 overflow-y-auto p-1">
                            {sortedAndFilteredStrains.length > 0 ? (
                                viewMode === 'list' ? (
                                    <div className="space-y-2">
                                    {sortedAndFilteredStrains.map((strain, index) => (
                                        <StrainListItem
                                            key={strain.id}
                                            strain={strain}
                                            index={index}
                                            isSelected={selectedIds.has(strain.id)}
                                            isFavorite={favoriteIds.has(strain.id)}
                                            onSelect={setSelectedStrain}
                                            onToggleSelection={toggleSelection}
                                            onToggleFavorite={memoizedToggleFavorite}
                                            visibleColumns={settings.strainsViewSettings.visibleColumns}
                                            isUserStrain={activeTab === 'user'}
                                            onEdit={openEditStrainModal}
                                            onDelete={handleDeleteStrain}
                                        />
                                    ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                                        {sortedAndFilteredStrains.map(strain => (
                                            <StrainGridItem
                                                key={strain.id}
                                                strain={strain}
                                                isFavorite={favoriteIds.has(strain.id)}
                                                onSelect={setSelectedStrain}
                                                onToggleFavorite={memoizedToggleFavorite}
                                                isUserStrain={activeTab === 'user'}
                                                onEdit={openEditStrainModal}
                                                onDelete={handleDeleteStrain}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : activeTab === 'user' ? (
                                <div className="text-center p-8 text-slate-400 flex flex-col items-center">
                                    <PhosphorIcons.Leafy className="w-16 h-16 text-slate-500 mb-4" />
                                    <h3 className="font-semibold text-lg">{t('strainsView.noUserStrains.title')}</h3>
                                    <p className="text-sm max-w-xs">{t('strainsView.noUserStrains.subtitle')}</p>
                                    <Button size="sm" onClick={() => setIsAddStrainModalOpen(true)} className="mt-4">{t('strainsView.noUserStrains.button')}</Button>
                                </div>
                            ) : (
                                 <div className="text-center p-8 text-slate-400 flex flex-col items-center">
                                    <PhosphorIcons.MagnifyingGlass className="w-16 h-16 text-slate-500 mb-4" />
                                    <h3 className="font-semibold text-lg">{t('strainsView.noStrainsFound.title')}</h3>
                                    <p className="text-sm">{t('strainsView.noStrainsFound.subtitle')}</p>
                                    {filterState.searchTerm && <p className="text-sm mt-1">{t('strainsView.noStrainsFound.for', { term: filterState.searchTerm })}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
  };

    return (
        <div className="flex flex-col h-full">
          {selectedStrain && (
            <StrainDetailModal
              strain={selectedStrain}
              isFavorite={favoriteIds.has(selectedStrain.id)}
              onClose={() => setSelectedStrain(null)}
              onToggleFavorite={toggleFavorite}
              onStartGrowing={handleStartGrowingRequest}
              plants={plants}
              onSelectSimilarStrain={setSelectedStrain}
              allStrains={combinedStrains}
            />
          )}
          {isSetupModalOpen && strainToGrow && (
            <GrowSetupModal
              strain={strainToGrow}
              onClose={() => setIsSetupModalOpen(false)}
              onConfirm={handleStartGrowingConfirm}
            />
          )}
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onExport={handleExport}
            selectionCount={selectedIds.size}
            favoritesCount={favoriteIds.size}
            filteredCount={sortedAndFilteredStrains.length}
            totalCount={combinedStrains.length}
          />
          <AddStrainModal
            isOpen={isAddStrainModalOpen}
            onClose={() => {
                setIsAddStrainModalOpen(false);
                setStrainToEdit(null);
            }}
            onAddStrain={handleAddStrain}
            onUpdateStrain={handleUpdateStrain}
            strainToEdit={strainToEdit}
          />
          <AdvancedFilterModal
            isOpen={isAdvancedFilterModalOpen}
            onClose={() => setIsAdvancedFilterModalOpen(false)}
            onApply={handleApplyAdvancedFilters}
            tempFilterState={tempFilterState}
            setTempFilterState={setTempFilterState}
            allAromas={allAromas}
            allTerpenes={allTerpenes}
            count={previewFilteredStrains.length}
          />
          
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0 mb-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={(id) => setActiveTab(id as StrainViewTab)} />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow">
                    <div className="relative flex-grow">
                        <label htmlFor={searchInputId} className="sr-only">{t('strainsView.searchPlaceholder')}</label>
                        <input id={searchInputId} type="text" placeholder={t('strainsView.searchPlaceholder')} value={filterState.searchTerm} onChange={(e) => filterControls.setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    {activeTab === 'user' && (
                        <Button size="sm" onClick={() => setIsAddStrainModalOpen(true)}>
                            <PhosphorIcons.PlusCircle className="inline w-5 h-5 mr-1.5"/>
                            {t('common.add')}
                        </Button>
                    )}
                     <details className="relative group">
                        <summary className="p-2 list-none rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
                            <PhosphorIcons.DotsThreeVertical weight="bold" className="w-5 h-5" />
                            <span className="sr-only">{t('common.actions')}</span>
                        </summary>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 p-2 space-y-1 opacity-0 pointer-events-none group-open:opacity-100 group-open:pointer-events-auto transition-opacity">
                            <Button variant="secondary" size="sm" onClick={() => setIsExportModalOpen(true)} className="w-full !justify-start">{t('common.export')}...</Button>
                            <button onClick={() => filterControls.setShowFavorites(prev => !prev)} className={`p-2 rounded-lg transition-colors flex items-center gap-2 w-full text-left text-sm ${filterState.showFavorites ? 'bg-primary-900/50 text-primary-300' : 'hover:bg-slate-700 text-slate-200'}`}>
                                <PhosphorIcons.Heart weight={filterState.showFavorites ? 'fill' : 'regular'} className="w-5 h-5" />
                                <span>{t('strainsView.footer.showFavorites', {count: favoriteIds.size})}</span>
                            </button>
                            <button onClick={openAdvancedFilterModal} className="p-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 w-full text-left text-sm text-slate-200">
                                <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                                <span>{t('strainsView.advancedFilters')}</span>
                            </button>
                             <div className="flex bg-slate-900 rounded-lg p-0.5 mt-1 border border-slate-700">
                                <button onClick={() => setViewMode('list')} title={t('strainsView.view.list')} className={`flex-1 p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-700 shadow-sm' : ''}`}><PhosphorIcons.ListChecks className="w-5 h-5" /></button>
                                <button onClick={() => setViewMode('grid')} title={t('strainsView.view.grid')} className={`flex-1 p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-700 shadow-sm' : ''}`}><PhosphorIcons.GridFour className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
          
          <div className="flex-grow min-h-0 flex flex-col">{renderContent()}</div>
        </div>
      );
};
