import React, { useState, useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { Strain, PlantStage, View, GrowSetup, ExportSource, ExportFormat, Plant, SortDirection } from '../../types';
import { GrowSetupModal } from './plants/GrowSetupModal';
import { useNotifications } from '../../context/NotificationContext';
import { useFavorites } from '../../hooks/useFavorites';
import { ExportModal } from './strains/ExportModal';
import { exportService } from '../../services/exportService';
import { AddStrainModal } from './strains/AddStrainModal';
import { useExportsManager } from '../../hooks/useExportsManager';
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
import { ExportsManagerView } from './strains/ExportsManagerView';

type StrainViewTab = 'all' | 'user' | 'exports';
type ViewMode = 'list' | 'grid';

const USER_STRAINS_KEY = 'user_added_strains';

// A small, reusable component to display a consistent "not found" message.
const NoStrainsFoundMessage: React.FC = () => {
    const { t } = useTranslations();
    return (
        <div className="col-span-full text-center py-16 text-slate-500">
            <h3 className="font-semibold text-lg">{t('strainsView.noStrainsFound.title')}</h3>
            <p>{t('strainsView.noStrainsFound.subtitle')}</p>
        </div>
    );
};

const SkeletonList: React.FC = () => (
    <div className="space-y-2 mt-2">
        {Array.from({ length: 10 }).map((_, i) => (
             <div key={i} className={`${LIST_GRID_CLASS} glass-pane rounded-lg h-14`}>
                 <div className="flex items-center justify-center px-3 py-3"><SkeletonLoader className="h-4 w-4 rounded" /></div>
                 <div className="flex items-center justify-center px-3 py-3"><SkeletonLoader className="h-5 w-5 rounded-full" /></div>
                 <div className="px-3 py-3 space-y-1.5"><SkeletonLoader className="h-4 w-3/4 rounded" /><SkeletonLoader className="h-3 w-1/2 rounded sm:hidden" /></div>
                 <div className="hidden sm:flex items-center px-3 py-3"><SkeletonLoader className="h-6 w-6 rounded-full" /></div>
                 <div className="hidden sm:flex items-center px-3 py-3"><SkeletonLoader className="h-4 w-10 rounded" /></div>
                 <div className="hidden sm:flex items-center px-3 py-3"><SkeletonLoader className="h-4 w-10 rounded" /></div>
                 <div className="hidden sm:flex items-center px-3 py-3"><SkeletonLoader className="h-4 w-20 rounded" /></div>
                 <div className="hidden md:flex items-center px-3 py-3"><SkeletonLoader className="h-4 w-24 rounded" /></div>
                 <div className="flex items-center px-3 py-3"><SkeletonLoader className="h-5 w-12 rounded" /></div>
             </div>
        ))}
    </div>
);


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
  
  const [allStrains, setAllStrains] = useState<Strain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userStrains, setUserStrains] = useState<Strain[]>(() => 
    storageService.getItem(USER_STRAINS_KEY, [])
  );
  
  // Initialize the strain service and fetch all translated data on mount.
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        setIsLoading(true);
        // init() centralizes translation and indexing for performance.
        await strainService.init(t);
        const strains = await strainService.getAllStrains();
        setAllStrains(strains);
        setError(null);
      } catch (err) {
        setError(t('strainsView.noStrainsFound.fetchError'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeAndFetch();
  }, [t]);

  // The final, combined list of strains for display and filtering.
  const combinedStrains = useMemo(() => {
     // Create a Set of user strain IDs for efficient lookup
    const userStrainIds = new Set(userStrains.map(s => s.id));
    // Filter out base strains that have been overridden by user-added strains with the same ID
    const uniqueBaseStrains = allStrains.filter(s => !userStrainIds.has(s.id));
    return [...uniqueBaseStrains, ...userStrains];
  }, [allStrains, userStrains]);
  
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
    setUserStrains(updatedUserStrains);
    storageService.setItem(USER_STRAINS_KEY, updatedUserStrains);
    setStrainToEdit(null);
    setIsAddStrainModalOpen(false);
    addNotification(t('strainsView.addStrainModal.editSuccess', { name: updatedStrain.name }), 'success');
  };

  const handleDeleteStrain = (id: string) => {
    const strainToDelete = userStrains.find(s => s.id === id);
    if (!strainToDelete) return;

    if (window.confirm(t('strainsView.deleteStrainConfirm', { name: strainToDelete.name }))) {
        const updatedUserStrains = userStrains.filter(s => s.id !== id);
        setUserStrains(updatedUserStrains);
        storageService.setItem(USER_STRAINS_KEY, updatedUserStrains);
        addNotification(t('strainsView.deleteStrainSuccess', { name: strainToDelete.name }), 'info');
    }
  };

  const handleToggleSelection = useCallback((id: string) => {
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

  const isAllSelected = useMemo(() => 
    sortedAndFilteredStrains.length > 0 && selectedIds.size === sortedAndFilteredStrains.length,
    [selectedIds, sortedAndFilteredStrains]
  );

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAndFilteredStrains.map(s => s.id)));
    }
  }, [isAllSelected, sortedAndFilteredStrains]);

  const handleStartGrowing = (growSetup: GrowSetup) => {
    if (!strainToGrow) return;

    const availableSlotIndex = plants.findIndex(p => p === null);
    if (availableSlotIndex === -1) {
      addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
      setIsSetupModalOpen(false);
      return;
    }

    const newPlant: Plant = {
      id: `${strainToGrow.id}-${Date.now()}`,
      name: strainToGrow.name,
      strain: strainToGrow,
      stage: PlantStage.Seed,
      age: 0,
      height: 0,
      startedAt: Date.now(),
      lastUpdated: Date.now(),
      growSetup,
      vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 },
      environment: { temperature: growSetup.temperature, humidity: growSetup.humidity, light: 100 },
      stressLevel: 0,
      problems: [],
      journal: [{ id: `sys-${Date.now()}`, timestamp: Date.now(), type: 'SYSTEM', notes: 'Grow started.' }],
      tasks: [],
      history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }]
    };

    const newPlants = [...plants];
    newPlants[availableSlotIndex] = newPlant;
    setPlants(newPlants);

    addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
    setIsSetupModalOpen(false);
    setStrainToGrow(null);
    setActiveView(View.Plants);
  };

  const handleExport = (source: ExportSource, format: ExportFormat) => {
    let strainsToExport: Strain[] = [];
    let sourceKey = source;

    switch (source) {
      case 'selected':
        strainsToExport = combinedStrains.filter(s => selectedIds.has(s.id));
        break;
      case 'favorites':
        strainsToExport = combinedStrains.filter(s => favoriteIds.has(s.id));
        break;
      case 'filtered':
        strainsToExport = sortedAndFilteredStrains;
        break;
      case 'all':
        strainsToExport = combinedStrains;
        break;
    }
    
    if (strainsToExport.length === 0) {
        addNotification(t('common.noDataToExport'), 'info');
        return;
    }
    
    try {
        const exportName = `${t('strainsView.exportModal.filenamePrefix')} - ${t(`strainsView.exportModal.sources.${sourceKey}`)} - ${new Date().toLocaleDateString()}`;
        
        const savedExport = addExport({ name: exportName, source, format }, strainsToExport.map(s => s.id));

        const fileName = savedExport.name.replace(/\s/g, '_');
        switch (format) {
        case 'json': exportService.exportAsJSON(strainsToExport, fileName); break;
        case 'csv': exportService.exportAsCSV(strainsToExport, fileName, t); break;
        case 'pdf': exportService.exportAsPDF(strainsToExport, fileName, t); break;
        case 'txt': exportService.exportAsTXT(strainsToExport, fileName, t); break;
        }
        addNotification(t('common.successfullyExported', { count: strainsToExport.length, format: format.toUpperCase() }), 'success');
    } catch (error) {
        console.error("Export failed:", error);
        addNotification(t('common.exportError'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Modals */}
      {selectedStrain && (
        <StrainDetailModal
          strain={selectedStrain}
          onClose={() => setSelectedStrain(null)}
          isFavorite={favoriteIds.has(selectedStrain.id)}
          onToggleFavorite={toggleFavorite}
          onStartGrowing={handleStartGrowingRequest}
          plants={plants}
          allStrains={combinedStrains}
          onSelectSimilarStrain={setSelectedStrain}
        />
      )}
      {isSetupModalOpen && strainToGrow && (
        <GrowSetupModal
          strain={strainToGrow}
          onClose={() => setIsSetupModalOpen(false)}
          onConfirm={handleStartGrowing}
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
        onClose={() => { setIsAddStrainModalOpen(false); setStrainToEdit(null); }}
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

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: t('strainsView.tabs.all') },
          { id: 'user', label: t('strainsView.tabs.user', { count: userStrains.length }) },
          { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }) },
        ]}
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as StrainViewTab)}
      />

      {activeTab === 'exports' ? (
        <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} allStrains={combinedStrains} />
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <label htmlFor={searchInputId} className="sr-only">{t('strainsView.searchPlaceholder')}</label>
              <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id={searchInputId}
                type="text"
                placeholder={t('strainsView.searchPlaceholder')}
                value={filterState.searchTerm}
                onChange={(e) => filterControls.setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openAdvancedFilterModal}>
                <PhosphorIcons.FunnelSimple className="w-5 h-5 mr-1" />
                {t('strainsView.advancedFilters')}
              </Button>
              <Button variant="secondary" onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}>
                {viewMode === 'list' ? <PhosphorIcons.GridFour className="w-5 h-5" /> : <PhosphorIcons.ListChecks className="w-5 h-5" />}
              </Button>
              <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
                <PhosphorIcons.DownloadSimple className="w-5 h-5" />
              </Button>
               {activeTab === 'user' && (
                  <Button onClick={() => { setStrainToEdit(null); setIsAddStrainModalOpen(true); }}>
                      <PhosphorIcons.PlusCircle className="w-5 h-5 mr-1" /> {t('common.add')}
                  </Button>
               )}
            </div>
          </div>
          
          {/* List/Grid */}
          {isLoading ? (
            <SkeletonList />
          ) : error ? (
            <div className="text-center py-10 text-slate-400">{error}</div>
          ) : (
            <>
              {viewMode === 'list' && (
                <div className="overflow-x-auto">
                    <div className={`${LIST_GRID_CLASS} sticky top-0 bg-slate-900 z-10 py-2 border-b border-slate-700 font-semibold text-xs text-slate-400 uppercase`}>
                        <div className="px-3">
                            <input id={selectAllId} type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500" />
                        </div>
                        <div className="px-3"><PhosphorIcons.Heart className="w-5 h-5" /></div>
                        {['name', 'type', 'thc', 'cbd', 'floweringTime', 'yield', 'difficulty'].map(key => (
                           (key !== 'yield' || settings.strainsViewSettings.visibleColumns.yield) && (settings.strainsViewSettings.visibleColumns[key as keyof typeof settings.strainsViewSettings.visibleColumns] || key === 'name' || key === 'difficulty') ? (
                            <button key={key} onClick={() => filterControls.handleSort(key as SortKey)} className={`px-3 py-1 flex items-center gap-1 ${key === 'type' ? 'hidden sm:flex' : ''} ${key === 'yield' ? 'hidden md:flex' : ''} ${['thc', 'cbd', 'floweringTime'].includes(key) ? 'hidden sm:flex' : ''}`}>
                                {t(`strainsView.table.${key === 'floweringTime' ? 'flowering' : key === 'difficulty' ? 'level' : key}`)}
                                {filterState.sort.key === key && (filterState.sort.direction === 'asc' ? <PhosphorIcons.ArrowUp /> : <PhosphorIcons.ArrowDown />)}
                            </button>
                           ) : null
                        ))}
                        <div className="px-3">{t('common.actions')}</div>
                    </div>
                    <div className="space-y-2 mt-2">
                        {sortedAndFilteredStrains.length > 0 ? sortedAndFilteredStrains.map((strain, index) => (
                            <StrainListItem
                                key={strain.id}
                                strain={strain}
                                isSelected={selectedIds.has(strain.id)}
                                isFavorite={favoriteIds.has(strain.id)}
                                onSelect={setSelectedStrain}
                                onToggleSelection={handleToggleSelection}
                                onToggleFavorite={toggleFavorite}
                                visibleColumns={settings.strainsViewSettings.visibleColumns}
                                isUserStrain={userStrains.some(s => s.id === strain.id)}
                                onEdit={(s) => { setStrainToEdit(s); setIsAddStrainModalOpen(true); }}
                                onDelete={handleDeleteStrain}
                                index={index}
                            />
                        )) : (
                          <NoStrainsFoundMessage />
                        )}
                    </div>
                </div>
              )}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedAndFilteredStrains.length > 0 ? sortedAndFilteredStrains.map((strain, index) => (
                        <StrainGridItem
                            key={strain.id}
                            strain={strain}
                            isFavorite={favoriteIds.has(strain.id)}
                            onSelect={setSelectedStrain}
                            onToggleFavorite={toggleFavorite}
                            isUserStrain={userStrains.some(s => s.id === strain.id)}
                            onEdit={(s) => { setStrainToEdit(s); setIsAddStrainModalOpen(true); }}
                            onDelete={handleDeleteStrain}
                            index={index}
                        />
                    )) : (
                      <NoStrainsFoundMessage />
                    )}
                </div>
              )}
            </>
          )}
          
          <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm py-2 px-4 rounded-lg flex justify-between items-center text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filterState.showFavorites} onChange={(e) => filterControls.setShowFavorites(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"/>
              {t('strainsView.footer.showFavorites', { count: favoriteIds.size })}
            </label>
            <span className="text-slate-400">{t('strainsView.matchingStrains', { count: sortedAndFilteredStrains.length })}</span>
          </div>
        </>
      )}
    </div>
  );
};