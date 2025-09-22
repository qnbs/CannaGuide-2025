import { useState, useEffect, useCallback } from 'react';
import { storageService } from '@/services/storageService';

const STORAGE_KEY = 'strain_notes';

export const useStrainNotes = () => {
    const [notes, setNotes] = useState<Record<string, string>>(() =>
        storageService.getItem(STORAGE_KEY, {})
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, notes);
    }, [notes]);

    const getNoteForStrain = useCallback((strainId: string): string => {
        return notes[strainId] || '';
    }, [notes]);
    
    const updateNoteForStrain = useCallback((strainId: string, content: string) => {
        setNotes(prev => ({
            ...prev,
            [strainId]: content
        }));
    }, []);

    return { getNoteForStrain, updateNoteForStrain };
};