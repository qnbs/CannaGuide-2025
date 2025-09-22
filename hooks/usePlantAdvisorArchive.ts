import { useState, useEffect, useCallback } from 'react';
import { ArchivedAdvisorResponse, AIResponse, PlantStage } from '@/types';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';
import { storageService } from '@/services/storageService';

const STORAGE_KEY = 'plant-advisor-archive';

type PlantAdvisorArchive = Record<string, ArchivedAdvisorResponse[]>;

export const usePlantAdvisorArchive = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [archive, setArchive] = useState<PlantAdvisorArchive>(() =>
        storageService.getItem<PlantAdvisorArchive>(STORAGE_KEY, {})
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, archive);
    }, [archive]);

    const addResponse = useCallback((plantId: string, response: AIResponse, query: string) => {
        const plant = JSON.parse(query);
        const newResponse: ArchivedAdvisorResponse = {
            ...response,
            id: `advisor-${Date.now()}`,
            createdAt: Date.now(),
            plantId: plantId,
            plantStage: plant.stage as PlantStage,
            query: query,
        };
        setArchive(prev => {
            const plantArchive = prev[plantId] ? [newResponse, ...prev[plantId]] : [newResponse];
            return {
                ...prev,
                [plantId]: plantArchive.slice(0, 50) // Keep max 50 responses per plant
            };
        });
        addNotification(t('knowledgeView.archive.saveSuccess'), 'success');
    }, [addNotification, t]);

    const updateResponse = useCallback((updatedResponse: ArchivedAdvisorResponse) => {
        setArchive(prev => {
            const plantArchive = (prev[updatedResponse.plantId] || []).map(res => 
                res.id === updatedResponse.id ? updatedResponse : res
            );
            return { ...prev, [updatedResponse.plantId]: plantArchive };
        });
        addNotification(t('knowledgeView.archive.updateSuccess'), 'success');
    }, [addNotification, t]);


    const deleteResponse = useCallback((plantId: string, responseId: string) => {
        if(window.confirm(t('knowledgeView.archive.deleteConfirm'))) {
            setArchive(prev => {
                const plantArchive = (prev[plantId] || []).filter(res => res.id !== responseId);
                return { ...prev, [plantId]: plantArchive };
            });
            addNotification(t('knowledgeView.archive.deleteSuccess'), 'info');
        }
    }, [addNotification, t]);

    return { archive, addResponse, updateResponse, deleteResponse };
};