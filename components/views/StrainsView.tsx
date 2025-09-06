// FIX: Import useEffect from react to resolve usage errors.
import React, { useState, useCallback, useEffect } from 'react';
import { Strain, Plant, PlantStage, View, GrowSetup, ExportSource, ExportFormat } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { GrowSetupModal } from './plants/GrowSetupModal';
import { SativaIcon, IndicaIcon, HybridIcon } from '../icons/StrainTypeIcons';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useNotifications } from '../../context/NotificationContext';
import { useFavorites } from '../../hooks/useFavorites';
import { RangeSlider } from '../common/RangeSlider';
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
// FIX: Update import path to point to the correct module index file.
import { allStrainsData } from '../../data/strains/index';

type StrainViewTab = 'all' | 'user' | 'exports';
type ViewMode = 'list' | 'grid';

interface StrainsViewProps {
  plants: (Plant | null)[];
  setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>;
  setActiveView: (view: View) => void;
}

const StrainDetailModal: React.FC<{
  strain: Strain;
  isFavorite: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onStartGrowing: (strain: Strain) => void;
  plants: (Plant | null)[];
  onSelectSimilarStrain: (strain: Strain) => void;
  allStrains: Strain[];
}> = ({ strain, isFavorite, onClose, onToggleFavorite, onStartGrowing, plants, onSelectSimilarStrain, allStrains }) => {
    const { t } = useTranslations();
    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    const findSimilarStrains = (baseStrain: Strain): Strain[] => {
        if (!baseStrain) return [];
        return allStrains.filter(s =>
            s.id !== baseStrain.id &&
            s.type === baseStrain.type &&
            Math.abs(s.thc - baseStrain.thc) <= 5
        ).slice(0, 4);
    };

    const similarStrains = React.useMemo(() => findSimilarStrains(strain), [strain, allStrains]);

    const TypeDisplay: React.FC<{ type: Strain['type'], details?: string }> = ({ type, details }) => {
        const typeClasses = { Sativa: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', Indica: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', Hybrid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',};
        const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[type];
        const label = details ? details : type;
        return (<span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${typeClasses[type]}`}><TypeIcon className="w-4 h-4 mr-1.5" />{label}</span>);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="strain-detail-modal-title">
            <Card className="w-full max-w-3xl h-[90vh] relative flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-700 z-10 transition-colors" aria-label={t('common.close')}>
                    <PhosphorIcons.X className="w-6 h-6" />
                </button>
                <div className="overflow-y-auto p-2 sm:p-4 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h2 id="strain-detail-modal-title" className="text-3xl font-bold font-display text-primary-400 pr-4">{strain.name}</h2>
                        <button onClick={() => onToggleFavorite(strain.id)} className={`favorite-btn-glow p-1 text-slate-400 hover:text-primary-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label={t('strainsView.strainModal.toggleFavorite')}>
                            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-4 text-slate-300 flex-wrap gap-y-2">
                      <TypeDisplay type={strain.type} details={strain.typeDetails} />
                      {strain.genetics && <span className="flex items-center text-xs"><PhosphorIcons.Sparkle className="w-4 h-4 mr-1" /> {strain.genetics}</span>}
                    </div>

                    {strain.description && (
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-4 flex-shrink-0">
                        <p dangerouslySetInnerHTML={{ __html: strain.description.replace(/<br>/g, ' ') }}></p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                        <p><strong>{t('strainsView.strainModal.thc')}:</strong> {strain.thcRange || `${strain.thc}%`}</p>
                        <p><strong>{t('strainsView.strainModal.cbd')}:</strong> {strain.cbdRange || `${strain.cbd}%`}</p>
                        <p><strong>{t('strainsView.strainModal.difficulty')}:</strong> {difficultyLabels[strain.agronomic.difficulty]}</p>
                        <p><strong>{t('strainsView.strainModal.floweringTime')}:</strong> {strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.weeks')}`}</p>
                    </div>

                    {strain.aromas && strain.aromas.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.aromas')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.aromas.map(a => <div key={a} className="bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-100">{a}</div>)}
                            </div>
                        </div>
                    )}

                    {strain.dominantTerpenes && strain.dominantTerpenes.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.dominantTerpenes')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.dominantTerpenes.map(t => <div key={t} className="bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-100">{t}</div>)}
                            </div>
                        </div>
                    )}

                    {(strain.agronomic.yieldDetails || strain.agronomic.heightDetails) && (
                        <div className="mb-4">
                             <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.agronomicData')}</h4>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                {strain.agronomic.yieldDetails?.indoor && <p><strong>{t('strainsView.strainModal.yieldIndoor')}:</strong> {strain.agronomic.yieldDetails.indoor}</p>}
                                {strain.agronomic.yieldDetails?.outdoor && <p><strong>{t('strainsView.strainModal.yieldOutdoor')}:</strong> {strain.agronomic.yieldDetails.outdoor}</p>}
                                {strain.agronomic.heightDetails?.indoor && <p><strong>{t('strainsView.strainModal.heightIndoor')}:</strong> {strain.agronomic.heightDetails.indoor}</p>}
                                {strain.agronomic.heightDetails?.outdoor && <p><strong>{t('strainsView.strainModal.heightOutdoor')}:</strong> {strain.agronomic.heightDetails.outdoor}</p>}
                             </div>
                        </div>
                    )}

                    {similarStrains.length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-bold font-display text-lg text-primary-500 mb-2">{t('strainsView.strainModal.similarStrains')}</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {similarStrains.map(s => (
                                    <Card 
                                        key={s.id} 
                                        className="p-2 text-center cursor-pointer !shadow-none hover:bg-slate-700 transition-colors"
                                        onClick={() => onSelectSimilarStrain(s)}
                                    >
                                         <p className="font-bold text-sm truncate">{s.name}</p>
                                         <p className="text-xs text-slate-400">{s.type} - {s.thc}% THC</p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Button onClick={() => onStartGrowing(strain)} className="w-full text-lg" disabled={plants.every(p => p !== null)}>
                        {plants.every(p => p !== null) ? t('strainsView.strainModal.allSlotsFull') : t('strainsView.strainModal.startGrowing')}
                      </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AdvancedFilterModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    onApply: () => void,
    tempFilterState: any,
    setTempFilterState: (updater: (prev: any) => any) => void,
    allAromas: string[],
    allTerpenes: string[],
    count: number,
}> = ({ isOpen, onClose, onApply, tempFilterState, setTempFilterState, allAromas, allTerpenes, count }) => {
    const { t } = useTranslations();
    
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    };
    
    const typeOptions: ('All' | 'Sativa' | 'Indica' | 'Hybrid')[] = ['All', 'Sativa', 'Indica', 'Hybrid'];

    const handleTempToggleDifficulty = (difficulty: Strain['agronomic']['difficulty']) => setTempFilterState(prev => ({...prev, selectedDifficulties: new Set(prev.selectedDifficulties.has(difficulty) ? [...prev.selectedDifficulties].filter(d => d !== difficulty) : [...prev.selectedDifficulties, difficulty])}));
    const handleTempToggleAroma = (aroma: string) => setTempFilterState(prev => ({...prev, selectedAromas: new Set(prev.selectedAromas.has(aroma) ? [...prev.selectedAromas].filter(a => a !== aroma) : [...prev.selectedAromas, aroma])}));
    const handleTempToggleTerpene = (terpene: string) => setTempFilterState(prev => ({...prev, selectedTerpenes: new Set(prev.selectedTerpenes.has(terpene) ? [...prev.selectedTerpenes].filter(t => t !== terpene) : [...prev.selectedTerpenes, terpene])}));

    const resetAdvancedFilters = () => {
        setTempFilterState(prev => ({
            ...prev,
            thcRange: [0, 35],
            floweringRange: [6, 16],
            selectedDifficulties: new Set(),
            selectedAromas: new Set(),
            selectedTerpenes: new Set(),
            typeFilter: 'All',
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="advanced-filter-modal-title">
            <Card className="w-full max-w-xl h-auto max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 id="advanced-filter-modal-title" className="text-2xl font-bold font-display text-primary-400 mb-4">{t('strainsView.advancedFilters')}</h2>
                    <span className="text-sm font-medium text-slate-200 bg-slate-700 px-2 py-1 rounded-md">{t('strainsView.matchingStrains', { count })}</span>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow space-y-4">
                    <RangeSlider label={t('strainsView.thcMax')} min={0} max={35} step={5} value={tempFilterState.thcRange} onChange={val => setTempFilterState(prev => ({...prev, thcRange: val}))} unit=" %" />
                    <RangeSlider label={t('strainsView.floweringTime')} min={6} max={16} step={1} value={tempFilterState.floweringRange} onChange={val => setTempFilterState(prev => ({...prev, floweringRange: val}))} unit={` ${t('strainsView.weeks')}`} />
                    <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('common.type')}</h4>
                        <div className="flex gap-1 bg-slate-900 rounded-lg p-0.5">
                            {typeOptions.map(type => (
                                <button key={type} onClick={() => setTempFilterState(prev => ({...prev, typeFilter: type}))} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${tempFilterState.typeFilter === type ? 'glass-pane text-primary-300 shadow-sm border-0' : 'text-slate-300 hover:bg-slate-700'}`}>
                                    {t(`strainsView.${type.toLowerCase()}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.level')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Strain['agronomic']['difficulty'][]).map(difficulty => (
                            <button 
                                key={difficulty} 
                                onClick={() => handleTempToggleDifficulty(difficulty)} 
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedDifficulties.has(difficulty) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                            >
                                {difficultyLabels[difficulty]}
                            </button>
                        ))}
                      </div>
                    </div>
                     <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.terpenes')}</h4>
                      <div className="flex flex-wrap gap-2">{allTerpenes.map(terpene => (<button key={terpene} onClick={() => handleTempToggleTerpene(terpene)} className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedTerpenes.has(terpene) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{terpene}</button>))}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('strainsView.aromas')}</h4>
                      <div className="flex flex-wrap gap-2">{allAromas.map(aroma => (<button key={aroma} onClick={() => handleTempToggleAroma(aroma)} className={`px-3 py-1 text-sm rounded-full transition-colors ${tempFilterState.selectedAromas.has(aroma) ? 'bg-primary-600 text-white font-semibold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{aroma}</button>))}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700 flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={resetAdvancedFilters}>{t('strainsView.resetFilters')}</Button>
                    <Button size="base" onClick={onApply}>{t('common.apply')}</Button>
                </div>
            </Card>
        </div>
    );
};

export const StrainsView: React.FC<StrainsViewProps> = ({ plants, setPlants, setActiveView }) => {
  const { t } = useTranslations();
  const { addNotification } = useNotifications();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { savedExports, addExport, deleteExport } = useExportsManager();
  
  const [userStrains, setUserStrains] = useState<Strain[]>(() => {
    try {
        const saved = localStorage.getItem('user_added_strains');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load user strains from local storage", e);
        return [];
    }
  });

  const allStrains = React.useMemo(() => 
    [...allStrainsData, ...userStrains].sort((a, b) => a.name.localeCompare(b.name)),
    [userStrains]
  );
  
  const [activeTab, setActiveTab] = useState<StrainViewTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [strainToGrow, setStrainToGrow] = useState<Strain | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddStrainModalOpen, setIsAddStrainModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [strainToEdit, setStrainToEdit] = useState<Strain | null>(null);
  
  const strainsToDisplay = React.useMemo(() => 
    (activeTab === 'all' ? allStrains : userStrains), 
    [activeTab, allStrains, userStrains]
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
  } = useStrainFilters(strainsToDisplay, favoriteIds);

  const allTerpenes = React.useMemo(() => Array.from(new Set(allStrains.flatMap(s => s.dominantTerpenes || []))).sort(), [allStrains]);
  const allAromas = React.useMemo(() => Array.from(new Set(allStrains.flatMap(s => s.aromas || []))).sort(), [allStrains]);

  const handleStartGrowingRequest = (strain: Strain) => {
    setStrainToGrow(strain);
    setIsSetupModalOpen(true);
  };

  const handleAddStrain = (newStrain: Strain) => {
    try {
        const updatedUserStrains = [...userStrains, newStrain];
        localStorage.setItem('user_added_strains', JSON.stringify(updatedUserStrains));
        setUserStrains(updatedUserStrains);
        setIsAddStrainModalOpen(false);
        addNotification(t('strainsView.addStrainModal.addStrainSuccess', { name: newStrain.name }), 'success');
        setActiveTab('user');
    } catch(e) {
        addNotification(t('strainsView.addStrainModal.addStrainError'), 'error');
    }
  };

  const handleUpdateStrain = (updatedStrain: Strain) => {
      try {
          const updatedUserStrains = userStrains.map(s => s.id === updatedStrain.id ? updatedStrain : s);
          localStorage.setItem('user_added_strains', JSON.stringify(updatedUserStrains));
          setUserStrains(updatedUserStrains);
          setIsAddStrainModalOpen(false);
          setStrainToEdit(null);
          addNotification(t('strainsView.addStrainModal.editSuccess', { name: updatedStrain.name }), 'success');
      } catch(e) {
          addNotification(t('strainsView.addStrainModal.addStrainError'), 'error');
      }
  };

  const handleDeleteStrain = (strainId: string) => {
      const strainToDelete = userStrains.find(s => s.id === strainId);
      if (strainToDelete && window.confirm(t('strainsView.deleteStrainConfirm', { name: strainToDelete.name }))) {
          try {
              const updatedUserStrains = userStrains.filter(s => s.id !== strainId);
              localStorage.setItem('user_added_strains', JSON.stringify(updatedUserStrains));
              setUserStrains(updatedUserStrains);
              addNotification(t('strainsView.deleteStrainSuccess', { name: strainToDelete.name }), 'success');
          } catch(e) {
              addNotification(t('strainsView.deleteStrainError'), 'error');
          }
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
        case 'selected': dataToExport = allStrains.filter(s => selectedIds.has(s.id)); break;
        case 'favorites': dataToExport = allStrains.filter(s => favoriteIds.has(s.id)); break;
        case 'filtered': dataToExport = sortedAndFilteredStrains; break;
        case 'all': dataToExport = allStrains; break;
    }
    if (dataToExport.length === 0) { addNotification(t('common.noDataToExport'), 'error'); return; }

    addExport({ name: filename, format, source }, dataToExport.map(s => s.id));
    
    switch(format) {
        case 'json': exportService.exportAsJSON(dataToExport, filename); break;
        case 'csv': exportService.exportAsCSV(dataToExport, filename); break;
        case 'pdf': exportService.exportAsPDF(dataToExport, filename, t); break;
        case 'txt': exportService.exportAsTXT(dataToExport, filename); break;
    }
    addNotification(t('common.successfullyExported', { count: dataToExport.length, format: format.toUpperCase() }), 'success');
  };
  
  const listGridClass = "grid grid-cols-[auto_auto_minmax(120px,_2fr)_minmax(80px,_1fr)_70px_70px_100px_120px_100px_auto] gap-x-2 md:gap-x-4 items-center";

  const tableHeaders: { key: string, label: string }[] = [
      { key: 'name', label: t('strainsView.table.name') },
      { key: 'type', label: t('strainsView.table.type')},
      { key: 'thc', label: t('strainsView.table.thc')},
      { key: 'cbd', label: t('strainsView.table.cbd')},
      { key: 'floweringTime', label: t('strainsView.table.flowering')},
      { key: 'yield', label: t('strainsView.addStrainModal.yield') },
      { key: 'difficulty', label: t('strainsView.table.level')},
  ];

  const headerVisibilityClasses = [
      '', // Name
      'hidden md:flex', // Type
      'hidden sm:flex', // THC
      'hidden sm:flex', // CBD
      'hidden md:flex', // Flowering
      'hidden md:flex', // Yield
      'flex', // Difficulty
  ];


  const tabs: {id: StrainViewTab, label: string}[] = [
    { id: 'all', label: t('strainsView.tabs.all') },
    { id: 'user', label: t('strainsView.tabs.user', { count: userStrains.length }) },
    { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }) },
  ];

  const memoizedToggleFavorite = useCallback(toggleFavorite, [toggleFavorite]);

  const renderContent = () => {
    return (
        <>
            {activeTab === 'exports' ? (
                <ExportsManagerView savedExports={savedExports} deleteExport={deleteExport} allStrains={allStrains} />
            ) : (
                <div className="flex flex-col flex-grow min-h-0">
                    <div className="glass-pane rounded-lg flex flex-col flex-grow min-h-0">
                        {viewMode === 'list' && (
                             <div className={`${listGridClass} sticky top-0 z-10 px-3 py-2 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase flex-shrink-0`}>
                                <input type="checkbox" aria-label="Select all" checked={selectedIds.size > 0 && selectedIds.size === sortedAndFilteredStrains.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500 justify-self-center"/>
                                <div aria-hidden="true" className="justify-self-center"><PhosphorIcons.Heart className="w-5 h-5"/></div>
                                {tableHeaders.map((header, index) => (
                                    <button
                                        key={header.key}
                                        onClick={() => !['yield'].includes(header.key) && filterControls.handleSort(header.key as SortKey)}
                                        className={`flex items-center gap-1 justify-start ${['yield'].includes(header.key) ? 'cursor-default' : ''} ${headerVisibilityClasses[index]}`}
                                    >
                                        {header.label}
                                        {filterState.sort.key === header.key && (filterState.sort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3"/> : <PhosphorIcons.ArrowDown className="w-3 h-3"/>)}
                                    </button>
                                ))}
                                <div className="text-left">{activeTab === 'user' ? t('common.actions') : ''}</div>
                            </div>
                        )}

                        <div className="flex-grow min-h-0 overflow-y-auto">
                            {sortedAndFilteredStrains.length > 0 ? (
                                viewMode === 'list' ? (
                                    <div>
                                    {sortedAndFilteredStrains.map(strain => (
                                        <StrainListItem
                                            key={strain.id}
                                            strain={strain}
                                            isSelected={selectedIds.has(strain.id)}
                                            isFavorite={favoriteIds.has(strain.id)}
                                            onSelect={setSelectedStrain}
                                            onToggleSelection={toggleSelection}
                                            onToggleFavorite={memoizedToggleFavorite}
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
                                <div className="text-center p-8 text-slate-400">
                                    <h3 className="font-semibold">{t('strainsView.noUserStrains.title')}</h3>
                                    <p className="text-sm">{t('strainsView.noUserStrains.subtitle')}</p>
                                    <Button size="sm" onClick={() => setIsAddStrainModalOpen(true)} className="mt-4">{t('strainsView.noUserStrains.button')}</Button>
                                </div>
                            ) : (
                                 <div className="text-center p-8 text-slate-400">
                                    <h3 className="font-semibold">{t('strainsView.noStrainsFound.title')}</h3>
                                    <p className="text-sm">{t('strainsView.noStrainsFound.subtitle')}</p>
                                    {filterState.searchTerm && <p className="text-sm mt-1">für: "{filterState.searchTerm}"</p>}
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
              allStrains={allStrains}
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
            totalCount={allStrains.length}
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
                     <nav className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                    activeTab === tab.id 
                                        ? 'bg-slate-700 text-primary-300 shadow-sm' 
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-grow">
                    <div className="relative flex-grow">
                        <input type="text" placeholder={t('strainsView.searchPlaceholder')} value={filterState.searchTerm} onChange={(e) => filterControls.setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"/>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setIsExportModalOpen(true)}>
                        {t('common.export')}...
                    </Button>
                    <button onClick={() => filterControls.setShowFavorites(prev => !prev)} className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${filterState.showFavorites ? 'bg-primary-900 text-primary-300' : 'bg-slate-800 hover:bg-slate-700'}`}>
                        <PhosphorIcons.Heart weight={filterState.showFavorites ? 'fill' : 'regular'} className="w-5 h-5" />
                        <span className="sr-only">{t('strainsView.footer.showFavorites', {count: favoriteIds.size})}</span>
                    </button>
                    <button onClick={openAdvancedFilterModal} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                        <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                         <span className="sr-only">{t('strainsView.advancedFilters')}</span>
                    </button>
                    <div className="flex bg-slate-900 rounded-lg p-0.5">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-slate-700 shadow-sm' : ''}`}><PhosphorIcons.ListChecks className="w-5 h-5" /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-slate-700 shadow-sm' : ''}`}><PhosphorIcons.GridFour className="w-5 h-5" /></button>
                    </div>
                    {activeTab === 'user' && (
                        <Button size="sm" onClick={() => setIsAddStrainModalOpen(true)}>
                            <PhosphorIcons.PlusCircle className="inline w-5 h-5 mr-1.5"/>
                            {t('common.add')}
                        </Button>
                    )}
                </div>
            </div>
          
          <div className="flex-grow min-h-0 flex flex-col">{renderContent()}</div>
        </div>
      );
};