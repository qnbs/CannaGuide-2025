
import { useState, useEffect, useCallback } from 'react';
import { ArchivedAdvisorResponse, AIResponse, Plant } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useTranslations } from './useTranslations';
import { storageService } from '../services/storageService';

const STORAGE_KEY = 'plant-advisor-archive';

type PlantAdvisorArchive = Record<string, ArchivedAdvisorResponse[]>;

export const usePlantAdvisorArchive = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();

    const [archive, setArchive] = useState<PlantAdvisorArchive>(() => 
        storageService.getItem(STORAGE_KEY, {})
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, archive);
    }, [archive]);

    const addAdvisorResponse = useCallback((plantId: string, response: AIResponse, query: string) => {
        setArchive(prev => {
            const plantArchive = prev[plantId] || [];
            const newResponse: ArchivedAdvisorResponse = {
                ...response,
                id: `advisor-${plantId}-${Date.now()}`,
                createdAt: Date.now(),
                plantId,
                query,
                plantStage: (JSON.parse(query) as Plant).stage,
            };
            const updatedArchive = [newResponse, ...plantArchive].slice(0, 50); // Keep max 50 responses per plant
            return { ...prev, [plantId]: updatedArchive };
        });
        addNotification(t('knowledgeView.archive.saveSuccess'), 'success');
    }, [addNotification, t]);

    const updateAdvisorResponse = useCallback((updatedResponse: ArchivedAdvisorResponse) => {
        setArchive(prev => {
            const plantArchive = prev[updatedResponse.plantId] || [];
            const updatedPlantArchive = plantArchive.map(res => 
                res.id === updatedResponse.id ? updatedResponse : res
            );
            return { ...prev, [updatedResponse.plantId]: updatedPlantArchive };
        });
        addNotification(t('knowledgeView.archive.updateSuccess'), 'success');
    }, [addNotification, t]);

    const deleteAdvisorResponse = useCallback((plantId: string, responseId: string) => {
        if(window.confirm(t('knowledgeView.archive.deleteConfirm'))) {
            setArchive(prev => {
                const plantArchive = prev[plantId] || [];
                const updatedPlantArchive = plantArchive.filter(res => res.id !== responseId);
                 if (updatedPlantArchive.length === 0) {
                    const newArchive = { ...prev };
                    delete newArchive[plantId];
                    return newArchive;
                }
                return { ...prev, [plantId]: updatedPlantArchive };
            });
            addNotification(t('knowledgeView.archive.deleteSuccess'), 'info');
        }
    }, [addNotification, t]);

    return { archive, addAdvisorResponse, updateAdvisorResponse, deleteAdvisorResponse };
};
