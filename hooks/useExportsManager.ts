
import { useState, useEffect, useCallback } from 'react';
import { SavedExport } from '../types';
import { storageService } from '../services/storageService';

const STORAGE_KEY = 'exports';

export const useExportsManager = () => {
    const [savedExports, setSavedExports] = useState<SavedExport[]>(() =>
        storageService.getItem<SavedExport[]>(STORAGE_KEY, [])
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, savedExports);
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
