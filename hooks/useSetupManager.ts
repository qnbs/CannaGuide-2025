
import { useState, useEffect, useCallback } from 'react';
import { SavedSetup } from '../types';
import { storageService } from '../services/storageService';

const STORAGE_KEY = 'setups';

export const useSetupManager = () => {
    const [savedSetups, setSavedSetups] = useState<SavedSetup[]>(() =>
        storageService.getItem<SavedSetup[]>(STORAGE_KEY, [])
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, savedSetups);
    }, [savedSetups]);

    const addSetup = useCallback((setup: Omit<SavedSetup, 'id' | 'createdAt'>) => {
        const newSetup: SavedSetup = {
            ...setup,
            id: `setup-${Date.now()}`,
            createdAt: Date.now(),
        };
        setSavedSetups(prev => [newSetup, ...prev]);
    }, []);

    const updateSetup = useCallback((updatedSetup: SavedSetup) => {
        setSavedSetups(prev => prev.map(s => s.id === updatedSetup.id ? updatedSetup : s));
    }, []);

    const deleteSetup = useCallback((setupId: string) => {
        setSavedSetups(prev => prev.filter(s => s.id !== setupId));
    }, []);

    return { savedSetups, addSetup, updateSetup, deleteSetup };
};
