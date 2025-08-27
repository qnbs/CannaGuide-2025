import { useState, useEffect, useCallback } from 'react';
import { KnowledgeProgress } from '../types';

const STORAGE_KEY = 'cannabis-grow-guide-knowledge-progress';

export const useKnowledgeProgress = () => {
    const [progress, setProgress] = useState<KnowledgeProgress>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.error("Failed to save knowledge progress to localStorage", e);
        }
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