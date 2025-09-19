import { useState, useMemo, useEffect } from 'react';
import { Strain, SortDirection } from '../types';

export type SortKey = 'name' | 'difficulty' | 'type' | 'thc' | 'cbd' | 'floweringTime';

interface SortOption {
    key: SortKey;
    direction: SortDirection;
}

const difficultyValues: Record<Strain['agronomic']['difficulty'], number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
};

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export const useStrainFilters = (strainsToDisplay: Strain[], favoriteIds: Set<string>, initialSort: SortOption = { key: 'name', direction: 'asc' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState({
      thcRange: [0, 35] as [number, number],
      floweringRange: [6, 16] as [number, number],
      selectedDifficulties: new Set<Strain['agronomic']['difficulty']>(),
      selectedAromas: new Set<string>(),
      selectedTerpenes: new Set<string>(),
      typeFilter: 'All' as 'All' | 'Sativa' | 'Indica' | 'Hybrid',
  });

  const [tempFilterState, setTempFilterState] = useState(advancedFilters);

  const baseFilteredStrains = useMemo(() => {
    return strainsToDisplay.filter(strain => {
      if (showFavorites && !favoriteIds.has(strain.id)) return false;
      if (debouncedSearchTerm && !strain.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
      return true;
    });
  }, [strainsToDisplay, debouncedSearchTerm, showFavorites, favoriteIds]);

  const advancedFilteredStrains = useMemo(() => {
    return baseFilteredStrains.filter(strain => {
      if (advancedFilters.typeFilter !== 'All' && strain.type !== advancedFilters.typeFilter) return false;
      if (strain.thc < advancedFilters.thcRange[0] || strain.thc > advancedFilters.thcRange[1]) return false;
      if (advancedFilters.selectedDifficulties.size > 0 && !advancedFilters.selectedDifficulties.has(strain.agronomic.difficulty)) return false;
      if (strain.floweringTime < advancedFilters.floweringRange[0] || strain.floweringTime > advancedFilters.floweringRange[1]) return false;
      if (advancedFilters.selectedTerpenes.size > 0 && !(strain.dominantTerpenes && [...advancedFilters.selectedTerpenes].every(t => strain.dominantTerpenes!.includes(t)))) return false;
      if (advancedFilters.selectedAromas.size > 0 && !(strain.aromas && [...advancedFilters.selectedAromas].every(sa => strain.aromas!.map(a => a.toLowerCase()).includes(sa.toLowerCase())))) return false;
      return true;
    });
  }, [baseFilteredStrains, advancedFilters]);
  
  const sortedAndFilteredStrains = useMemo(() => {
      return [...advancedFilteredStrains].sort((a, b) => {
          let aVal: string | number, bVal: string | number;

          switch (sort.key) {
              case 'difficulty': aVal = difficultyValues[a.agronomic.difficulty]; bVal = difficultyValues[b.agronomic.difficulty]; break;
              case 'thc': case 'cbd': case 'floweringTime': aVal = a[sort.key]; bVal = b[sort.key]; break;
              default: aVal = a[sort.key] as string; bVal = b[sort.key] as string;
          }

          if (typeof aVal === 'string' && typeof bVal === 'string') {
              return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
              return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
          }
          return 0;
      });
  }, [advancedFilteredStrains, sort]);

  const previewFilteredStrains = useMemo(() => {
    if (!isAdvancedFilterModalOpen) return [];
    return baseFilteredStrains.filter(strain => {
      if (tempFilterState.typeFilter !== 'All' && strain.type !== tempFilterState.typeFilter) return false;
      if (strain.thc < tempFilterState.thcRange[0] || strain.thc > tempFilterState.thcRange[1]) return false;
      if (tempFilterState.selectedDifficulties.size > 0 && !tempFilterState.selectedDifficulties.has(strain.agronomic.difficulty)) return false;
      if (strain.floweringTime < tempFilterState.floweringRange[0] || strain.floweringTime > tempFilterState.floweringRange[1]) return false;
      if (tempFilterState.selectedTerpenes.size > 0 && !(strain.dominantTerpenes && [...tempFilterState.selectedTerpenes].every(t => strain.dominantTerpenes!.includes(t)))) return false;
      if (tempFilterState.selectedAromas.size > 0 && !(strain.aromas && [...tempFilterState.selectedAromas].every(sa => strain.aromas!.map(a => a.toLowerCase()).includes(sa.toLowerCase())))) return false;
      return true;
    });
  }, [isAdvancedFilterModalOpen, baseFilteredStrains, tempFilterState]);

  const handleSort = (key: SortKey) => {
    setSort(prev => {
        if (prev.key === key) {
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: key === 'name' || key === 'type' ? 'asc' : 'desc' };
    });
  };

  const openAdvancedFilterModal = () => {
    setTempFilterState(advancedFilters);
    setIsAdvancedFilterModalOpen(true);
  };

  const handleApplyAdvancedFilters = () => {
    setAdvancedFilters(tempFilterState);
    setIsAdvancedFilterModalOpen(false);
  };

  return {
    sortedAndFilteredStrains,
    filterControls: {
        setSearchTerm,
        setShowFavorites,
        handleSort,
    },
    filterState: {
        searchTerm,
        showFavorites,
        sort,
    },
    isAdvancedFilterModalOpen,
    setIsAdvancedFilterModalOpen,
    tempFilterState,
    setTempFilterState,
    previewFilteredStrains,
    openAdvancedFilterModal,
    handleApplyAdvancedFilters
  };
};