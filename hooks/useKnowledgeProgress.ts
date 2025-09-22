

import { useState, useEffect, useCallback } from 'react';
import { KnowledgeProgress } from '@/types';
import { storageService } from '@/services/storageService';

const STORAGE_KEY = 'knowledge-progress';

export const useKnowledgeProgress = () => {
    const [progress, setProgress] = useState<KnowledgeProgress>(() => 
        storageService.getItem(STORAGE_KEY, {})
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, progress);
    }, [progress]);

    const toggleItem = useCallback((sectionId: string, itemId: string) => {
        setProgress(prev => {
            const newProgress = { ...prev };
            const sectionItems = new Set(newProgress[sectionId] || []);
            
            if (sectionItems.has(itemId)) {
                sectionItems.delete(itemId);
            } else {
                sectionItems.add(itemId);
            }

            newProgress[sectionId] = Array.from(sectionItems);
            return newProgress;
        });
    }, []);

    return { progress, toggleItem };
};