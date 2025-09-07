import { useState, useEffect, useCallback } from 'react';
import { ArchivedMentorResponse } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useTranslations } from './useTranslations';

const STORAGE_KEY = 'cannabis-grow-guide-knowledge-archive';

export const useKnowledgeArchive = () => {
    const { addNotification } = useNotifications();
    const { t } = useTranslations();
    const [responses, setResponses] = useState<ArchivedMentorResponse[]>(() => {
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
        } catch (e) {
            console.error("Failed to save knowledge archive to localStorage", e);
        }
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