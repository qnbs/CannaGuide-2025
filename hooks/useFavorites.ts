
import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';

const STORAGE_KEY = 'favorites';

export const useFavorites = () => {  
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    const saved = storageService.getItem<string[]>(STORAGE_KEY, []);
    return new Set(saved);
  });

  useEffect(() => {
    storageService.setItem(STORAGE_KEY, Array.from(favoriteIds));
  }, [favoriteIds]);

  const toggleFavorite = useCallback((strainId: string) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(strainId)) {
        newSet.delete(strainId);
      } else {
        newSet.add(strainId);
      }
      return newSet;
    });
  }, []);

  return { favoriteIds, toggleFavorite };
};
