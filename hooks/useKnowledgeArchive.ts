
import { useState, useEffect, useCallback } from 'react';
import { ArchivedMentorResponse } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useTranslations } from './useTranslations';
import { storageService } from '../services/storageService';

const STORAGE_KEY = 'knowledge-archive';

export const useKnowledgeArchive = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [responses, setResponses] = useState<ArchivedMentorResponse[]>(() =>
        storageService.getItem<ArchivedMentorResponse[]>(STORAGE_KEY, [])
    );

    useEffect(() => {
        storageService.setItem(STORAGE_KEY, responses);
    }, [responses]);

    const addResponse = useCallback((response: Omit<ArchivedMentorResponse, 'id' | 'createdAt'>) => {
        const newResponse: ArchivedMentorResponse = {
            ...response,
            id: `mentor-response-${Date.now()}`,
            createdAt: Date.now(),
        };
        setResponses(prev => [newResponse, ...prev].slice(0, 100)); // Keep max 100 responses
        addNotification(t('knowledgeView.archive.saveSuccess'), 'success');
    }, [addNotification, t]);

    const updateResponse = useCallback((updatedResponse: ArchivedMentorResponse) => {
        setResponses(prev => prev.map(res => res.id === updatedResponse.id ? updatedResponse : res));
        addNotification(t('knowledgeView.archive.updateSuccess'), 'success');
    }, [addNotification, t]);


    const deleteResponse = useCallback((id: string) => {
        if(window.confirm(t('knowledgeView.archive.deleteConfirm'))) {
            setResponses(prev => prev.filter(res => res.id !== id));
            addNotification(t('knowledgeView.archive.deleteSuccess'), 'info');
        }
    }, [addNotification, t]);

    return { responses, addResponse, updateResponse, deleteResponse };
};