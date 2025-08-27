import { useState, useEffect, useCallback } from 'react';
import { SavedExport } from '../types';

const STORAGE_KEY = 'cannabis-grow-guide-exports';

export const useExportsManager = () => {
    const [savedExports, setSavedExports] = useState<SavedExport[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedExports));
        } catch (e) {
            console.error("Failed to save exports to localStorage", e);
        }
    }, [savedExports]);

    const addExport = useCallback((newExport: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[]) => {
        const exportToAdd: SavedExport = {
            ...newExport,
            id: Date.now().toString(),
            createdAt: Date.now(),
            count: strainIds.length,
            strainIds,
        };
        setSavedExports(prev => [exportToAdd, ...prev].slice(0, 50)); // Keep max 50 exports
        return exportToAdd;
    }, []);

    const deleteExport = useCallback((exportId: string) => {
        setSavedExports(prev => prev.filter(exp => exp.id !== exportId));
    }, []);

    return { savedExports, addExport, deleteExport };
};
