import { useState, useEffect, useCallback } from 'react';
import { SavedSetup } from '../types';

const STORAGE_KEY = 'cannabis-grow-guide-setups';

export const useSetupManager = () => {
    const [savedSetups, setSavedSetups] = useState<SavedSetup[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("Failed to load saved setups from local storage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSetups));
        } catch (error) {
            console.error("Failed to save setups to local storage", error);
        }
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