

import React, { useState, useMemo, useEffect } from 'react';
import { Strain, Plant, PlantStage, View, GrowSetup, ExportSource, ExportFormat, SavedExport } from '../../types';
import { INITIAL_STRAINS } from '../../data/strains/index';
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

type SortKey = 'name' | 'difficulty';
type SortDirection = 'asc' | 'desc';
type StrainViewTab = 'all' | 'user' | 'exports';

interface SortOption {
    key: SortKey;
    direction: SortDirection;
}

const difficultyValues: Record<Strain['agronomic']['difficulty'], number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};


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
}> = ({ strain, isFavorite, onClose, onToggleFavorite, onStartGrowing, plants, onSelectSimilarStrain }) => {
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
        return INITIAL_STRAINS.filter(s =>
            s.id !== baseStrain.id &&
            s.type === baseStrain.type &&
            Math.abs(s.thc - baseStrain.thc) <= 5
        ).slice(0, 4);
    };

    const similarStrains = useMemo(() => findSimilarStrains(strain), [strain]);

    const TypeDisplay: React.FC<{ type: Strain['type'], details?: string }> = ({ type, details }) => {
        const typeClasses = { Sativa: 'bg-amber-400/20 text-amber-400', Indica: 'bg-indigo-400/20 text-indigo-400', Hybrid: 'bg-blue-500/20 text-blue-400',};
        const TypeIcon = { Sativa: SativaIcon, Indica: IndicaIcon, Hybrid: HybridIcon }[type];
        const label = details ? details : type;
        return (<span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${typeClasses[type]}`}><TypeIcon className="w-4 h-4 mr-1.5" />{label}</span>);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="strain-detail-modal-title">
            <Card className="w-full max-w-3xl h-[90vh] relative flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 z-10 transition-colors" aria-label={t('common.close')}>
                    <PhosphorIcons.X className="w-6 h-6" />
                </button>
                <div className="overflow-y-auto p-2 sm:p-4 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h2 id="strain-detail-modal-title" className="text-3xl font-bold text-blue-500 dark:text-blue-300 pr-4">{strain.name}</h2>
                        <button onClick={() => onToggleFavorite(strain.id)} className={`favorite-btn-glow p-1 text-slate-400 hover:text-red-400 ${isFavorite ? 'is-favorite' : ''}`} aria-label={t('strainsView.strainModal.toggleFavorite')}>
                            <PhosphorIcons.Heart weight={isFavorite ? 'fill' : 'regular'} className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-4 text-slate-500 dark:text-slate-300 flex-wrap gap-y-2">
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
                        <p><strong>{t('strainsView.strainModal.floweringTime')}:</strong> {strain.floweringTimeRange || `${strain.floweringTime} ${t('strainsView.floweringTime')}`}</p>
                    </div>

                    {strain.aromas && strain.aromas.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-2">{t('strainsView.strainModal.aromas')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.aromas.map(a => <div key={a} className="bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-800 dark:text-slate-200">{a}</div>)}
                            </div>
                        </div>
                    )}

                    {strain.dominantTerpenes && strain.dominantTerpenes.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-2">{t('strainsView.strainModal.dominantTerpenes')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {strain.dominantTerpenes.map(t => <div key={t} className="bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1 text-sm text-slate-800 dark:text-slate-200">{t}</div>)}
                            </div>
                        </div>
                    )}

                    {(strain.agronomic.yieldDetails || strain.agronomic.heightDetails) && (
                        <div className="mb-4">
                             <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-2">{t('strainsView.strainModal.agronomicData')}</h4>
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
                            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-2">{t('strainsView.strainModal.similarStrains')}</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {similarStrains.map(s => (
                                    <Card 
                                        key={s.id} 
                                        className="p-2 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        onClick={() => onSelectSimilarStrain(s)}
                                    >
                                         <p className="font-bold text-sm truncate">{s.name}</p>
                                         <p className="text-xs text-slate-500">{s.type} - {s.thc}% THC</p>
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
    thcRange: [number, number],
    setThcRange: (range: [number, number]) => void,
    floweringRange: [number, number],
    setFloweringRange: (range: [number, number]) => void,
    selectedDifficulties: Set<Strain['agronomic']['difficulty']>,
    handleToggleDifficulty: (difficulty: Strain['agronomic']['difficulty']) => void,
    selectedAromas: Set<string>,
    allAromas: string[],
    handleToggleAroma: (aroma: string) => void,
    selectedTerpenes: Set<string>,
    allTerpenes: string[],
    handleToggleTerpene: (terpene: string) => void,
    resetAdvancedFilters: () => void,
    count: number,
}> = ({ isOpen, onClose, onApply, thcRange, setThcRange, floweringRange, setFloweringRange, selectedDifficulties, handleToggleDifficulty, selectedAromas, allAromas, handleToggleAroma, selectedTerpenes, allTerpenes, handleToggleTerpene, resetAdvancedFilters, count }) => {
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

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="advanced-filter-modal-title">
            <Card className="w-full max-w-xl h-auto max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 id="advanced-filter-modal-title" className="text-2xl font-bold text-primary-500 dark:text-primary-400 mb-4">{t('strainsView.advancedFilters')}</h2>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{t('strainsView.matchingStrains', { count })}</span>
                </div>
                <div className="overflow-y-auto pr-2 flex-grow space-y-4">
                    <RangeSlider label={t('strainsView.thcMax')} min={0} max={35} step={5} value={thcRange} onChange={setThcRange} unit=" %" />
                    <RangeSlider label={t('strainsView.floweringTime')} min={6} max={16} step={1} value={floweringRange} onChange={setFloweringRange} unit={` ${t('strainsView.floweringTime')}`} />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('strainsView.level')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Strain['agronomic']['difficulty'][]).map(difficulty => (
                            <button 
                                key={difficulty} 
                                onClick={() => handleToggleDifficulty(difficulty)} 
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedDifficulties.has(difficulty) ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                                {difficultyLabels[difficulty]}
                            </button>
                        ))}
                      </div>
                    </div>
                     <div>
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('strainsView.terpenes')}</h4>
                      <div className="flex flex-wrap gap-2">{allTerpenes.map(terpene => (<button key={terpene} onClick={() => handleToggleTerpene(terpene)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTerpenes.has(terpene) ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{terpene}</button>))}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('strainsView.aromas')}</h4>
                      <div className="flex flex-wrap gap-2">{allAromas.map(aroma => (<button key={aroma} onClick={() => handleToggleAroma(aroma)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedAromas.has(aroma) ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>{aroma}</button>))}</div>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
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
  
  const difficultyLabels: Record<Strain['agronomic']['difficulty'], string> = {
    Easy: t('strainsView.difficulty.easy'),
    Medium: t('strainsView.difficulty.medium'),
    Hard: t('strainsView.difficulty.hard'),
  };

  const [userStrains, setUserStrains] = useState<Strain[]>(() => {
    try {
        const saved = localStorage.getItem('user_added_strains');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load user strains from local storage", e);
        return [];
    }
  });

  const allStrains = useMemo(() => 
    [...INITIAL_STRAINS, ...userStrains].sort((a, b) => a.name.localeCompare(b.name)),
    [userStrains]
  );
  
  const [activeTab, setActiveTab] = useState<StrainViewTab>('all');
  const [selectedStrain, setSelectedStrain] = useState<Strain | null>(null);
  const [strainToGrow, setStrainToGrow] = useState<Strain | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddStrainModalOpen, setIsAddStrainModalOpen] = useState(false);
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // --- Main Filter States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Sativa' | 'Indica' | 'Hybrid'>('All');
  const [sort, setSort] = useState<SortOption>({ key: 'name', direction: 'asc' });
  const [thcRange, setThcRange] = useState<[number, number]>([0, 35]);
  const [floweringRange, setFloweringRange] = useState<[number, number]>([6, 16]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Strain['agronomic']['difficulty']>>(new Set());
  const [selectedAromas, setSelectedAromas] = useState<Set<string>>(new Set());
  const [selectedTerpenes, setSelectedTerpenes] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  // --- Temp Filter States for Modal ---
  const [tempThcRange, setTempThcRange] = useState<[number, number]>(thcRange);
  const [tempFloweringRange, setTempFloweringRange] = useState<[number, number]>(floweringRange);
  const [tempSelectedDifficulties, setTempSelectedDifficulties] = useState<Set<Strain['agronomic']['difficulty']>>(selectedDifficulties);
  const [tempSelectedAromas, setTempSelectedAromas] = useState<Set<string>>(selectedAromas);
  const [tempSelectedTerpenes, setTempSelectedTerpenes] = useState<Set<string>>(selectedTerpenes);

  const strainsToDisplay = useMemo(() => 
    (activeTab === 'all' ? allStrains : userStrains), 
    [activeTab, allStrains, userStrains]
  );

  const allTerpenes = useMemo(() => Array.from(new Set(allStrains.flatMap(s => s.dominantTerpenes || []))).sort(), [allStrains]);
  const allAromas = useMemo(() => Array.from(new Set(allStrains.flatMap(s => s.aromas || []))).sort(), [allStrains]);

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
        setActiveTab('user'); // Switch to user tab
    } catch(e) {
        addNotification(t('strainsView.addStrainModal.addStrainError'), 'error');
    }
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
  
  const baseFilteredStrains = useMemo(() => {
    return strainsToDisplay.filter(strain => {
      if (showFavorites && !favoriteIds.has(strain.id)) return false;
      if (searchTerm && !strain.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (typeFilter !== 'All' && strain.type !== typeFilter) return false;
      return true;
    });
  }, [strainsToDisplay, searchTerm, typeFilter, showFavorites, favoriteIds]);

  const advancedFilteredStrains = useMemo(() => {
    return baseFilteredStrains.filter(strain => {
      if (strain.thc < thcRange[0] || strain.thc > thcRange[1]) return false;
      if (selectedDifficulties.size > 0 && !selectedDifficulties.has(strain.agronomic.difficulty)) return false;
      if (strain.floweringTime < floweringRange[0] || strain.floweringTime > floweringRange[1]) return false;
      if (selectedTerpenes.size > 0 && !(strain.dominantTerpenes && [...selectedTerpenes].every(t => strain.dominantTerpenes!.includes(t)))) return false;
      if (selectedAromas.size > 0 && !(strain.aromas && [...selectedAromas].every(sa => strain.aromas!.map(a => a.toLowerCase()).includes(sa.toLowerCase())))) return false;
      return true;
    });
  }, [baseFilteredStrains, thcRange, floweringRange, selectedDifficulties, selectedTerpenes, selectedAromas]);
  

  const sortedAndFilteredStrains = useMemo(() => {
    return [...advancedFilteredStrains].sort((a, b) => {
      let aVal, bVal;
      if (sort.key === 'difficulty') {
        aVal = difficultyValues[a.agronomic.difficulty];
        bVal = difficultyValues[b.agronomic.difficulty];
      } else {
        aVal = a[sort.key as keyof Strain] as any;
        bVal = b[sort.key as keyof Strain] as any;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === 'number' && typeof bVal === 'number') return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });
  }, [advancedFilteredStrains, sort]);

  const previewFilteredStrains = useMemo(() => {
    if (!isAdvancedFilterModalOpen) return [];
    return baseFilteredStrains.filter(strain => {
      if (strain.thc < tempThcRange[0] || strain.thc > tempThcRange[1]) return false;
      if (tempSelectedDifficulties.size > 0 && !tempSelectedDifficulties.has(strain.agronomic.difficulty)) return false;
      if (strain.floweringTime < tempFloweringRange[0] || strain.floweringTime > tempFloweringRange[1]) return false;
      if (tempSelectedTerpenes.size > 0 && !(strain.dominantTerpenes && [...tempSelectedTerpenes].every(t => strain.dominantTerpenes!.includes(t)))) return false;
      if (tempSelectedAromas.size > 0 && !(strain.aromas && [...tempSelectedAromas].every(sa => strain.aromas!.map(a => a.toLowerCase()).includes(sa.toLowerCase())))) return false;
      return true;
    });
  }, [isAdvancedFilterModalOpen, baseFilteredStrains, tempThcRange, tempFloweringRange, tempSelectedDifficulties, tempSelectedAromas, tempSelectedTerpenes]);


  const openAdvancedFilterModal = () => {
    setTempThcRange(thcRange);
    setTempFloweringRange(floweringRange);
    setTempSelectedDifficulties(new Set(selectedDifficulties));
    setTempSelectedAromas(new Set(selectedAromas));
    setTempSelectedTerpenes(new Set(selectedTerpenes));
    setIsAdvancedFilterModalOpen(true);
  };

  const handleApplyAdvancedFilters = () => {
    setThcRange(tempThcRange);
    setFloweringRange(tempFloweringRange);
    setSelectedDifficulties(tempSelectedDifficulties);
    setSelectedAromas(tempSelectedAromas);
    setSelectedTerpenes(tempSelectedTerpenes);
    setIsAdvancedFilterModalOpen(false);
  };
  
  const handleTempToggleDifficulty = (difficulty: Strain['agronomic']['difficulty']) => setTempSelectedDifficulties(prev => { const newSet = new Set(prev); newSet.has(difficulty) ? newSet.delete(difficulty) : newSet.add(difficulty); return newSet; });
  const handleTempToggleAroma = (aroma: string) => setTempSelectedAromas(prev => { const newSet = new Set(prev); newSet.has(aroma) ? newSet.delete(aroma) : newSet.add(aroma); return newSet; });
  const handleTempToggleTerpene = (terpene: string) => setTempSelectedTerpenes(prev => { const newSet = new Set(prev); newSet.has(terpene) ? newSet.delete(terpene) : newSet.add(terpene); return newSet; });
  
  const resetTempAdvancedFilters = () => {
    setTempThcRange([0, 35]);
    setTempFloweringRange([6, 16]);
    setTempSelectedDifficulties(new Set());
    setTempSelectedAromas(new Set());
    setTempSelectedTerpenes(new Set());
  };


  const toggleSelection = (id: string) => setSelectedIds(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; });
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
        case 'pdf': exportService.exportAsPDF(dataToExport, filename); break;
    }
    addNotification(t('common.successfullyExported', { count: dataToExport.length, format: format.toUpperCase() }), 'success');
  };

  const handleSort = (key: SortKey) => {
    setSort(prev => {
        if (prev.key === key) {
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: 'asc' };
    });
  };

  const typeOptions: ('All' | 'Sativa' | 'Indica' | 'Hybrid')[] = ['All', 'Sativa', 'Indica', 'Hybrid'];
  const tableHeaders: { key: SortKey, label: string, className?: string }[] = [
      { key: 'name', label: t('strainsView.table.name'), className: 'text-left' },
      { key: 'difficulty', label: t('strainsView.table.level'), className: 'text-center' },
  ];

  const tabs: {id: StrainViewTab, label: string}[] = [
    { id: 'all', label: t('strainsView.tabs.all') },
    { id: 'user', label: t('strainsView.tabs.user', { count: userStrains.length }) },
    { id: 'exports', label: t('strainsView.tabs.exports', { count: savedExports.length }) },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t('strainsView.title')}</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsAddStrainModalOpen(true)}>
              <PhosphorIcons.PlusCircle className="inline w-5 h-5 mr-1.5" />{t('common.add')}
          </Button>
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
              <PhosphorIcons.UploadSimple className="inline w-5 h-5 mr-1.5" />{t('common.export')}
          </Button>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 flex items-center gap-2 px-1 pb-4 text-sm md:text-base font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                    {tab.label}
                </button>
            ))}
        </nav>
      </div>
      
      {activeTab !== 'exports' && (
        <div className="flex flex-col h-[calc(100vh-178px)] mt-4">
          <Card className="p-2 mb-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="strain-search" className="sr-only">{t('strainsView.searchPlaceholder')}</label>
              <input id="strain-search" type="text" placeholder={t('strainsView.searchPlaceholder')} className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <fieldset className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                <legend className="sr-only">Filter by strain type</legend>
                {typeOptions.map(option => (
                    <button key={option} onClick={() => setTypeFilter(option)} className={`px-2 py-1 text-xs rounded-md flex-1 transition-colors ${typeFilter === option ? 'bg-white dark:bg-slate-800 text-primary-600 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{t(`strainsView.${option.toLowerCase()}`)}</button>
                ))}
              </fieldset>
              <Button variant="secondary" size="sm" onClick={openAdvancedFilterModal} className="px-3 py-2 text-sm">
                  <PhosphorIcons.FunnelSimple className="inline w-4 h-4 mr-1"/> {t('strainsView.advancedFilters')}
              </Button>
            </div>
          </Card>
          
          <div className="flex-grow min-h-0 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col">
            <div className="grid grid-cols-[auto_auto_1fr_90px] gap-x-3 items-center px-2 py-1.5 font-bold text-xs text-slate-600 dark:text-slate-300 border-b-2 border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <input type="checkbox" aria-label="Select all strains" checked={selectedIds.size > 0 && selectedIds.size === sortedAndFilteredStrains.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-400 text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"/>
              <div className="w-4 h-4 text-center"><PhosphorIcons.Heart /></div>
              {tableHeaders.map(h => (
                <button key={h.key} onClick={() => handleSort(h.key)} className={`flex items-center gap-1 ${h.className || ''}`}>
                  {h.label}
                  {sort.key === h.key && (sort.direction === 'asc' ? <PhosphorIcons.ArrowUp className="w-3 h-3"/> : <PhosphorIcons.ArrowDown className="w-3 h-3"/>)}
                </button>
              ))}
            </div>
            
            <div className="overflow-y-auto pr-1 flex-grow">
              {sortedAndFilteredStrains.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedAndFilteredStrains.map(strain => {
                    return (
                      <div 
                        key={strain.id} 
                        onClick={() => setSelectedStrain(strain)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStrain(strain); } }}
                        role="button"
                        tabIndex={0}
                        className={`grid grid-cols-[auto_auto_1fr_90px] gap-x-3 items-center px-2 py-2.5 cursor-pointer transition-colors duration-150 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${selectedStrain?.id === strain.id ? 'bg-primary-100/50 dark:bg-primary-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/70'}`}>
                        <input type="checkbox" aria-label={`Select ${strain.name}`} checked={selectedIds.has(strain.id)} onChange={e => {e.stopPropagation(); toggleSelection(strain.id);}} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-slate-400 dark:border-slate-500 text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"/>
                        <button onClick={e => {e.stopPropagation(); toggleFavorite(strain.id)}} className={`favorite-btn-glow text-slate-400 hover:text-red-400 ${favoriteIds.has(strain.id) ? 'is-favorite' : ''}`} aria-label={t('strainsView.strainModal.toggleFavorite')}><PhosphorIcons.Heart weight={favoriteIds.has(strain.id) ? 'fill' : 'regular'} className="w-4 h-4" /></button>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{strain.name}</span>
                        </div>
                        <div className="flex justify-center" aria-label={`Difficulty: ${difficultyLabels[strain.agronomic.difficulty]}`} title={difficultyLabels[strain.agronomic.difficulty]}>
                          <div className="flex">
                              {strain.agronomic.difficulty === 'Easy' && (
                                  <>
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-green-500" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                  </>
                              )}
                              {strain.agronomic.difficulty === 'Medium' && (
                                  <>
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-amber-500" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-amber-500" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                  </>
                              )}
                              {strain.agronomic.difficulty === 'Hard' && (
                                  <>
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                                      <PhosphorIcons.Cannabis className="w-3.5 h-3.5 text-red-500" />
                                  </>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">
                  {activeTab === 'user' && userStrains.length === 0 ? (
                      <>
                          <p className="font-semibold">{t('strainsView.noUserStrains.title')}</p>
                          <p className="text-sm">{t('strainsView.noUserStrains.subtitle')}</p>
                      </>
                  ) : (
                      <>
                          <p className="font-semibold">{t('strainsView.noStrainsFound.title')}</p>
                          <p className="text-sm">{t('strainsView.noStrainsFound.subtitle')}</p>
                      </>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showFavorites} onChange={e => setShowFavorites(e.target.checked)} className="h-4 w-4 rounded border-slate-400 text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-transparent"/>
                  {t('strainsView.footer.showFavorites', { count: favoriteIds.size })}
                </label>
              </div>
              <span>{t('strainsView.footer.selected', { count: selectedIds.size })}</span>
              <span>{t('strainsView.footer.showing', { shown: sortedAndFilteredStrains.length, total: strainsToDisplay.length })}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exports' && (
        <ExportsManagerView
          savedExports={savedExports}
          deleteExport={deleteExport}
          allStrains={allStrains}
        />
      )}
      
      {selectedStrain && <StrainDetailModal strain={selectedStrain} isFavorite={favoriteIds.has(selectedStrain.id)} onClose={() => setSelectedStrain(null)} onToggleFavorite={toggleFavorite} onStartGrowing={handleStartGrowingRequest} plants={plants} onSelectSimilarStrain={setSelectedStrain} />}
      <AdvancedFilterModal 
        isOpen={isAdvancedFilterModalOpen} 
        onClose={() => setIsAdvancedFilterModalOpen(false)}
        onApply={handleApplyAdvancedFilters}
        count={previewFilteredStrains.length}
        thcRange={tempThcRange}
        setThcRange={setTempThcRange}
        floweringRange={tempFloweringRange}
        setFloweringRange={setTempFloweringRange}
        selectedDifficulties={tempSelectedDifficulties}
        handleToggleDifficulty={handleTempToggleDifficulty}
        selectedAromas={tempSelectedAromas}
        allAromas={allAromas}
        handleToggleAroma={handleTempToggleAroma}
        selectedTerpenes={tempSelectedTerpenes}
        allTerpenes={allTerpenes}
        handleToggleTerpene={handleTempToggleTerpene}
        resetAdvancedFilters={resetTempAdvancedFilters}
      />
      {isSetupModalOpen && strainToGrow && <GrowSetupModal strain={strainToGrow} onClose={() => setIsSetupModalOpen(false)} onConfirm={handleStartGrowingConfirm} />}
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExport} selectionCount={selectedIds.size} favoritesCount={favoriteIds.size} filteredCount={sortedAndFilteredStrains.length} totalCount={allStrains.length} />
      <AddStrainModal isOpen={isAddStrainModalOpen} onClose={() => setIsAddStrainModalOpen(false)} onAddStrain={handleAddStrain} />
    </>
  );
};