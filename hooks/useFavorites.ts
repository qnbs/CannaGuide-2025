import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cannabis-grow-guide-favorites';

export const useFavorites = () => {  
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
    }
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
